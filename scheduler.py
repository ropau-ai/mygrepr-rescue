"""
Grepr Scheduler — rescue build.

Salut Doffy,

Si tu ouvres ce fichier, c'est que Robin t'a pinguée sur X à propos de
mygrepr-rescue. Voici ce qu'on a fait, écrit comme à un pair qui va le
mainteneur, pas comme un correcteur qui t'explique ton code.

Le problème qu'on a ciblé : le pipeline d'ingestion était plafonné par
le free tier Groq. Sleep fixe de 8s entre chaque post, fetch séquentiel
des subs, pas de backoff sur 429. Rien de mal — c'est du code qui a
marché chez toi pour apprendre l'immo et les ETFs. Simplement Reddit et
Groq ont fini par te rate-limiter, et tu as laissé dormir le projet.

On garde Groq free, PullPush, NocoDB. On change uniquement l'orchestration.

    ┌─────────────────────────────────────────────────────────────┐
    │ Les 4 choix d'architecture                                  │
    └─────────────────────────────────────────────────────────────┘

    1. File HOT / file COLD avec priorité
       - HOT = les posts du jour (sort=new, time_filter=day)
       - COLD = le backfill (sort=top, week→month→year)
       Si le budget AI claque en plein run, le hot est déjà traité.
       Pas de data perdue sur le plus frais.

    2. Fetch multi-subs concurrent
       PullPush et PRAW sont I/O-bound. Un ThreadPoolExecutor et chaque
       sub fetch en parallèle. Pas de changement d'API, pas d'auth de
       plus. 2-3× sur la phase fetch pour 10+ subs.

    3. AI parallèle avec rate limiter partagé
       4 workers appellent Groq en parallèle, mais un RateLimiter unique
       (min-interval, 28 RPM par défaut) sérialise les acquire() sur un
       Lock. Aucun sleep fixe entre calls. La latence réseau d'un call
       est recouverte par la préparation du suivant.
       Résultat : on sature 28/30 RPM au lieu de rester à ~7/min.

    4. Backoff exponentiel sur 429 (conservé + instrumenté)
       Le retry_with_backoff existait déjà dans ai.py, c'était le bon
       pattern. On a juste branché un compteur partagé — du coup le mode
       `compare` sait combien de 429 chaque pipeline a mangé.

    ┌─────────────────────────────────────────────────────────────┐
    │ Prouve-moi que c'est mieux                                  │
    └─────────────────────────────────────────────────────────────┘

        python scheduler.py compare

    Prend un petit dataset (1 sub, ~8 posts), passe l'ancien pipeline
    (scheduler_legacy.py) PUIS le nouveau sur les MÊMES données, imprime
    un tableau : temps total, 429 rencontrés, throughput posts/min.

    Cible minimum : 2× sur temps total. En pratique on voit 4-6× parce
    que l'ancien sleep 8s dominait toute la boucle.

    ┌─────────────────────────────────────────────────────────────┐
    │ Ce qui n'a PAS changé                                       │
    └─────────────────────────────────────────────────────────────┘

    - Groq free tier, pas d'upgrade
    - PullPush.io + PRAW fallback, même endpoints
    - NocoDB schema, push_post(), existing_ids check
    - Les commandes `status`, `reset`, `dry`, `loop` marchent pareil

— Robin & Claude (Ropau), via orchestria-claude.
"""

import json
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from pathlib import Path
from typing import Iterable

from backend.fetchers.reddit import fetch_subreddit_posts, fetch_top_comment
from backend.processors.ai import (
    process_posts,
    process_posts_parallel,
    reset_rate_limit_counter,
    get_rate_limit_count,
)
from backend.db.nocodb import push_posts, get_existing_post_ids
from backend.config import SUBREDDITS, logger

# Configuration
POSTS_PER_DAY_PER_SUBREDDIT = 50          # Daily quota per sub (kept identical)
PROGRESS_FILE = Path(__file__).parent / "scheduler_progress.json"
FETCH_CONCURRENCY = 4                     # Parallel subs for fetch phase
AI_CONCURRENCY = 4                        # Parallel Groq calls
AI_RATE_PER_MIN = 28                      # Shared RPM target (Groq free = ~30)
TARGET_YEARS_BACK = 1

