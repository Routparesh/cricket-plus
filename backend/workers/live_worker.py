"""
Real Live Data Worker
Polls CricAPI + The Odds API every 30s, runs ML pipeline,
and broadcasts results to Redis → WebSockets → Frontend.
"""
import asyncio
import json
import os
import sys
import redis.asyncio as redis

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.cricket_data import get_live_matches, get_odds_for_match, parse_live_state
from ml.feature_engineering import extract_features
from ml.models import model
from ml.signal_engine import generate_signals
from ml.tipper_engine import generate_live_tip, ExchangeOdds

REDIS_URL       = os.getenv("REDIS_URL", "redis://localhost:6379")
POLL_INTERVAL   = int(os.getenv("POLL_INTERVAL_SECONDS", "30"))

# Track recent events per match for momentum detection
match_event_history: dict[str, list] = {}


async def process_match(match: dict, redis_client) -> None:
    """Processes one live match: fetches odds, runs ML, publishes to Redis."""
    state = parse_live_state(match)
    match_id = state["match_id"]
    
    # Skip non-live or completed matches
    if "won" in state["status"].lower() or state["overs"] <= 0:
        return

    # ── Fetch live odds ──────────────────────────────────────────────────
    odds = await get_odds_for_match(state["team_a"], state["team_b"])

    # ── ML Pipeline ─────────────────────────────────────────────────────
    # Estimate target (for chasing innings) — simplified
    is_chasing = len(match.get("score", [])) > 1
    target = None
    if is_chasing and len(match.get("score", [])) > 1:
        first_innings = match["score"][0]
        target = int(first_innings.get("r", 180)) + 1

    features = extract_features(
        current_score=state["runs"],
        wickets=state["wickets"],
        overs=state["overs"],
        target=target
    )
    ai_probs = model.predict_win_probability(features, is_chasing=is_chasing)

    # ── Momentum history ────────────────────────────────────────────────
    if match_id not in match_event_history:
        match_event_history[match_id] = []
    recent_events = match_event_history[match_id]

    # ── Signal Engine ────────────────────────────────────────────────────
    signal = generate_signals(ai_probs, odds, recent_events)

    # ── AI Tipper Back/Lay Live Tip ──────────────────────────────────────
    ex_odds_a = ExchangeOdds(back=odds["team_a_back"], lay=odds["team_a_lay"])
    ex_odds_b = ExchangeOdds(back=odds["team_b_back"], lay=odds["team_b_lay"])
    balls_remaining = max(0, int((20 - state["overs"]) * 6))
    runs_required   = max(0, (target - state["runs"])) if target else 0

    live_tip = generate_live_tip(
        ai_probs=ai_probs,
        exchange_odds_a=ex_odds_a,
        exchange_odds_b=ex_odds_b,
        recent_events=recent_events,
        overs=state["overs"],
        wickets=state["wickets"],
        runs_required=runs_required,
        balls_remaining=balls_remaining,
    )

    # ── Build payload ────────────────────────────────────────────────────
    payload = {
        "match_id":   match_id,
        "team_a":     state["team_a"],
        "team_b":     state["team_b"],
        "score":      f"{state['runs']}/{state['wickets']}",
        "overs":      state["overs"],
        "status":     state["status"],
        "win_probability": {
            "team_a": ai_probs["team_a_prob"],
            "team_b": ai_probs["team_b_prob"],
        },
        "odds": {
            "team_a_back": odds["team_a_back"],
            "team_a_lay":  odds["team_a_lay"],
            "team_b_back": odds["team_b_back"],
            "team_b_lay":  odds["team_b_lay"],
            "bookmaker":   odds["bookmaker"],
        },
        "signal":   signal,
        "live_tip": {
            "action":           live_tip.action,
            "bet_type":         live_tip.bet_type,
            "team":             live_tip.team,
            "edge":             live_tip.edge,
            "suggested_stake":  live_tip.suggested_stake,
            "lay_liability":    live_tip.lay_liability,
            "profit_if_win":    live_tip.profit_if_win,
            "confidence_pct":   live_tip.confidence_pct,
            "reasoning":        live_tip.reasoning,
            "urgency":          live_tip.urgency,
            "risk_level":       live_tip.risk_level,
            "momentum":         live_tip.momentum,
        },
        "ai_confidence": ai_probs.get("confidence", 75.0),
    }

    # ── Publish to Redis ─────────────────────────────────────────────────
    channel = f"match_updates:{match_id}"
    await redis_client.publish(channel, json.dumps(payload))
    print(
        f"[{match_id}] {state['team_a']} vs {state['team_b']} "
        f"| {payload['score']} ({state['overs']} ov) "
        f"| AI: {ai_probs['team_a_prob']}% "
        f"| Tip: {live_tip.action} {live_tip.bet_type} "
        f"| Bookmaker: {odds['bookmaker']}"
    )


async def live_data_worker():
    """Main polling loop — runs every POLL_INTERVAL seconds."""
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    print(f"✅ Real Live Data Worker started. Polling every {POLL_INTERVAL}s...")

    while True:
        try:
            matches = await get_live_matches()
            if not matches:
                print("⚠️  No live matches found right now. Retrying...")
            else:
                print(f"📡 Found {len(matches)} live matches. Processing...")
                for match in matches:
                    try:
                        await process_match(match, redis_client)
                    except Exception as e:
                        print(f"Error processing match {match.get('id')}: {e}")

        except Exception as e:
            print(f"Worker error: {e}")

        await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    asyncio.run(live_data_worker())
