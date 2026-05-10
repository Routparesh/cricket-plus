import numpy as np
import random

class CricketPredictionModel:
    def __init__(self):
        # In a real scenario, we would load an XGBoost or LightGBM model here.
        # e.g., self.model = xgb.Booster(); self.model.load_model("model.json")
        self.is_loaded = True
        
    def predict_win_probability(self, features: np.ndarray, is_chasing: bool) -> dict:
        """
        Simulates model inference. Returns probability of Team A (batting first) 
        and Team B (chasing) winning.
        """
        # Feature extraction (mock logic based on features)
        score = features[0][0]
        wickets = features[0][1]
        overs = features[0][2]
        req_runs = features[0][6]
        
        # Extremely simplified mock heuristic representing an AI prediction
        if not is_chasing:
            # 1st Innings: High score -> high prob for Team A
            projected = score + ((20 - overs) * 8)
            team_a_prob = min(95.0, max(5.0, (projected / 200.0) * 50 + (10 - wickets) * 2))
        else:
            # 2nd Innings: RRR vs Wickets
            req_rr = features[0][7]
            if req_rr > 12:
                team_b_prob = min(30.0, (10 - wickets) * 3)
            elif req_rr < 6:
                team_b_prob = max(70.0, 100 - (wickets * 10))
            else:
                team_b_prob = 50.0 + ((10 - req_rr) * 5) - (wickets * 4)
                
            team_b_prob = min(95.0, max(5.0, team_b_prob))
            team_a_prob = 100.0 - team_b_prob
            
        # Add some slight noise to simulate complex model variance
        noise = random.uniform(-1.5, 1.5)
        team_a_prob = min(99.0, max(1.0, team_a_prob + noise))
        
        return {
            "team_a_prob": round(team_a_prob, 1),
            "team_b_prob": round(100.0 - team_a_prob, 1),
            "confidence": round(random.uniform(70.0, 95.0), 1)
        }

# Singleton instance
model = CricketPredictionModel()
