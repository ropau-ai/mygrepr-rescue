"""
Reddit Fetcher - Uses PullPush.io API (free, no auth required)
with PRAW fallback if credentials are configured.
"""
import time
import requests
from datetime import datetime, timedelta
from typing import Generator
from backend.config import (
    SUBREDDITS, MIN_SCORE, MIN_SCORE_NEW, POSTS_PER_REQUEST, TIME_FILTER,
    REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT, USER_AGENT, logger
)

# PullPush.io API base URL
PULLPUSH_BASE = "https://api.pullpush.io/reddit"

# Try to initialize PRAW client
_reddit = None
if REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET:
    try:
        import praw
        _reddit = praw.Reddit(
            client_id=REDDIT_CLIENT_ID,
            client_secret=REDDIT_CLIENT_SECRET,
            user_agent=REDDIT_USER_AGENT,
        )
        _reddit.read_only = True
        logger.info("Reddit API: Using PRAW (authenticated)")
    except Exception as e:
        logger.warning(f"PRAW init failed, falling back to PullPush.io: {e}")
        _reddit = None
else:
    logger.info("Reddit API: Using PullPush.io (no Reddit credentials needed)")


def _post_to_dict(post_data: dict, subreddit: str) -> dict:
    """Convert raw post data to our standard dict format."""
    created_utc = post_data.get("created_utc", 0)
    created_at = datetime.utcfromtimestamp(created_utc).strftime("%Y-%m-%d %H:%M:%S") if created_utc else None

    permalink = post_data.get("permalink", f"/r/{subreddit}/comments/{post_data.get('id', '')}/")

    return {
        "id": post_data.get("id"),
        "subreddit": subreddit,
        "title": post_data.get("title"),
        "selftext": (post_data.get("selftext") or "")[:2000],
        "score": post_data.get("score", 0),
        "num_comments": post_data.get("num_comments", 0),
        "created_utc": created_utc,
        "created_at": created_at,
        "url": f"https://reddit.com{permalink}",
        "author": post_data.get("author"),
        "upvote_ratio": post_data.get("upvote_ratio", 0),
    }


def _praw_post_to_dict(submission, subreddit: str) -> dict:
    """Convert a PRAW Submission object to our standard dict format."""
    created_utc = submission.created_utc
    created_at = datetime.utcfromtimestamp(created_utc).strftime("%Y-%m-%d %H:%M:%S") if created_utc else None

    return {
        "id": submission.id,
        "subreddit": subreddit,
        "title": submission.title,
        "selftext": (submission.selftext or "")[:2000],
        "score": submission.score,
        "num_comments": submission.num_comments,
        "created_utc": created_utc,
        "created_at": created_at,
        "url": f"https://reddit.com{submission.permalink}",
        "author": str(submission.author) if submission.author else "[deleted]",
        "upvote_ratio": submission.upvote_ratio,
    }


def _time_filter_to_epoch(time_filter: str) -> int:
    """Convert Reddit time filter string to epoch timestamp."""
    now = datetime.utcnow()
    deltas = {
        "hour": timedelta(hours=1),
        "day": timedelta(days=1),
        "week": timedelta(weeks=1),
        "month": timedelta(days=30),
        "year": timedelta(days=365),
        "all": timedelta(days=365 * 10),
    }
    delta = deltas.get(time_filter, timedelta(days=365))
    return int((now - delta).timestamp())


def _fetch_praw(subreddit: str, time_filter: str, limit: int, sort: str, min_score: int) -> Generator[dict, None, None]:
    """Fetch posts using PRAW (authenticated Reddit API)."""
    sub = _reddit.subreddit(subreddit)
    total_fetched = 0

    try:
        if sort == "new":
            posts = sub.new(limit=limit)
        elif sort == "hot":
            posts = sub.hot(limit=limit)
        else:  # top
            posts = sub.top(time_filter=time_filter, limit=limit)

        for submission in posts:
            if submission.score >= min_score:
                yield _praw_post_to_dict(submission, subreddit)
                total_fetched += 1
    except Exception as e:
        logger.error(f"PRAW error fetching r/{subreddit}: {e}")

    logger.info(f"  [PRAW] Fetched {total_fetched} posts from r/{subreddit} (score >= {min_score})")


