def generate_signals(ai_probs: dict, bookmaker_odds: dict, recent_events: list) -> dict:
    """
    Evaluates AI probabilities against Bookmaker Odds to find value betting opportunities.
    Generates Entry/Exit signals based on EV (Expected Value) and momentum.
    """
    signal = None
    
    # Calculate implied probabilities from bookmaker odds
    # Implied Prob = (1 / decimal_odds) * 100
    implied_prob_a = (1 / bookmaker_odds["team_a"]) * 100
    implied_prob_b = (1 / bookmaker_odds["team_b"]) * 100
    
    # Calculate Edge (AI Prob - Implied Prob)
    edge_a = ai_probs["team_a_prob"] - implied_prob_a
    edge_b = ai_probs["team_b_prob"] - implied_prob_b
    
    # Rule 1: Strong Value Entry (Edge > 10%)
    if edge_a > 10.0:
        signal = {
            "type": "ENTRY",
            "team": "Team A",
            "message": f"Strong value detected for Team A. AI Edge: +{round(edge_a, 1)}%",
            "suggested_stake": 500, # Would be dynamic based on bankroll Kelly Criterion
            "risk_level": "Medium"
        }
    elif edge_b > 10.0:
        signal = {
            "type": "ENTRY",
            "team": "Team B",
            "message": f"Strong value detected for Team B. AI Edge: +{round(edge_b, 1)}%",
            "suggested_stake": 500,
            "risk_level": "Medium"
        }
        
    # Rule 2: Momentum Shift Exit / Warning
    # If recent events contain back-to-back wickets
    if len(recent_events) >= 2 and all(e == "W" for e in recent_events[-2:]):
        signal = {
            "type": "EXIT",
            "team": "Batting Team",
            "message": "Collapse detected! Back-to-back wickets. Consider cashing out batting team positions.",
            "suggested_stake": 0,
            "risk_level": "High"
        }
        
    return signal
