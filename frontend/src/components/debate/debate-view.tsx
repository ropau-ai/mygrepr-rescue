'use client';

import React, { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Play, RotateCcw, Share2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post } from '@/types/post';
import { getSourceColor } from '@/lib/design-tokens';
import { RopauSigilStamp, SparkleMark } from './ropau-sigil';

type Persona = 'sceptique' | 'riskeur';

type Turn = {
  persona: Persona;
  text: string;
  status: 'streaming' | 'done';
};

type Verdict = {
  agreements: string[];
  frictions: string[];
};

type PersonaMeta = {
  id: Persona;
  name: string;
  tagline: string;
};

type Phase = 'idle' | 'streaming' | 'verdict' | 'error';

type Meta = {
  title?: string;
  personas?: PersonaMeta[];
};

const PERSONAS: Record<
  Persona,
  { label: string; roleLabel: string; tagline: string; accent: 'ink' | 'crimson'; pill: string }
> = {
  sceptique: {
    label: 'Le Sceptique',
    roleLabel: 'Fondamentaux',
    tagline: 'Cashflow, chiffres, allergique au hype.',
    accent: 'ink',
    pill: 'I',
  },
  riskeur: {
    label: 'Le Riskeur',
    roleLabel: 'Convexité',
    tagline: 'Growth, contrariant, paris asymétriques.',
    accent: 'crimson',
    pill: 'II',
  },
};

const TOTAL_TURNS = 4;

