"""
AI Tipper API Router — Supports Back/Lay exchange betting.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.tipper_engine import generate_match_plan, generate_live_tip, ExchangeOdds

router = APIRouter(tags=["AI Tipper"])


class PreMatchRequest(BaseModel):
    team_a: str
    team_b: str
    team_a_prob: float
    team_b_prob: float
    # Exchange prices (Back & Lay for each team)
    team_a_back_odds: float
    team_a_lay_odds: float
    team_b_back_odds: float
    team_b_lay_odds: float
    venue_factor: float = 0.0
    form_factor: float = 0.0
    bankroll: float = 10000.0


class LiveTipRequest(BaseModel):
    team_a_prob: float
    team_b_prob: float
    # Exchange prices
    team_a_back_odds: float
    team_a_lay_odds: float
    team_b_back_odds: float
    team_b_lay_odds: float
    recent_events: list
    overs: float
    wickets: int
    runs_required: int
    balls_remaining: int
    bankroll: float = 10000.0
    current_position: Optional[str] = None   # "team_a", "team_b", or None


@router.post("/plan")
async def get_pre_match_plan(req: PreMatchRequest):
    """
    Generate a full pre-match plan with Back/Lay recommendations.
    Evaluates both teams and returns primary + optional secondary tips.
    """
    plan = generate_match_plan(
        team_a=req.team_a,
        team_b=req.team_b,
        team_a_prob=req.team_a_prob,
        team_b_prob=req.team_b_prob,
        team_a_back_odds=req.team_a_back_odds,
        team_a_lay_odds=req.team_a_lay_odds,
        team_b_back_odds=req.team_b_back_odds,
        team_b_lay_odds=req.team_b_lay_odds,
        venue_factor=req.venue_factor,
        form_factor=req.form_factor,
        bankroll=req.bankroll,
    )

    def serialize_tip(tip):
        if tip is None:
            return None
        return {
            "bet_type": tip.bet_type,
            "team": tip.team,
            "back_odds": tip.back_odds,
            "lay_odds": tip.lay_odds,
            "ai_fair_odds": tip.ai_fair_odds,
            "edge": tip.edge,
            "suggested_stake": tip.suggested_stake,
            "lay_liability": tip.lay_liability,
            "profit_if_win": tip.profit_if_win,
            "kelly_stake_pct": tip.kelly_stake_pct,
            "confidence": tip.confidence,
            "ev_pct": tip.ev_pct,
            "reasoning": tip.reasoning,
            "risk_level": tip.risk_level,
        }

    return {
        "match_label": plan.match_label,
        "primary_tip": serialize_tip(plan.primary_tip),
        "secondary_tip": serialize_tip(plan.secondary_tip),
        "strategy": plan.strategy,
        "optimal_entry_odds": plan.optimal_entry_odds,
        "optimal_exit_odds": plan.optimal_exit_odds,
        "stop_loss_odds": plan.stop_loss_odds,
        "max_exposure_pct": plan.max_exposure_pct,
        "confidence": plan.confidence,
        "rationale": plan.rationale,
        "steps": plan.steps,
        "risk_rating": plan.risk_rating,
    }


@router.post("/live-tip")
async def get_live_tip(req: LiveTipRequest):
    """
    Generate a real-time Back/Lay tip based on live match state.
    Returns ENTER_BACK, ENTER_LAY, EXIT, or HOLD with full liability details.
    """
    odds_a = ExchangeOdds(back=req.team_a_back_odds, lay=req.team_a_lay_odds)
    odds_b = ExchangeOdds(back=req.team_b_back_odds, lay=req.team_b_lay_odds)

    tip = generate_live_tip(
        ai_probs={"team_a_prob": req.team_a_prob, "team_b_prob": req.team_b_prob},
        exchange_odds_a=odds_a,
        exchange_odds_b=odds_b,
        recent_events=req.recent_events,
        overs=req.overs,
        wickets=req.wickets,
        runs_required=req.runs_required,
        balls_remaining=req.balls_remaining,
        bankroll=req.bankroll,
        current_position=req.current_position,
    )

    return {
        "action": tip.action,
        "bet_type": tip.bet_type,
        "team": tip.team,
        "back_odds": tip.back_odds,
        "lay_odds": tip.lay_odds,
        "fair_odds": tip.fair_odds,
        "edge": tip.edge,
        "suggested_stake": tip.suggested_stake,
        "lay_liability": tip.lay_liability,
        "profit_if_win": tip.profit_if_win,
        "reasoning": tip.reasoning,
        "urgency": tip.urgency,
        "confidence_pct": tip.confidence_pct,
        "risk_level": tip.risk_level,
        "momentum": tip.momentum,
    }
