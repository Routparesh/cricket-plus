"""
Cricket Live Data Service
Fetches live scores from CricAPI and live odds from The Odds API.
"""
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

CRICKET_API_KEY = os.getenv("CRICKET_API_KEY", "")
ODDS_API_KEY    = os.getenv("ODDS_API_KEY", "")

CRICKET_BASE    = "https://api.cricapi.com/v1"
ODDS_BASE       = "https://api.the-odds-api.com/v4"


# ─────────────────────────────────────────────────────────
# CRICKET API — Live Matches
# ─────────────────────────────────────────────────────────

async def get_live_matches() -> list[dict]:
    """Returns all currently live matches from CricAPI."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{CRICKET_BASE}/currentMatches",
            params={"apikey": CRICKET_API_KEY, "offset": 0}
        )
        data = resp.json()
        if data.get("status") != "success":
            print(f"CricAPI error: {data.get('reason', 'unknown')}")
            return []
        return data.get("data", [])


async def get_match_scorecard(match_id: str) -> dict:
    """Returns full live scorecard for a specific match."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{CRICKET_BASE}/match_scorecard",
            params={"apikey": CRICKET_API_KEY, "id": match_id}
        )
        data = resp.json()
        return data.get("data", {})


async def get_match_info(match_id: str) -> dict:
    """Returns match info including teams, venue, toss, status."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{CRICKET_BASE}/match_info",
            params={"apikey": CRICKET_API_KEY, "id": match_id}
        )
        data = resp.json()
        return data.get("data", {})


# ─────────────────────────────────────────────────────────
# ODDS API — Live Bookmaker Odds
# ─────────────────────────────────────────────────────────

async def get_cricket_odds() -> list[dict]:
    """Returns live odds for all active cricket markets."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{ODDS_BASE}/sports/cricket/odds",
            params={
                "apiKey": ODDS_API_KEY,
                "regions": "uk",          # Betfair, Bet365, etc.
                "markets": "h2h",         # Head-to-head (match winner)
                "oddsFormat": "decimal",
            }
        )
        if resp.status_code != 200:
            print(f"OddsAPI error: {resp.status_code} {resp.text}")
            return []
        return resp.json()


async def get_odds_for_match(home_team: str, away_team: str) -> dict:
    """
    Finds the best available odds for a specific match.
    Matches on team name substring (case-insensitive).
    Returns {"team_a_back": X, "team_b_back": X, "bookmaker": name}
    """
    all_odds = await get_cricket_odds()
    home_lower = home_team.lower()
    away_lower = away_team.lower()

    for event in all_odds:
        outcomes = event.get("outcomes", [])
        names = [o["name"].lower() for o in outcomes]
        
        # Try to match both teams
        if any(home_lower in n for n in names) and any(away_lower in n for n in names):
            bookmaker_list = event.get("bookmakers", [])
            if not bookmaker_list:
                continue
            
            # Prefer Betfair, then first available
            bookie = next(
                (b for b in bookmaker_list if "betfair" in b["key"]),
                bookmaker_list[0]
            )
            
            markets = bookie.get("markets", [])
            h2h = next((m for m in markets if m["key"] == "h2h"), None)
            if not h2h:
                continue
            
            outcomes_map = {o["name"].lower(): o["price"] for o in h2h["outcomes"]}
            
            team_a_odds = next((v for k, v in outcomes_map.items() if home_lower in k), None)
            team_b_odds = next((v for k, v in outcomes_map.items() if away_lower in k), None)
            
            if team_a_odds and team_b_odds:
                # Simulate exchange spread (back/lay ≈ ±0.02 from mid)
                return {
                    "team_a_back": round(team_a_odds, 2),
                    "team_a_lay":  round(team_a_odds - 0.02, 2),
                    "team_b_back": round(team_b_odds, 2),
                    "team_b_lay":  round(team_b_odds - 0.02, 2),
                    "bookmaker": bookie["title"],
                }
    
    # Fallback: no match found
    return {
        "team_a_back": 2.00, "team_a_lay": 1.98,
        "team_b_back": 2.00, "team_b_lay": 1.98,
        "bookmaker": "fallback"
    }


# ─────────────────────────────────────────────────────────
# Parse CricAPI Score into structured state
# ─────────────────────────────────────────────────────────

def parse_live_state(match: dict) -> dict:
    """
    Converts a CricAPI match object into the format
    expected by our ML pipeline.
    """
    scores = match.get("score", [])
    
    # Batting innings (most recent)
    batting = scores[-1] if scores else {}
    runs    = int(batting.get("r", 0))
    wickets = int(batting.get("w", 0))
    overs   = float(batting.get("o", 0.0))
    
    team_a = match.get("teams", ["Team A", "Team B"])[0]
    team_b = match.get("teams", ["Team A", "Team B"])[1]

    return {
        "match_id": match.get("id", "unknown"),
        "team_a": team_a,
        "team_b": team_b,
        "runs": runs,
        "wickets": wickets,
        "overs": overs,
        "status": match.get("status", ""),
        "match_type": match.get("matchType", "T20"),
    }
