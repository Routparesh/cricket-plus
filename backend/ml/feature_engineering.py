import pandas as pd
import numpy as np

def extract_features(current_score: int, wickets: int, overs: float, target: int = None) -> np.ndarray:
    """
    Converts live match state into a feature vector for the ML model.
    """
    # Calculate derived features
    balls_bowled = int(overs) * 6 + int((overs % 1) * 10)
    balls_remaining = 120 - balls_bowled
    run_rate = current_score / (balls_bowled / 6) if balls_bowled > 0 else 0
    
    features = {
        "current_score": current_score,
        "wickets": wickets,
        "overs": overs,
        "run_rate": run_rate,
        "wickets_remaining": 10 - wickets,
        "balls_remaining": balls_remaining
    }
    
    if target:
        runs_required = target - current_score
        req_run_rate = runs_required / (balls_remaining / 6) if balls_remaining > 0 else 0
        features["runs_required"] = runs_required
        features["req_run_rate"] = req_run_rate
    else:
        features["runs_required"] = 0
        features["req_run_rate"] = 0

    # Convert to numpy array (matching expected model input)
    # Feature order: score, wkts, overs, rr, rem_wkts, rem_balls, req_runs, req_rr
    vector = np.array([
        features["current_score"],
        features["wickets"],
        features["overs"],
        features["run_rate"],
        features["wickets_remaining"],
        features["balls_remaining"],
        features["runs_required"],
        features["req_run_rate"]
    ]).reshape(1, -1)
    
    return vector