def _fetch_pullpush(subreddit: str, time_filter: str, limit: int, sort: str, min_score: int) -> Generator[dict, None, None]:
    """Fetch posts using PullPush.io API."""
    url = f"{PULLPUSH_BASE}/search/submission"
    total_fetched = 0
    after_utc = _time_filter_to_epoch(time_filter)

    remaining = limit

    while remaining > 0:
        params = {
            "subreddit": subreddit,
            "size": min(remaining, 100),
            "after": after_utc,
            "score": f">{min_score}",
        }

        if sort == "new":
            params["sort"] = "desc"
            params["sort_type"] = "created_utc"
        else:  # top
            params["sort"] = "desc"
            params["sort_type"] = "score"

        data = None
        for attempt in range(3):
            try:
                response = requests.get(url, params=params, timeout=30)
                response.raise_for_status()
                data = response.json()
                break
            except requests.RequestException as e:
                if attempt < 2:
                    wait = 2 ** (attempt + 1)
                    logger.warning(f"PullPush attempt {attempt+1}/3 failed for r/{subreddit}: {e}. Retrying in {wait}s...")
                    time.sleep(wait)
                else:
                    logger.error(f"PullPush failed after 3 attempts for r/{subreddit}: {e}")

        if data is None:
            break

        posts = data.get("data", [])
        if not posts:
            break

        for post_data in posts:
            yield _post_to_dict(post_data, subreddit)
            total_fetched += 1

        remaining -= len(posts)

        # If we got fewer than requested, no more data
        if len(posts) < min(remaining + len(posts), 100):
            break

        # Use last post's created_utc for pagination
        after_utc = posts[-1].get("created_utc", after_utc)

        time.sleep(1)  # Be nice to PullPush

    logger.info(f"  [PullPush] Fetched {total_fetched} posts from r/{subreddit} (score >= {min_score})")


def fetch_subreddit_posts(subreddit: str, time_filter: str = TIME_FILTER, limit: int = POSTS_PER_REQUEST, sort: str = "top") -> Generator[dict, None, None]:
    """
    Fetch posts from a subreddit. Uses PRAW if configured, otherwise PullPush.io.
    sort: "top", "new", or "hot"
    """
    min_score = MIN_SCORE_NEW if sort == "new" else MIN_SCORE

    if _reddit:
        yield from _fetch_praw(subreddit, time_filter, limit, sort, min_score)
    else:
        yield from _fetch_pullpush(subreddit, time_filter, limit, sort, min_score)


def fetch_top_comment(post_id: str, subreddit: str) -> dict | None:
    """Fetch the top comment for a specific post."""
    if _reddit:
        return _fetch_top_comment_praw(post_id)
    else:
        return _fetch_top_comment_pullpush(post_id)


def _fetch_top_comment_praw(post_id: str) -> dict | None:
    """Fetch top comment using PRAW."""
    try:
        submission = _reddit.submission(id=post_id)
        submission.comment_sort = "top"
        submission.comments.replace_more(limit=0)
        if submission.comments:
            comment = submission.comments[0]
            return {
                "comment_id": comment.id,
                "comment_body": (comment.body or "")[:1000],
                "comment_score": comment.score,
                "comment_author": str(comment.author) if comment.author else "[deleted]",
            }
    except Exception as e:
        logger.error(f"PRAW error fetching comment for {post_id}: {e}")
    return None


def _fetch_top_comment_pullpush(post_id: str) -> dict | None:
    """Fetch top comment using PullPush.io comment search."""
    url = f"{PULLPUSH_BASE}/search/comment"
    params = {
        "link_id": post_id,
        "size": 1,
        "sort": "desc",
        "sort_type": "score",
    }

    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()

        comments = data.get("data", [])
        if comments:
            comment = comments[0]
            return {
                "comment_id": comment.get("id"),
                "comment_body": (comment.get("body") or "")[:1000],
                "comment_score": comment.get("score", 0),
                "comment_author": comment.get("author"),
            }
    except Exception as e:
        logger.error(f"PullPush error fetching comment for {post_id}: {e}")

    return None


def fetch_all_posts(with_comments: bool = True) -> list[dict]:
    """Fetch all posts from all configured subreddits."""
    all_posts = []

    for subreddit in SUBREDDITS:
        logger.info(f"\nFetching r/{subreddit}...")

        for post in fetch_subreddit_posts(subreddit):
            if with_comments:
                top_comment = fetch_top_comment(post["id"], subreddit)
                if top_comment:
                    post.update(top_comment)
                time.sleep(0.5)

            all_posts.append(post)

    logger.info(f"\nTotal: {len(all_posts)} posts fetched")
    return all_posts


# Test
if __name__ == "__main__":
    print(f"Reddit API mode: {'PRAW (authenticated)' if _reddit else 'PullPush.io'}")
    print("Testing reddit_fetcher...")

    for i, post in enumerate(fetch_subreddit_posts("vosfinances", sort="new", limit=10)):
        print(f"\n{i+1}. [{post['score']}] {post['title'][:60]}...")
        if i >= 4:
            break