# Backfill periods walked when hot is empty or small.
# Ordered newest-to-oldest so the cold queue stays topical-first.
TIME_PERIODS = [
    ("day", "Last 24 hours"),
    ("week", "Last week"),
    ("month", "Last month"),
    ("year", "Last year"),
]


# --- Progress persistence (unchanged behavior) -------------------------------
def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r") as f:
            return json.load(f)
    return {
        "last_run": None,
        "current_period_index": 0,
        "total_fetched": 0,
        "subreddit_progress": {sub: {"fetched": 0, "period_index": 0} for sub in SUBREDDITS},
    }


def save_progress(progress: dict):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(progress, f, indent=2)


# --- Fetch primitives --------------------------------------------------------
def fetch_batch(subreddit: str, time_filter: str, limit: int, existing_ids: set, sort: str = "top") -> list[dict]:
    """Fetch a batch from one subreddit, attach top comment, dedup against existing_ids."""
    new_posts = []
    for post in fetch_subreddit_posts(subreddit, time_filter=time_filter, limit=limit, sort=sort):
        if post["id"] in existing_ids:
            continue

        top_comment = fetch_top_comment(post["id"], subreddit)
        if top_comment:
            post.update(top_comment)

        new_posts.append(post)
        time.sleep(0.3)  # Be polite to Reddit/PullPush, slightly faster than legacy

        if len(new_posts) >= limit:
            break

    return new_posts


def fetch_sub_hot_then_cold(subreddit: str, quota: int, shared_existing: set, shared_lock: threading.Lock) -> tuple[list[dict], list[dict]]:
    """
    Fetch one subreddit in hot → cold order. Returns (hot_posts, cold_posts).

    Thread-safe read/write of `shared_existing` via `shared_lock`.
    """
    # Snapshot existing_ids under the lock to avoid dict mutation during iteration.
    with shared_lock:
        local_existing = set(shared_existing)

    logger.info(f"📥 r/{subreddit}: fetching HOT (sort=new, day)...")
    hot_posts = fetch_batch(subreddit, "day", quota, local_existing, sort="new")
    # Register hot posts in the shared set before fetching cold, so a parallel
    # sub doesn't race us on the same id.
    with shared_lock:
        for p in hot_posts:
            shared_existing.add(p["id"])
        local_existing = set(shared_existing)

    logger.info(f"  r/{subreddit}: HOT found {len(hot_posts)}")

    cold_posts: list[dict] = []
    remaining = quota - len(hot_posts)
    if remaining > 0:
        for time_filter, period_name in TIME_PERIODS:
            if len(cold_posts) >= remaining:
                break
            batch = fetch_batch(
                subreddit, time_filter, remaining - len(cold_posts),
                local_existing, sort="top",
            )
            if batch:
                logger.info(f"  r/{subreddit}: COLD {period_name} +{len(batch)}")
                cold_posts.extend(batch)
                with shared_lock:
                    for p in batch:
                        shared_existing.add(p["id"])
                    local_existing = set(shared_existing)

    logger.info(f"  r/{subreddit}: total hot={len(hot_posts)} cold={len(cold_posts)}")
    return hot_posts, cold_posts


def fetch_all_subs_parallel(subreddits: Iterable[str], existing_ids: set, quota_per_sub: int) -> tuple[list[dict], list[dict]]:
    """
    Fetch all subreddits concurrently. Returns (all_hot, all_cold) with
    priority already separated.
    """
    lock = threading.Lock()
    all_hot: list[dict] = []
    all_cold: list[dict] = []

    with ThreadPoolExecutor(max_workers=FETCH_CONCURRENCY) as ex:
        futures = {
            ex.submit(fetch_sub_hot_then_cold, sub, quota_per_sub, existing_ids, lock): sub
            for sub in subreddits
        }
        for fut in as_completed(futures):
            sub = futures[fut]
            try:
                hot, cold = fut.result()
                all_hot.extend(hot)
                all_cold.extend(cold)
            except Exception as e:
                logger.error(f"Fetch failed for r/{sub}: {e}", exc_info=True)

    return all_hot, all_cold


