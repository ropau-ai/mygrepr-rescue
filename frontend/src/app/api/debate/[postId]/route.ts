import type { NextRequest } from 'next/server';
import { fetchPostByRedditId } from '@/lib/nocodb';
import type { Post } from '@/types/post';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Real SSE debate endpoint — Groq LLaMA 3.3 70B, streamed token-by-token.
// Contract consumed by components/debate/debate-view.tsx:
//   event: meta         data: { post_id, title, category, subreddit, personas, total_turns, source }
//   event: turn_start   data: { turn, persona }
//   event: token        data: { turn, persona, text }
//   event: turn_end     data: { turn, persona }
//   event: verdict      data: { agreements: [3], frictions: [2] }
//   event: done         data: {}
//   event: error        data: { message }
//
// Constraints (BRIEF_GREPR_DEBATE_API.md):
//   - 4-6 tours alternés, chaque persona voit les précédents (6 tours ici).
//   - Pas de persistance, rate limit concurrent 3/IP, premier token < 2s, français.

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const TOTAL_TURNS = 6;
const MAX_CONCURRENT_PER_IP = 3;

type PersonaId = 'sceptique' | 'riskeur';

const PERSONA_META: Record<PersonaId, { name: string; tagline: string }> = {
  sceptique: {
    name: 'Le Sceptique',
    tagline: 'Cashflow, fondamentaux, allergique au hype.',
  },
  riskeur: {
    name: 'Le Riskeur',
    tagline: 'Growth, contrariant, paris asymétriques.',
  },
};

const activeByIp = new Map<string, number>();

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function personaSystem(id: PersonaId): string {
  if (id === 'sceptique') {
    return `Tu es « Le Sceptique », analyste fondamentaliste pragmatique, allergique au hype et aux promesses non chiffrées. Tu parles français.

Méthode :
- Tu cites des chiffres ou des ratios précis : P/E, FCF yield, ratio d'endettement, DCF, marge opérationnelle, TRI, yield net, burn rate, ratio prix/revenu locatif, TMI, frais d'enveloppe.
- Tu détectes les biais : recency bias, survivor bias, projections linéaires, extrapolation sur petit échantillon.
- Tu n'attaques jamais la personne, tu attaques les hypothèses et les montants.
- Si un chiffre manque, tu l'exiges plutôt que de l'inventer.
- Tu écris 4 à 7 phrases denses, en « je », sans liste à puces, sans markdown, sans titres.
- Jamais d'insulte, jamais de condescendance. Le désaccord se fait par la rigueur.

Ton : sobre, direct, précis. Tu clos tes interventions par une exigence de chiffre ou une question dérangeante.`;
  }
  return `Tu es « Le Riskeur », gérant contrariant à paris asymétriques, allergique au consensus tiède et à la prudence par défaut. Tu parles français.

Méthode :
- Tu cites des chiffres : TAM, CAGR, convexité du payoff, pari de Kelly fractionnaire, option value, ratio Sharpe asymétrique, drawdown acceptable, horizon de détention.
- Tu respectes les chiffres du Sceptique quand ils tiennent, mais tu montres où il rate l'optionalité, le scénario long-tail, l'arbitrage informationnel.
- Tu n'attaques jamais la personne. Tu attaques la timidité des hypothèses, la moyennisation, le biais de regret asymétrique.
- Tu écris 4 à 7 phrases denses, en « je », sans liste à puces, sans markdown, sans titres.
- Jamais d'insulte, jamais de posture « bro ». Le désaccord se fait par la thèse.

Ton : vif, argumenté, contrariant. Tu clos tes interventions par un pari explicite : ce que tu ferais, à quel horizon, avec quel capital.`;
}

function verdictSystem(): string {
  return `Tu es un observateur neutre qui lit un débat entre « Le Sceptique » (fondamentaliste) et « Le Riskeur » (contrariant growth). Ta tâche : extraire la structure du désaccord.

Règles :
- 3 points d'accord concrets où les deux personas convergent (chiffres, faits, méthodes partagés). Pas de banalités.
- 2 points de friction irréductibles : désaccords qui ne se résolvent PAS par plus d'information. Ce sont des divergences de méthode, de préférence temporelle ou de tolérance au risque.
- Langue : français. Pas d'englishisme gratuit.
- Réponds STRICTEMENT en JSON, sans texte autour, sans markdown, sans backticks. Clés exactes.

Format attendu :
{"agreements": ["…", "…", "…"], "frictions": ["…", "…"]}`;
}

function postContext(post: Post): string {
  const title = post.title ?? '';
  const selftext = (post.selftext ?? '').slice(0, 2500);
  const subreddit = post.subreddit ?? '';
  const category = post.category ?? '';
  return `Post Reddit — r/${subreddit} — catégorie: ${category}

TITRE
${title}

CONTENU
${selftext || '(pas de corps, seulement le titre)'}`;
}

async function streamGroqTokens(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  onToken: (delta: string) => void,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      stream: true,
      temperature: 0.8,
      max_tokens: 420,
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Groq ${res.status}: ${txt.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx;
    while ((idx = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return full;
      try {
        const obj = JSON.parse(payload);
        const delta = obj.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          full += delta;
          onToken(delta);
        }
      } catch {
        // Ignore partial frames / keep-alives
      }
    }
  }
  return full;
}