export function DebateView({ post }: { post: Post }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [meta, setMeta] = useState<Meta>({});
  const [runKey, setRunKey] = useState(0);

  const abortRef = useRef<AbortController | null>(null);
  const sceptiqueRef = useRef<HTMLDivElement | null>(null);
  const riskeurRef = useRef<HTMLDivElement | null>(null);

  const sourceClass = useMemo(() => getSourceColor(post.subreddit), [post.subreddit]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setTurns([]);
    setActivePersona(null);
    setVerdict(null);
    setErrorMsg(null);
    setMeta({});
    setPhase('idle');
  }, []);

  const startDebate = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setTurns([]);
    setActivePersona(null);
    setVerdict(null);
    setErrorMsg(null);
    setMeta({});
    setPhase('streaming');

    const handleEvent = (event: string, data: unknown) => {
      if (event === 'meta') {
        const m = data as { title?: string; personas?: PersonaMeta[] };
        setMeta({ title: m.title, personas: m.personas });
        return;
      }
      if (event === 'turn_start') {
        const t = data as { persona: Persona };
        setActivePersona(t.persona);
        setTurns((prev) => [...prev, { persona: t.persona, text: '', status: 'streaming' }]);
        return;
      }
      if (event === 'token') {
        const t = data as { persona: Persona; text: string };
        setTurns((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          if (last.persona !== t.persona) return prev;
          return [...prev.slice(0, -1), { ...last, text: last.text + t.text }];
        });
        return;
      }
      if (event === 'turn_end') {
        setTurns((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          return [...prev.slice(0, -1), { ...last, status: 'done' }];
        });
        return;
      }
      if (event === 'verdict') {
        const v = data as Verdict;
        setVerdict(v);
        setActivePersona(null);
        setPhase('verdict');
        return;
      }
      if (event === 'error') {
        const e = data as { message?: string };
        setErrorMsg(e.message || 'Le flux a été interrompu.');
        setPhase('error');
      }
    };

    try {
      const res = await fetch(`/api/debate/${encodeURIComponent(post.reddit_id)}`, {
        signal: controller.signal,
        headers: { Accept: 'text/event-stream' },
      });

      if (!res.ok || !res.body) {
        throw new Error(`Stream HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const chunk of parts) {
          if (!chunk.trim()) continue;

          let eventName = 'message';
          const dataLines: string[] = [];
          for (const rawLine of chunk.split('\n')) {
            const line = rawLine.trimEnd();
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
          }

          if (dataLines.length === 0) continue;

          let payload: unknown = null;
          try {
            payload = JSON.parse(dataLines.join('\n'));
          } catch {
            continue;
          }

          handleEvent(eventName, payload);
        }
      }
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') return;
      setErrorMsg((err as Error).message || 'Erreur inconnue');
      setPhase('error');
    }
  }, [post.reddit_id]);

  useEffect(() => {
    if (runKey === 0) return;
    startDebate();
    return () => {
      abortRef.current?.abort();
    };
  }, [runKey, startDebate]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // Autoscroll each column as streaming lands
  useEffect(() => {
    if (!activePersona) return;
    const el = activePersona === 'sceptique' ? sceptiqueRef.current : riskeurRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, activePersona]);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const sceptiqueTurns = turns.filter((t) => t.persona === 'sceptique');
  const riskeurTurns = turns.filter((t) => t.persona === 'riskeur');
  const progressCount = turns.filter((t) => t.status === 'done').length;

  return (
    <main className="min-h-screen bg-[var(--editorial-bg)] text-foreground">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        {/* Top row */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            href={`/posts/${post.reddit_id}`}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Retour au post
          </Link>
          <RopauSigilStamp className="hidden sm:inline-flex" />
        </div>

        {/* Subject header */}
        <header className="mb-10 pb-8 border-b border-[var(--warm-border)]">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--ropau-crimson)] dark:text-[#FF6B85] inline-flex items-center gap-1.5">
              <SparkleMark size={10} /> Débat IA
            </span>
            <div className="h-px w-10 bg-[color:var(--ropau-crimson)]/50" />
            <span
              className={cn(
                'inline-flex items-center justify-center px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-sm',
                sourceClass
              )}
            >
              r/{post.subreddit}
            </span>
            {post.category && (
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-sm tracking-wide uppercase">
                {post.category}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight text-foreground mb-3">
            {post.title}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Deux personas Ropau s&apos;affrontent en streaming sur ce post.
            Le Sceptique tient les fondamentaux, Le Riskeur assume la convexité.
            Quatre tours, un verdict — trois points d&apos;accord, deux points de friction irréductibles.
          </p>
        </header>

        {/* Launch / rerun strip */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {phase === 'idle' && (
            <button
              onClick={() => setRunKey((k) => k + 1)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-[color:var(--ropau-crimson)] text-white text-xs font-bold uppercase tracking-[0.15em] hover:bg-[#b81033] transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Lancer le débat
            </button>
          )}
          {(phase === 'verdict' || phase === 'error') && (
            <button
              onClick={() => {
                reset();
                setRunKey((k) => k + 1);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border border-[var(--warm-border)] text-xs font-bold uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200 hover:border-[color:var(--ropau-crimson)] hover:text-[color:var(--ropau-crimson)] transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rejouer
            </button>
          )}
          {phase !== 'idle' && (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border border-[var(--warm-border)] text-xs font-bold uppercase tracking-[0.15em] text-slate-700 dark:text-slate-200 hover:border-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" /> URL copiée
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" /> Partager
                </>
              )}
            </button>
          )}
          {phase === 'streaming' && (
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--ropau-crimson)] animate-pulse" />
              Streaming · {progressCount}/{TOTAL_TURNS}
            </span>
          )}
        </div>

        {/* Split-screen debate */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-6 border-t border-[var(--warm-border)]">
          <DebateColumn
            ref={sceptiqueRef}
            persona="sceptique"
            turns={sceptiqueTurns}
            active={activePersona === 'sceptique'}
            hasStarted={phase !== 'idle'}
          />
          <DebateColumn
            ref={riskeurRef}
            persona="riskeur"
            turns={riskeurTurns}
            active={activePersona === 'riskeur'}
            hasStarted={phase !== 'idle'}
          />
        </div>

        {/* Progress ticks */}
        {phase !== 'idle' && (
          <div className="mt-6 flex items-center justify-center gap-2">
            {Array.from({ length: TOTAL_TURNS }).map((_, i) => {
              const turn = turns[i];
              const state = !turn ? 'pending' : turn.status === 'done' ? 'done' : 'active';
              return (
                <span
                  key={i}
                  className={cn(
                    'h-1 w-8 rounded-full transition-all',
                    state === 'done' && 'bg-[color:var(--ropau-crimson)]',
                    state === 'active' && 'bg-[color:var(--ropau-crimson)]/50 animate-pulse',
                    state === 'pending' && 'bg-[var(--warm-border)]'
                  )}
                />
              );
            })}
          </div>
        )}

        {/* Verdict */}
        {verdict && <VerdictPanel verdict={verdict} />}

        {/* Error */}
        {errorMsg && phase === 'error' && (
          <div className="mt-10 border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-5 rounded-sm text-sm text-rose-700 dark:text-rose-300">
            <strong className="font-bold">Flux interrompu.</strong> {errorMsg}
          </div>
        )}

        {meta.personas && (
          <div className="sr-only" aria-hidden={false}>
            {meta.personas.map((p) => `${p.name}: ${p.tagline}`).join(' — ')}
          </div>
        )}

        <div className="mt-10 sm:hidden flex justify-center">
          <RopauSigilStamp />
        </div>
      </div>
    </main>
  );
}

interface DebateColumnProps {
  persona: Persona;
  turns: Turn[];
  active: boolean;
  hasStarted: boolean;
}

const DebateColumn = forwardRef<HTMLDivElement, DebateColumnProps>(function DebateColumn(
  { persona, turns, active, hasStarted },
  ref
) {
  const meta = PERSONAS[persona];
  const isCrimson = meta.accent === 'crimson';
  const isStreaming =
    active && turns.length > 0 && turns[turns.length - 1].status === 'streaming';

  return (
    <section
      className={cn(
        'relative pt-6 pb-8 md:px-5 transition-all duration-300',
        'min-h-[420px] md:min-h-[520px]',
        'border-b md:border-b-0 md:border-r border-[var(--warm-border)] last:border-r-0 last:border-b-0',
        hasStarted && !active && 'opacity-55',
        active && 'opacity-100'
      )}
      data-persona={persona}
      data-active={active}
    >
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              'inline-flex items-center justify-center h-7 w-7 rounded-full font-mono font-bold text-[11px] tabular-nums',
              isCrimson
                ? 'bg-[color:var(--ropau-crimson)] text-white'
                : 'bg-[color:var(--debate-sceptique-ink)] text-white'
            )}
          >
            {meta.pill}
          </span>
          <div className="min-w-0">
            <div
              className={cn(
                'text-base md:text-lg font-bold leading-tight truncate',
                isCrimson
                  ? 'text-[color:var(--ropau-crimson)]'
                  : 'text-[color:var(--debate-sceptique-ink)]'
              )}
            >
              {meta.label}
            </div>
            <div
              className={cn(
                'text-[10px] font-bold uppercase tracking-[0.2em]',
                isCrimson
                  ? 'text-[color:var(--ropau-crimson)]/70'
                  : 'text-[color:var(--debate-sceptique-muted)]'
              )}
            >
              {meta.roleLabel}
            </div>
          </div>
        </div>
        {active && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em]',
              isCrimson
                ? 'text-[color:var(--ropau-crimson)]'
                : 'text-[color:var(--debate-sceptique-ink)]'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full animate-pulse',
                isCrimson
                  ? 'bg-[color:var(--ropau-crimson)]'
                  : 'bg-[color:var(--debate-sceptique-ink)]'
              )}
            />
            En train d&apos;écrire
          </span>
        )}
      </header>

      <p
        className={cn(
          'text-[11px] mb-5 italic max-w-prose',
          isCrimson
            ? 'text-[color:var(--ropau-crimson)]/70'
            : 'text-[color:var(--debate-sceptique-muted)]'
        )}
      >
        {meta.tagline}
      </p>

      <div
        ref={ref}
        className={cn(
          'space-y-5 max-h-[360px] md:max-h-[440px] overflow-y-auto pr-1',
          'text-[15px] leading-[1.65]'
        )}
      >
        {turns.length === 0 && hasStarted && (
          <p
            className={cn(
              'text-sm italic',
              isCrimson
                ? 'text-[color:var(--ropau-crimson)]/60'
                : 'text-[color:var(--debate-sceptique-muted)]'
            )}
          >
            En attente du tour…
          </p>
        )}
        {turns.map((turn, idx) => {
          const turnNumber = idx * 2 + (isCrimson ? 2 : 1);
          return (
            <div
              key={idx}
              className={cn(
                'p-4 rounded-sm border',
                isCrimson
                  ? 'bg-[color:var(--debate-riskeur-surface)] border-[color:var(--ropau-crimson)]/20 text-[color:var(--debate-riskeur-ink)]'
                  : 'bg-[color:var(--debate-sceptique-surface)] border-[color:var(--debate-sceptique-ink)]/10 text-[color:var(--debate-sceptique-ink)]'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-between mb-2 text-[10px] font-mono tabular-nums uppercase tracking-[0.2em]',
                  isCrimson
                    ? 'text-[color:var(--ropau-crimson)]/70'
                    : 'text-[color:var(--debate-sceptique-muted)]'
                )}
              >
                <span>
                  Tour {turnNumber}/{TOTAL_TURNS}
                </span>
                {turn.status === 'streaming' && <span>▌</span>}
              </div>
              <p className="whitespace-pre-wrap">
                {turn.text}
                {turn.status === 'streaming' && (
                  <span className="inline-block w-2 h-4 ml-0.5 align-middle animate-pulse bg-current opacity-70" />
                )}
              </p>
            </div>
          );
        })}
        {!hasStarted && (
          <div
            className={cn(
              'flex flex-col items-start gap-2 text-sm',
              isCrimson
                ? 'text-[color:var(--ropau-crimson)]/70'
                : 'text-[color:var(--debate-sceptique-muted)]'
            )}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Persona figé</span>
            <p className="italic">{meta.tagline}</p>
          </div>
        )}
      </div>

      {isCrimson && (
        <SparkleMark
          className="absolute top-3 right-3 text-[color:var(--ropau-crimson)]/30"
          size={16}
        />
      )}
      {isStreaming && (
        <span
          className={cn(
            'absolute left-0 top-0 bottom-0 w-0.5',
            isCrimson
              ? 'bg-[color:var(--ropau-crimson)]'
              : 'bg-[color:var(--debate-sceptique-ink)]'
          )}
        />
      )}
    </section>
  );
});

function VerdictPanel({ verdict }: { verdict: Verdict }) {
  return (
    <section className="mt-12 relative">
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-sm bg-[color:var(--ropau-crimson)] text-white text-[10px] font-bold uppercase tracking-[0.25em] inline-flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" />
        Verdict
      </div>

      <div className="border border-[color:var(--ropau-crimson)]/30 bg-[var(--paper-bg)] rounded-sm p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[color:var(--ropau-crimson)]">
                Terrain commun
              </span>
              <div className="h-px flex-1 bg-[color:var(--ropau-crimson)]/30" />
            </div>
            <ol className="space-y-4">
              {verdict.agreements.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="shrink-0 font-mono text-3xl font-bold leading-none text-[color:var(--ropau-crimson)] tabular-nums">
                    0{i + 1}
                  </span>
                  <p className="text-[15px] leading-[1.6] text-foreground pt-1">{item}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="md:col-span-2 md:border-l md:border-[color:var(--ropau-crimson)]/20 md:pl-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[color:var(--ropau-crimson)]">
                Points de friction
              </span>
              <div className="h-px flex-1 bg-[color:var(--ropau-crimson)]/30" />
            </div>
            <ul className="space-y-5">
              {verdict.frictions.map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="shrink-0 inline-flex items-center justify-center h-7 w-7 rounded-full border border-[color:var(--ropau-crimson)] text-[color:var(--ropau-crimson)] font-mono font-bold text-[11px] tabular-nums">
                    !{i + 1}
                  </span>
                  <p className="text-[15px] leading-[1.55] text-foreground italic">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