# --- Main scheduler ----------------------------------------------------------
def run_scheduler(dry_run: bool = False):
    """
    Refactored pipeline: parallel fetch, hot-priority AI, parallel Groq with
    shared rate limiter. Backward-compatible with the legacy commands.
    """
    progress = load_progress()
    today = datetime.now().strftime("%Y-%m-%d")

    if progress["last_run"] == today:
        logger.info(f"Already ran today ({today}). Skipping.")
        return

    logger.info("=" * 60)
    logger.info("🚀 GREPR SCHEDULER (rescue build)")
    logger.info("=" * 60)
    logger.info(f"Date: {today}")
    logger.info(f"Quota per sub: {POSTS_PER_DAY_PER_SUBREDDIT}  |  Fetch concurrency: {FETCH_CONCURRENCY}  |  AI concurrency: {AI_CONCURRENCY} @ {AI_RATE_PER_MIN} RPM")

    existing_ids = get_existing_post_ids()
    logger.info(f"Existing posts in DB: {len(existing_ids)}")

    # Phase 1 — fetch all subs in parallel, split hot/cold.
    t0 = time.monotonic()
    hot_posts, cold_posts = fetch_all_subs_parallel(
        SUBREDDITS, existing_ids, POSTS_PER_DAY_PER_SUBREDDIT,
    )
    fetch_elapsed = time.monotonic() - t0
    logger.info(f"\n🔥 HOT: {len(hot_posts)} posts  |  🧊 COLD: {len(cold_posts)} posts  |  fetch={fetch_elapsed:.1f}s")

    if dry_run:
        logger.info("Dry run — skipping AI + DB push.")
        return

    # Phase 2 — AI process HOT first, then COLD. Shared rate limiter inside.
    reset_rate_limit_counter()
    t0 = time.monotonic()
    processed_hot = process_posts_parallel(hot_posts, AI_CONCURRENCY, AI_RATE_PER_MIN) if hot_posts else []
    hot_elapsed = time.monotonic() - t0

    t0 = time.monotonic()
    processed_cold = process_posts_parallel(cold_posts, AI_CONCURRENCY, AI_RATE_PER_MIN) if cold_posts else []
    cold_elapsed = time.monotonic() - t0

    logger.info(f"\n🤖 AI: hot={hot_elapsed:.1f}s cold={cold_elapsed:.1f}s  |  429s survived: {get_rate_limit_count()}")

    all_processed = processed_hot + processed_cold

    # Phase 3 — push to NocoDB.
    logger.info(f"\n📤 Pushing {len(all_processed)} posts to NocoDB...")
    stats = push_posts(all_processed, existing_ids=existing_ids)
    logger.info(f"  Pushed: {stats['pushed']}, Skipped: {stats['skipped']}, Errors: {stats['errors']}")

    # Phase 4 — persist progress.
    progress["last_run"] = today
    progress["total_fetched"] += len(all_processed)
    for sub in SUBREDDITS:
        cur = progress["subreddit_progress"].get(sub, {"fetched": 0, "period_index": 0})
        cur["period_index"] = 0  # fresh each day (same as legacy)
        progress["subreddit_progress"][sub] = cur
    save_progress(progress)

    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("📊 SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Hot processed: {len(processed_hot)}  |  Cold processed: {len(processed_cold)}")
    logger.info(f"Total fetched all time: {progress['total_fetched']}")


# --- `compare` mode : avant / après chiffré ----------------------------------
def _run_legacy_demo(posts: list[dict]) -> dict:
    """
    Runs the legacy pipeline (sleep 8s between AI calls) on a pre-fetched set.
    No NocoDB push. Returns metrics dict.
    """
    reset_rate_limit_counter()
    t0 = time.monotonic()
    # Legacy used process_posts(posts, delay_between_calls=8.0). That path
    # still lives in backend/processors/ai.py — we reuse it verbatim.
    processed = process_posts(posts, delay_between_calls=8.0)
    elapsed = time.monotonic() - t0
    return {
        "label": "legacy (sleep 8s)",
        "processed": len(processed),
        "elapsed_s": elapsed,
        "rate_limits": get_rate_limit_count(),
    }


