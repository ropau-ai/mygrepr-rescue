"""
NocoDB Client - Push posts to NocoDB database
"""
import json
import time
import requests
from backend.config import NOCODB_BASE_URL, NOCODB_API_TOKEN, NOCODB_TABLE_ID, logger


def get_headers():
    """Get headers for NocoDB API requests."""
    return {
        "xc-token": NOCODB_API_TOKEN,
        "Content-Type": "application/json"
    }


def get_existing_post_ids() -> set:
    """
    Get all existing post IDs from NocoDB to avoid duplicates.
    Uses pagination to handle more than 1000 posts.
    """
    if not NOCODB_API_TOKEN or not NOCODB_TABLE_ID:
        logger.warning("NocoDB not configured, skipping duplicate check")
        return set()

    url = f"{NOCODB_BASE_URL}/api/v2/tables/{NOCODB_TABLE_ID}/records"
    existing_ids = set()
    offset = 0
    page_size = 1000

    while True:
        params = {"fields": "reddit_id", "limit": page_size, "offset": offset}

        try:
            response = requests.get(url, headers=get_headers(), params=params, timeout=30)
            response.raise_for_status()
            data = response.json()

            records = data.get("list", [])
            if not records:
                break

            for record in records:
                if record.get("reddit_id"):
                    existing_ids.add(record["reddit_id"])

            # If we got fewer than page_size, we're done
            if len(records) < page_size:
                break

            offset += page_size

        except requests.RequestException as e:
            logger.error(f"Error fetching existing posts: {e}")
            break

    return existing_ids


def push_post(post: dict) -> bool:
    """
    Push a single post to NocoDB.
    Returns True if successful.
    """
    if not NOCODB_API_TOKEN or not NOCODB_TABLE_ID:
        logger.warning("NocoDB not configured")
        return False

    url = f"{NOCODB_BASE_URL}/api/v2/tables/{NOCODB_TABLE_ID}/records"

    # Map post data to NocoDB fields
    extracted = post.get("extracted_data") or {}

    # Safe JSON serialization
    try:
        extracted_json = json.dumps(extracted, ensure_ascii=False) if extracted else None
    except (TypeError, ValueError):
        extracted_json = None

    # Safe max amount extraction
    amounts = extracted.get("amounts") or []
    montant_max = max(amounts) if amounts else None

    record = {
        "reddit_id": post.get("id"),
        "subreddit": post.get("subreddit"),
        "title": post.get("title"),
        "selftext": (post.get("selftext") or "")[:5000],  # NocoDB text limit
        "score": post.get("score"),
        "num_comments": post.get("num_comments"),
        "created_a": post.get("created_at"),  # Human-readable datetime (NocoDB: created_a)
        "url": post.get("url"),
        "author": post.get("author"),
        "upvote_ratio": post.get("upvote_ratio"),
        "category": post.get("category", "Autre"),
        "tags": ", ".join(post.get("tags") or []),  # Store as comma-separated
        "summary": post.get("summary") or "",
        "consensus": post.get("consensus") or "",
        "key_advice": post.get("key_advice") or "",
        "top_comment": post.get("comment_body") or "",
        "comment_score": post.get("comment_score") or 0,
        # Extracted financial data
        "extracted_data": extracted_json,
        "patrimoine": extracted.get("patrimoine"),
        "revenus_annuels": extracted.get("revenus_annuels"),
        "age_auteur": extracted.get("age"),
        "montant_max": montant_max,
    }

    for attempt in range(3):
        try:
            response = requests.post(url, headers=get_headers(), json=record, timeout=30)
            response.raise_for_status()
            return True
        except requests.RequestException as e:
            if attempt < 2:
                wait = 2 ** (attempt + 1)
                logger.warning(f"NocoDB push attempt {attempt+1}/3 failed for {post.get('id')}: {e}. Retrying in {wait}s...")
                time.sleep(wait)
            else:
                logger.error(f"NocoDB push failed after 3 attempts for {post.get('id')}: {e}")
                return False
    return False


def push_posts(posts: list[dict], existing_ids: set | None = None) -> dict:
    """
    Push multiple posts to NocoDB, skipping duplicates.
    Pass existing_ids to avoid a redundant DB query.
    Returns stats dict with counts.
    """
    if not NOCODB_API_TOKEN or not NOCODB_TABLE_ID:
        logger.warning("NocoDB not configured - set NOCODB_API_TOKEN and NOCODB_TABLE_ID in .env")
        return {"pushed": 0, "skipped": 0, "errors": 0}

    if existing_ids is None:
        existing_ids = get_existing_post_ids()
    logger.info(f"Checking against {len(existing_ids)} existing posts in NocoDB")

    stats = {"pushed": 0, "skipped": 0, "errors": 0}

    for post in posts:
        post_id = post.get("id")

        if post_id in existing_ids:
            stats["skipped"] += 1
            continue

        if push_post(post):
            stats["pushed"] += 1
            logger.info(f"Pushed: {post.get('title', '')[:50]}...")
        else:
            stats["errors"] += 1

    return stats


# Test
if __name__ == "__main__":
    print("Testing NocoDB client...")

    if not NOCODB_API_TOKEN:
        print("❌ NOCODB_API_TOKEN not set in .env")
        print("\nTo configure NocoDB:")
        print("1. Open NocoDB and create a new base/table")
        print("2. Go to your profile > API Tokens > Create token")
        print("3. Copy the table ID from the URL (after /table/)")
        print("4. Add to .env:")
        print("   NOCODB_API_TOKEN=your_token_here")
        print("   NOCODB_TABLE_ID=your_table_id_here")
    else:
        existing = get_existing_post_ids()
        print(f"✓ Connected! Found {len(existing)} existing posts")
