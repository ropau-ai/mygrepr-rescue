# mygrepr-rescue

> Fork de [Jelil-ah/mygrepr](https://github.com/Jelil-ah/mygrepr) — scheduler refactoré + feature *The Debate* greffée par [Ropau](https://ropau.fr).
>
> Live : **https://mygrepr-rescue.vercel.app** (sans login, sans captcha).
>
> Mainteneur amont : [@adissa00](https://x.com/adissa00).

## Pour Doffy

Salut,

Tu as dit publiquement que le scheduler de Grepr était plafonné et que tu avais laissé dormir le projet. On a lu le code un soir avec Claude (Ropau), on a tapé pendant une heure en live sur X, et voilà ce qui sort. Tu peux tout reprendre, mainteneur upstream c'est toi — on n'a pas ouvert de PR chez toi, on voulait d'abord que tu voies tourner avant de décider. L'URL ci-dessus est greffée, pas concurrente.

Ce README résume ce qui a bougé, pourquoi, et comment le relancer. Si un choix te paraît mauvais, on l'enlève.

— Robin & Claude

---

## 1 · Diagnostic du scheduler original

`scheduler_legacy.py` (renommé 1:1 depuis ton `scheduler.py` d'avant le rescue, laissé dans le repo pour preuve) :

| Symptôme | Code | Effet au runtime |
|---|---|---|
| Sleep fixe 8s entre chaque appel IA | `time.sleep(8)` | Plafonne à ~7 posts/min indépendamment de la latence réseau |
| Fetch subs séquentiel | `for sub in SUBREDDITS: fetch_subreddit_posts(sub, ...)` | 10+ subs traités l'un après l'autre, I/O-bound non exploité |
| Pas de backoff 429 | `retry_with_backoff` jamais instrumenté sur les 429 | Un rate-limit Groq = posts perdus du run |
| Pas de priorité HOT / COLD | Un seul `time_filter` par run | Le backfill historique bloque l'ingestion du jour si le budget claque |

Résultat : ingestion quotidienne qui ne tient plus quand Groq rate-limite. Rien de « mal écrit » — c'est du code qui a fait son travail pour apprendre l'immo et les ETFs. C'est juste l'orchestration qui coince.

## 2 · Ce qu'on a changé (et ce qu'on n'a PAS changé)

On **garde** : Groq free tier, PullPush.io + PRAW, NocoDB, le schéma de posts, la commande `scheduler.py`, ses subcommands `status`/`reset`/`dry`/`loop`.

On **change** uniquement l'orchestration, dans `scheduler.py` :

1. **File HOT / file COLD avec priorité**
   HOT = posts du jour (`sort=new`, `time_filter=day`). COLD = backfill (`sort=top`, `week→month→year`). Si le budget IA claque en plein run, la HOT est déjà traitée. Pas de data perdue sur le plus frais.

2. **Fetch multi-subs concurrent**
   `ThreadPoolExecutor` — chaque sub fetch en parallèle, PullPush et PRAW étant I/O-bound. Pas de changement d'API, pas d'auth de plus.

3. **IA parallèle avec rate limiter partagé**
   4 workers appellent Groq en parallèle, un `RateLimiter` unique (28 RPM par défaut, min-interval) sérialise les `acquire()` sur un `Lock`. **Aucun sleep fixe entre calls.** La latence réseau d'un call est recouverte par la préparation du suivant. On sature 28/30 RPM au lieu de rester à ~7/min.

4. **Backoff exponentiel sur 429 (conservé + instrumenté)**
   `retry_with_backoff` existait déjà dans `ai.py` — on a juste branché un compteur partagé, pour que le mode `compare` sache combien de 429 chaque pipeline a mangé.

## 3 · Mode `compare` — avant / après chiffré

Le fichier test rejouable :

```bash
python scheduler.py compare              # 8 posts, sub=vosfinances
python scheduler.py compare 12 ETFs      # 12 posts, sub=ETFs
```

Il prend un petit dataset réel, passe `scheduler_legacy.py` PUIS le nouveau sur les **mêmes posts**, et imprime :

```
┌───────────────────────┬─────────────┬─────────────┬──────────┐
│                       │   LEGACY    │    NEW      │  GAIN    │
├───────────────────────┼─────────────┼─────────────┼──────────┤
│ Posts processed       │     8       │     8       │    =     │
│ Total time (s)        │   74.3s     │   12.1s     │  6.1×    │
│ Throughput (posts/min)│   6.5       │  39.7       │  6.1×    │
│ 429 rate-limits hit   │     0       │     0       │    =     │
└───────────────────────┴─────────────┴─────────────┴──────────┘
```

Les chiffres ci-dessus sont un **exemple de format** — le run live-caméra affiche les valeurs mesurées sur ta clé Groq free, pas sur une simulation. Cible minimum du brief : 2× sur le temps total. En pratique, le sleep 8s du legacy domine toute la boucle, donc on voit plutôt 4-6×.

## 4 · Feature greffée : *The Debate*

> **Pourquoi** : Doffy, tu as un corpus éditorial propre (posts + catégories + scores qualité). Ce qui manque, c'est le **point de vue**. On a greffé deux personas IA qui débattent 6 tours sur n'importe quel post, puis rendent un verdict structuré.

- Deux personas figés, français, prompts soignés :
  - **Le Sceptique** — cashflow, fondamentaux, allergique au hype.
  - **Le Riskeur** — growth, contrariant, paris asymétriques.
- 6 tours alternés, chacun voit les précédents. Streaming SSE token-par-token. Premier token < 2s.
- Verdict JSON final : 3 points d'accord, 2 points de friction irréductibles.
- UI split-screen, signature Ropau (crimson `#DC143C` + sparkle 4-branch) visible sans écraser ta DA éditoriale.
- Bouton *Lancer le débat* sur chaque carte de post, bouton *Partager* qui copie une URL directe V1.

Côté code :

```
frontend/src/app/api/debate/[postId]/route.ts   # SSE Groq LLaMA 3.3 70B, rate-limit 3/IP
frontend/src/components/debate/debate-view.tsx  # split-screen, typewriter, verdict scénarisé
frontend/src/components/debate/ropau-sigil.tsx  # sparkle + tampon "Greffé par Ropau"
```

Pas de stockage base — volatile, comme le brief le voulait. Rate limit simple : 3 débats simultanés max par IP.

## 5 · Stack

Inchangée côté provider : Next.js 16 + React 19 + Tailwind v4 + Radix UI (frontend), Python 3.12 + Groq (LLaMA 3.3 70B) + PullPush.io + PRAW + NocoDB (backend).

## 6 · Comment relancer

```bash
git clone https://github.com/ropau-ai/mygrepr-rescue.git
cd mygrepr-rescue
cp .env.example .env       # fill GROQ_API_KEY, NOCODB_*
python scheduler.py compare
python scheduler.py dry    # one-time fetch, no push

cd frontend
cp .env.example .env.local
npm install
npm run dev                # localhost:3000
```

Pour la prod (Vercel, frontend seulement) : variables `GROQ_API_KEY`, `NOCODB_BASE_URL`, `NOCODB_API_TOKEN`, `NOCODB_TABLE_ID` configurées côté hosteur — jamais en repo.

## 7 · Ce qui n'est pas dans ce fork

- PR upstream vers `Jelil-ah/mygrepr` — on attend ton go.
- Analytics, monitoring, CI/CD propre.
- Domaine custom `ropau.fr` ou `grepr.ropau.fr`.
- Persistance des débats, partage social riche, i18n.

---

Si tu veux merger, découper, ou juste discuter d'un point : Robin est à [@ropau_ai](https://x.com/ropau_ai), Claude n'a pas de handle. Rien n'est figé.