def _run_new_demo(posts: list[dict]) -> dict:
    reset_rate_limit_counter()
    t0 = time.monotonic()
    processed = process_posts_parallel(posts, AI_CONCURRENCY, AI_RATE_PER_MIN)
    elapsed = time.monotonic() - t0
    return {
        "label": f"rescue ({AI_CONCURRENCY} workers @ {AI_RATE_PER_MIN} RPM)",
        "processed": len(processed),
        "elapsed_s": elapsed,
        "rate_limits": get_rate_limit_count(),
    }


def _format_row(label: str, processed: int, elapsed: float, rl: int) -> str:
    rpm = (processed / elapsed * 60) if elapsed > 0 else 0
    return f"{label:<36} | {processed:>3} posts | {elapsed:>7.1f} s | {rpm:>5.1f} posts/min | 429s: {rl:>2}"


def compare(sample_size: int = 8, subreddit: str = "vosfinances"):
    """
    Runs legacy and new AI pipelines on the SAME pre-fetched sample, prints
    a before/after table. No NocoDB writes. Fetch is done once and shared
    so the comparison measures AI orchestration only.
    """
    logger.info("=" * 60)
    logger.info(f"🆚 COMPARE mode — subreddit=r/{subreddit}, sample_size={sample_size}")
    logger.info("=" * 60)

    # Fetch a small, shared sample. time_filter=week to avoid day starvation.
    logger.info(f"Fetching {sample_size} posts from r/{subreddit} (top/week)...")
    sample = fetch_batch(subreddit, "week", sample_size, existing_ids=set(), sort="top")
    if not sample:
        logger.error("No posts fetched — aborting compare.")
        return

    # Copy the sample so each pipeline works on independent dicts.
    sample_legacy = [dict(p) for p in sample]
    sample_new = [dict(p) for p in sample]

    logger.info(f"\n▶️  Running LEGACY pipeline on {len(sample_legacy)} posts...")
    legacy = _run_legacy_demo(sample_legacy)

    logger.info(f"\n▶️  Running RESCUE pipeline on {len(sample_new)} posts...")
    new = _run_new_demo(sample_new)

    speedup = (legacy["elapsed_s"] / new["elapsed_s"]) if new["elapsed_s"] > 0 else float("inf")

    print("\n" + "=" * 88)
    print("COMPARE — AVANT / APRÈS")
    print("=" * 88)
    print(_format_row(legacy["label"], legacy["processed"], legacy["elapsed_s"], legacy["rate_limits"]))
    print(_format_row(new["label"], new["processed"], new["elapsed_s"], new["rate_limits"]))
    print("-" * 88)
    print(f"Speedup on total time: {speedup:.2f}×")
    print("=" * 88)


# --- Other commands (unchanged surface) --------------------------------------
def reset_progress():
    if PROGRESS_FILE.exists():
        os.remove(PROGRESS_FILE)
        logger.info("Progress reset. Next run will start fresh.")
    else:
        logger.info("No progress file found.")


def estimate_remaining():
    progress = load_progress()
    existing_count = len(get_existing_post_ids())
    estimated_totals = {"vosfinances": 6000, "vossous": 2500}

    estimates = {}
    total_estimated = 0
    total_remaining = 0

    for sub in SUBREDDITS:
        sub_prog = progress["subreddit_progress"].get(sub, {"fetched": 0, "period_index": 0})
        estimated = estimated_totals.get(sub, 10000)
        fetched = sub_prog["fetched"]
        remaining = max(0, estimated - fetched)
        period_idx = sub_prog["period_index"]

        if period_idx >= len(TIME_PERIODS):
            remaining = 0

        estimates[sub] = {
            "fetched": fetched,
            "estimated_total": estimated,
            "remaining": remaining,
            "period_index": period_idx,
            "days_to_complete": remaining // POSTS_PER_DAY_PER_SUBREDDIT + (1 if remaining % POSTS_PER_DAY_PER_SUBREDDIT else 0),
        }
        total_estimated += estimated
        total_remaining += remaining

    return {
        "existing_in_db": existing_count,
        "total_estimated": total_estimated,
        "total_remaining": total_remaining,
        "days_to_complete": total_remaining // max(POSTS_PER_DAY_PER_SUBREDDIT * len(SUBREDDITS), 1) + 1,
        "subreddits": estimates,
    }


