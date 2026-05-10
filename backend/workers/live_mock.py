import asyncio
import json
import random
import os
import sys
import redis.asyncio as redis

# Add the parent directory to sys.path to allow imports from ml package
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.feature_engineering import extract_features
from ml.models import model
from ml.signal_engine import generate_signals

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

# Mock data for a match
MATCH_ID = "mock-123"
TEAM_A = "RCB"
TEAM_B = "MI"

async def generate_live_data():
    """Continuously generates mock live data and AI signals using the ML pipeline, publishing to Redis."""
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    
    current_overs = 15.0
    runs = 120
    wickets = 3
    target = 200 # Chasing 200

    print(f"Starting ML-Driven Live Data Worker for match {MATCH_ID}...")
    
    recent_events = []
    
    try:
        while True:
            # Simulate a ball being bowled every 5 seconds
            await asyncio.sleep(5)
            
            current_overs += 0.1
            if str(current_overs).endswith('.6'):
                current_overs = round(current_overs + 0.4, 1) # next over
                
            runs_this_ball = random.choice([0, 1, 1, 2, 4, 6, "W"])
            
            # Maintain sliding window of last 6 events
            recent_events.append(runs_this_ball)
            if len(recent_events) > 6:
                recent_events.pop(0)
                
            if runs_this_ball == "W":
                wickets += 1
            else:
                runs += runs_this_ball
                
            # ML PIPELINE INTEGRATION
            # 1. Feature Engineering
            features = extract_features(current_score=runs, wickets=wickets, overs=current_overs, target=target)
            
            # 2. Model Inference
            ai_probs = model.predict_win_probability(features, is_chasing=True)
            
            # 3. Simulate Bookmaker Odds (Bookies are usually slightly slower/different than our AI)
            # Add some synthetic "inefficiency" to the bookmaker odds to create an edge
            bookie_noise = random.uniform(-5.0, 5.0)
            implied_a = max(1.0, min(99.0, ai_probs['team_a_prob'] + bookie_noise))
            bookmaker_odds = {
                "team_a": round(100 / implied_a, 2),
                "team_b": round(100 / (100 - implied_a), 2)
            }
            
            # 4. Signal Generation Engine
            signal = generate_signals(ai_probs, bookmaker_odds, recent_events)

            # Build payload
            payload = {
                "match_id": MATCH_ID,
                "score": f"{runs}/{wickets}",
                "overs": f"{current_overs:.1f}",
                "projected_score": target, # Fixed since it's chasing
                "win_probability": {
                    "team_a": ai_probs["team_a_prob"],
                    "team_b": ai_probs["team_b_prob"]
                },
                "odds": bookmaker_odds,
                "signal": signal
            }
            
            # Publish to Redis
            channel = f"match_updates:{MATCH_ID}"
            await redis_client.publish(channel, json.dumps(payload))
            print(f"Published ML update to {channel}: {payload['score']} | AI: {ai_probs['team_a_prob']}% | Edge Signal: {signal['type'] if signal else 'None'}")
            
            if current_overs >= 20.0 or wickets >= 10 or runs >= target:
                print("Match completed. Stopping mock.")
                break
                
    finally:
        await redis_client.close()

if __name__ == "__main__":
    asyncio.run(generate_live_data())
