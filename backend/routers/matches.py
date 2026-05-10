"""
Matches Router — Search and filter live matches by team name.
"""
import httpx
import os
from fastapi import APIRouter, Query
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(tags=["Matches"])
CRICKET_API_KEY = os.getenv("CRICKET_API_KEY", "")
CRICKET_BASE    = "https://api.cricapi.com/v1"


@router.get("/search")
async def search_matches(q: str = Query("", description="Team name to search for")):
    """
    Search live/current matches by team name.
    Returns filtered list matching the query string.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{CRICKET_BASE}/currentMatches",
            params={"apikey": CRICKET_API_KEY, "offset": 0}
        )
        data = resp.json()

    all_matches = data.get("data", [])

    if not q.strip():
        # Return all live matches if no query
        return {"matches": _format_matches(all_matches[:20])}

    # Filter by team name (case-insensitive)
    q_lower = q.strip().lower()
    filtered = [
        m for m in all_matches
        if any(q_lower in team.lower() for team in m.get("teams", []))
        or q_lower in m.get("name", "").lower()
    ]

    return {"matches": _format_matches(filtered)}


@router.get("/live")
async def get_live_matches():
    """Returns all currently live (in-progress) matches."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{CRICKET_BASE}/currentMatches",
            params={"apikey": CRICKET_API_KEY, "offset": 0}
        )
        data = resp.json()

    all_matches = data.get("data", [])
    # Only truly in-progress
    live = [
        m for m in all_matches
        if not any(
            kw in m.get("status", "").lower()
            for kw in ["won", "drawn", "abandoned", "yet to bat"]
        )
    ]
    return {"matches": _format_matches(live)}


def _format_matches(matches: list) -> list:
    result = []
    for m in matches:
        teams = m.get("teams", ["?", "?"])
        scores = m.get("score", [])
        score_str = ""
        if scores:
            parts = [f"{s.get('r',0)}/{s.get('w',0)} ({s.get('o',0)} ov)" for s in scores]
            score_str = " | ".join(parts)

        result.append({
            "id":         m.get("id", ""),
            "name":       m.get("name", " vs ".join(teams)),
            "team_a":     teams[0] if len(teams) > 0 else "Team A",
            "team_b":     teams[1] if len(teams) > 1 else "Team B",
            "status":     m.get("status", ""),
            "match_type": m.get("matchType", "T20").upper(),
            "venue":      m.get("venue", ""),
            "score":      score_str,
            "date":       m.get("dateTimeGMT", "")[:10],
        })
    return result