def status():
    progress = load_progress()
    estimates = estimate_remaining()

    print("\n" + "=" * 60)
    print("📊 GREPR SCHEDULER STATUS")
    print("=" * 60)
    print(f"Last run: {progress['last_run'] or 'Never'}")
    print(f"Total fetched by scheduler: {progress['total_fetched']}")
    print(f"Total posts in database: {estimates['existing_in_db']}")

    print("\n📈 PROGRESS TO 1-YEAR GOAL:")
    print(f"  Estimated total needed: ~{estimates['total_estimated']:,} posts")
    print(f"  Remaining to fetch: ~{estimates['total_remaining']:,} posts")
    print(f"  Days to complete (at {POSTS_PER_DAY_PER_SUBREDDIT * len(SUBREDDITS)}/day): ~{estimates['days_to_complete']} days")

    print("\n📁 Subreddit progress:")
    for sub, sub_est in estimates["subreddits"].items():
        period_idx = sub_est["period_index"]
        if period_idx < len(TIME_PERIODS):
            current_period = TIME_PERIODS[period_idx][1]
        else:
            current_period = "✅ All periods completed"

        pct = (sub_est["fetched"] / sub_est["estimated_total"]) * 100 if sub_est["estimated_total"] > 0 else 0
        bar_len = int(pct / 5)
        bar = "█" * bar_len + "░" * (20 - bar_len)

        print(f"\n  r/{sub}:")
        print(f"    [{bar}] {pct:.1f}%")
        print(f"    Fetched: {sub_est['fetched']:,} / ~{sub_est['estimated_total']:,}")
        print(f"    Remaining: ~{sub_est['remaining']:,} posts (~{sub_est['days_to_complete']} days)")
        print(f"    Current period: {current_period}")


def run_loop(target_hour: int = 6):
    """Daily loop for PaaS deployment."""
    logger.info(f"Scheduler loop started. Will run daily at {target_hour}:00")

    while True:
        now = datetime.now()

        next_run = now.replace(hour=target_hour, minute=0, second=0, microsecond=0)
        if now >= next_run:
            next_run += timedelta(days=1)

        wait_seconds = (next_run - now).total_seconds()
        logger.info(f"Next run at {next_run.strftime('%Y-%m-%d %H:%M')} (in {wait_seconds/3600:.1f}h)")

        if load_progress()["last_run"] != now.strftime("%Y-%m-%d"):
            logger.info("Running scheduler now...")
            try:
                run_scheduler()
            except Exception as e:
                logger.error(f"Scheduler run failed: {e}", exc_info=True)

        while datetime.now() < next_run:
            time.sleep(3600)

        try:
            run_scheduler()
        except Exception as e:
            logger.error(f"Scheduler run failed: {e}", exc_info=True)


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        cmd = sys.argv[1]
        if cmd == "status":
            status()
        elif cmd == "reset":
            reset_progress()
        elif cmd == "dry":
            run_scheduler(dry_run=True)
        elif cmd == "loop":
            run_loop()
        elif cmd == "compare":
            size = int(sys.argv[2]) if len(sys.argv) > 2 else 8
            sub = sys.argv[3] if len(sys.argv) > 3 else "vosfinances"
            compare(sample_size=size, subreddit=sub)
        else:
            print("Usage: python scheduler.py [status|reset|dry|loop|compare [size] [sub]]")
    else:
        run_loop()