async function callGroqJSON(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  signal: AbortSignal,
): Promise<{ agreements: string[]; frictions: string[] }> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      stream: false,
      temperature: 0.25,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    }),
    signal,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Groq ${res.status}: ${txt.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);

  return {
    agreements: Array.isArray(parsed?.agreements)
      ? parsed.agreements.map(String).slice(0, 3)
      : [],
    frictions: Array.isArray(parsed?.frictions)
      ? parsed.frictions.map(String).slice(0, 2)
      : [],
  };
}

function personasPayload() {
  return (Object.keys(PERSONA_META) as PersonaId[]).map((id) => ({
    id,
    name: PERSONA_META[id].name,
    tagline: PERSONA_META[id].tagline,
  }));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  const ip = getClientIP(req);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response('GROQ_API_KEY manquante côté serveur', { status: 500 });
  }

  const current = activeByIp.get(ip) ?? 0;
  if (current >= MAX_CONCURRENT_PER_IP) {
    return new Response(
      `Limite ${MAX_CONCURRENT_PER_IP} débats simultanés atteinte pour cette IP`,
      { status: 429, headers: { 'Retry-After': '10' } },
    );
  }
  activeByIp.set(ip, current + 1);

  const encoder = new TextEncoder();
  const upstreamAbort = new AbortController();
  let released = false;

  const release = () => {
    if (released) return;
    released = true;
    const c = activeByIp.get(ip) ?? 1;
    if (c <= 1) activeByIp.delete(ip);
    else activeByIp.set(ip, c - 1);
  };

  const onClientAbort = () => {
    upstreamAbort.abort();
    release();
  };
  req.signal.addEventListener('abort', onClientAbort);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        const line = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(line));
        } catch {
          closed = true;
        }
      };
      const closeStream = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      try {
        // Immediate heartbeat — TTFT < 2s even if NocoDB is slow.
        send('meta', {
          post_id: postId,
          source: 'groq',
          stage: 'starting',
          personas: personasPayload(),
          total_turns: TOTAL_TURNS,
        });

        let post: Post | null;
        try {
          post = await fetchPostByRedditId(postId);
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Erreur inconnue';
          send('error', { message: `NocoDB indisponible : ${msg}` });
          return;
        }
        if (!post) {
          send('error', { message: `Post introuvable : ${postId}` });
          return;
        }

        const ctx = postContext(post);

        send('meta', {
          post_id: post.reddit_id,
          title: post.title,
          category: post.category,
          subreddit: post.subreddit,
          personas: personasPayload(),
          total_turns: TOTAL_TURNS,
          source: 'groq',
          stage: 'ready',
        });

        const transcript: Array<{ persona: PersonaId; text: string }> = [];

        for (let turn = 1; turn <= TOTAL_TURNS; turn++) {
          const persona: PersonaId = turn % 2 === 1 ? 'sceptique' : 'riskeur';

          const priorRendered = transcript
            .map(
              (t) => `[${PERSONA_META[t.persona].name}]\n${t.text}`,
            )
            .join('\n\n');

          const userMsg =
            transcript.length === 0
              ? `${ctx}\n\n--- TON TOUR ---\nOuvre le débat. Prends position franchement, cite au moins un chiffre ou un ratio précis, 4 à 7 phrases.`
              : `${ctx}\n\n--- DÉBAT EN COURS ---\n${priorRendered}\n\n--- TON TOUR ---\nTu es ${PERSONA_META[persona].name}. Réponds directement à l'argument précédent sans le paraphraser, apporte ton angle distinct, cite au moins un chiffre concret. 4 à 7 phrases.`;

          send('turn_start', { turn, persona });

          let full = '';
          try {
            full = await streamGroqTokens(
              [
                { role: 'system', content: personaSystem(persona) },
                { role: 'user', content: userMsg },
              ],
              apiKey,
              (delta) => send('token', { turn, persona, text: delta }),
              upstreamAbort.signal,
            );
          } catch (e) {
            const msg = e instanceof Error ? e.message : 'Erreur inconnue';
            send('error', { message: `Groq (tour ${turn}) : ${msg}` });
            return;
          }

          send('turn_end', { turn, persona });
          transcript.push({ persona, text: full });
        }

        let verdict;
        try {
          verdict = await callGroqJSON(
            [
              { role: 'system', content: verdictSystem() },
              {
                role: 'user',
                content: `${ctx}\n\n--- DÉBAT COMPLET ---\n${transcript
                  .map((t) => `[${PERSONA_META[t.persona].name}]\n${t.text}`)
                  .join(
                    '\n\n',
                  )}\n\n--- VERDICT ---\nProduis l'objet JSON avec exactement 3 accords et 2 frictions.`,
              },
            ],
            apiKey,
            upstreamAbort.signal,
          );
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Erreur inconnue';
          send('error', { message: `Groq (verdict) : ${msg}` });
          return;
        }

        send('verdict', verdict);
        send('done', {});
      } finally {
        req.signal.removeEventListener('abort', onClientAbort);
        release();
        closeStream();
      }
    },
    cancel() {
      upstreamAbort.abort();
      release();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
