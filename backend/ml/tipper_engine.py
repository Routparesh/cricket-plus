"""
AI Tipper Engine — Personal Betting Advisor with Back/Lay Support.

BACK BET:  You bet FOR a team to win. Win Profit = Stake × (Odds - 1)
LAY BET:   You bet AGAINST a team (act as the bookmaker).
           You win the backer's stake if they lose.
           Your Liability = Backer Stake × (Lay Odds - 1)

Exchange Market (e.g. Betfair):
  - Back Odds are always HIGHER than Lay Odds for the same team.
  - Back if: AI Prob > Implied Back Prob  → team is UNDERVALUED by market
  - Lay if:  AI Prob < Implied Lay Prob   → team is OVERVALUED, likely to lose
"""

from dataclasses import dataclass
from typing import Optional, Literal

BET_TYPE = Literal["BACK", "LAY", "AVOID"]


# ─────────────────────────────────────────────────────────────────────────────
# Data Structures
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class ExchangeOdds:
    """Back and Lay prices for a team on the exchange."""
    back: float    # Price you can BACK at  (higher)
    lay: float     # Price you can LAY at   (lower)

    @property
    def spread(self) -> float:
        return round(self.back - self.lay, 2)


@dataclass
class BackLayTip:
    """A single actionable Back or Lay tip."""
    bet_type: BET_TYPE
    team: str
    back_odds: float
    lay_odds: float
    ai_fair_odds: float
    edge: float
    suggested_stake: float
    lay_liability: float        # 0 for BACK bets
    profit_if_win: float
    kelly_stake_pct: float
    confidence: str
    ev_pct: float
    reasoning: str
    risk_level: str


@dataclass
class BettingPlan:
    """Full pre-match plan with primary and optional secondary Back/Lay tips."""
    match_label: str
    primary_tip: BackLayTip
    secondary_tip: Optional[BackLayTip]
    strategy: str
    optimal_entry_odds: float
    optimal_exit_odds: float
    stop_loss_odds: float
    max_exposure_pct: float
    confidence: str
    rationale: list
    steps: list
    risk_rating: str


@dataclass
class LiveTip:
    """Real-time Back/Lay tip during a live match."""
    action: str            # "ENTER_BACK", "ENTER_LAY", "EXIT", "HOLD", "AVOID"
    bet_type: BET_TYPE
    team: str
    back_odds: float
    lay_odds: float
    fair_odds: float
    edge: float
    suggested_stake: float
    lay_liability: float
    profit_if_win: float
    reasoning: str
    urgency: str
    confidence_pct: float
    risk_level: str
    momentum: str


# ─────────────────────────────────────────────────────────────────────────────
# Kelly Criterion
# ─────────────────────────────────────────────────────────────────────────────

def kelly_back(win_prob: float, back_odds: float, fraction: float = 0.25) -> float:
    """Quarter-Kelly for a BACK bet. Returns % of bankroll."""
    b = back_odds - 1
    if b <= 0 or win_prob <= 0:
        return 0.0
    q = 1 - win_prob
    kelly = (b * win_prob - q) / b
    return round(min(max(kelly * fraction * 100, 0.0), 10.0), 2)


def kelly_lay(win_prob: float, lay_odds: float, fraction: float = 0.25) -> float:
    """
    Quarter-Kelly for a LAY bet. Returns backer-stake % of bankroll.
    win_prob = AI-estimated probability the team you're laying WINS.
    """
    lay_win_prob = 1 - win_prob   # Probability lay bet succeeds (team loses)
    b = lay_odds - 1
    if b <= 0 or lay_win_prob <= 0:
        return 0.0
    q = 1 - lay_win_prob
    kelly = (b * lay_win_prob - q) / b
    return round(min(max(kelly * fraction * 100, 0.0), 10.0), 2)


# ─────────────────────────────────────────────────────────────────────────────
# Core Back/Lay Evaluator
# ─────────────────────────────────────────────────────────────────────────────

def evaluate_back_lay(
    team_name: str,
    ai_prob: float,
    exchange_odds: ExchangeOdds,
    bankroll: float = 10000.0,
    is_live: bool = False
) -> BackLayTip:
    """
    Decision Logic:
    ─────────────────────────────────────────────────────────
    AI Prob > Implied Back Prob  → BACK  (team underpriced)
    AI Prob < Implied Lay Prob   → LAY   (team overpriced)
    Between Back/Lay implied     → AVOID (no clear edge)
    ─────────────────────────────────────────────────────────
    """
    ai_prob_dec = ai_prob / 100
    fair_odds = round(1 / ai_prob_dec, 2) if ai_prob_dec > 0 else 99.9

    implied_back_prob = 1 / exchange_odds.back
    implied_lay_prob  = 1 / exchange_odds.lay

    back_edge = (ai_prob_dec - implied_back_prob) * 100
    lay_edge  = (implied_lay_prob - ai_prob_dec) * 100

    if back_edge > 4.0:
        bet_type: BET_TYPE = "BACK"
        edge = back_edge
        stake_pct = kelly_back(ai_prob_dec, exchange_odds.back)
        stake = round((stake_pct / 100) * bankroll, 0)
        liability = 0.0
        profit = round(stake * (exchange_odds.back - 1), 2)
        ev_pct = round((ai_prob_dec * (exchange_odds.back - 1) - (1 - ai_prob_dec)) * 100, 1)
        reasoning = (
            f"AI gives {team_name} a {ai_prob:.1f}% win chance. "
            f"Exchange back price of {exchange_odds.back} implies only "
            f"{implied_back_prob*100:.1f}%. "
            f"Edge +{back_edge:.1f}% — BACK is the value bet."
        )

    elif lay_edge > 4.0:
        bet_type = "LAY"
        edge = lay_edge
        stake_pct = kelly_lay(ai_prob_dec, exchange_odds.lay)
        stake = round((stake_pct / 100) * bankroll, 0)
        liability = round(stake * (exchange_odds.lay - 1), 2)
        profit = stake
        ev_pct = round(((1 - ai_prob_dec) * stake - ai_prob_dec * liability) / max(bankroll, 1) * 100, 1)
        reasoning = (
            f"AI gives {team_name} only {ai_prob:.1f}% win chance. "
            f"Exchange lay price of {exchange_odds.lay} implies "
            f"{implied_lay_prob*100:.1f}%. "
            f"Edge +{lay_edge:.1f}% — LAY {team_name} (bet against them)."
        )

    else:
        bet_type = "AVOID"
        edge = max(back_edge, lay_edge)
        stake_pct = 0.0
        stake = 0.0
        liability = 0.0
        profit = 0.0
        ev_pct = round((ai_prob_dec * (exchange_odds.back - 1) - (1 - ai_prob_dec)) * 100, 1)
        reasoning = (
            f"No clear edge for {team_name}. "
            f"AI probability ({ai_prob:.1f}%) is within the exchange spread "
            f"(back {exchange_odds.back} / lay {exchange_odds.lay}). Avoid."
        )

    confidence = "High" if abs(edge) > 12 else ("Medium" if abs(edge) > 6 else "Low")
    risk_level = "Low" if abs(edge) > 12 else ("Medium" if abs(edge) > 6 else "High")

    return BackLayTip(
        bet_type=bet_type,
        team=team_name,
        back_odds=exchange_odds.back,
        lay_odds=exchange_odds.lay,
        ai_fair_odds=fair_odds,
        edge=round(edge, 1),
        suggested_stake=stake,
        lay_liability=liability,
        profit_if_win=profit,
        kelly_stake_pct=stake_pct,
        confidence=confidence,
        ev_pct=ev_pct,
        reasoning=reasoning,
        risk_level=risk_level,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Pre-Match Plan Generator
# ─────────────────────────────────────────────────────────────────────────────

def generate_match_plan(
    team_a: str,
    team_b: str,
    team_a_prob: float,
    team_b_prob: float,
    team_a_back_odds: float,
    team_a_lay_odds: float,
    team_b_back_odds: float,
    team_b_lay_odds: float,
    venue_factor: float = 0.0,
    form_factor: float = 0.0,
    bankroll: float = 10000.0
) -> BettingPlan:
    odds_a = ExchangeOdds(back=team_a_back_odds, lay=team_a_lay_odds)
    odds_b = ExchangeOdds(back=team_b_back_odds, lay=team_b_lay_odds)

    tip_a = evaluate_back_lay(team_a, team_a_prob, odds_a, bankroll)
    tip_b = evaluate_back_lay(team_b, team_b_prob, odds_b, bankroll)

    tips_with_edge = [t for t in [tip_a, tip_b] if t.bet_type != "AVOID"]
    if tips_with_edge:
        primary = max(tips_with_edge, key=lambda t: abs(t.edge))
        secondary = next((t for t in tips_with_edge if t != primary), None)
    else:
        primary = max([tip_a, tip_b], key=lambda t: abs(t.edge))
        secondary = None

    fair = primary.ai_fair_odds
    if primary.bet_type == "BACK":
        optimal_entry = round(fair * 1.05, 2)
        optimal_exit  = round(fair * 0.78, 2)
        stop_loss     = round(primary.back_odds * 1.35, 2)
    else:
        optimal_entry = round(fair * 0.95, 2)
        optimal_exit  = round(fair * 1.20, 2)
        stop_loss     = round(primary.lay_odds * 0.80, 2)

    max_exposure_pct = min(primary.kelly_stake_pct * 2, 15.0)

    rationale = [primary.reasoning]
    if secondary:
        sec_odds = secondary.back_odds if secondary.bet_type == "BACK" else secondary.lay_odds
        rationale.append(f"Secondary: {secondary.bet_type} {secondary.team} @ {sec_odds} (Edge +{secondary.edge}%)")
    if venue_factor > 0:
        rationale.append(f"{team_a} have historical venue advantage.")
    elif venue_factor < 0:
        rationale.append(f"{team_b} have historical venue advantage.")
    if form_factor > 0:
        rationale.append(f"{team_a} in significantly better recent form.")
    if primary.ev_pct > 5:
        rationale.append(f"EV = +{primary.ev_pct}% — mathematically profitable long term.")

    if primary.bet_type == "BACK":
        steps = [
            f"📋 Step 1: Identify {primary.team} as the AI's BACK selection (bet FOR them to win).",
            f"⏳ Step 2: Enter when back odds reach {optimal_entry}+ on the exchange.",
            f"💰 Step 3: Stake ₹{primary.suggested_stake:,.0f} ({primary.kelly_stake_pct}% bankroll). Potential profit: ₹{primary.profit_if_win:,.0f}.",
            f"🔔 Step 4: Set cash-out alert at {optimal_exit} odds to lock in profit.",
            f"🛡️ Step 5: Stop-loss at {stop_loss} — cut position if price drifts past this.",
            f"📈 Step 6: Monitor powerplay (Overs 1-6) and use Live Tip for ball-by-ball signals.",
            f"🚪 Step 7: If AI confidence drops below 60%, consider partial cash-out.",
        ]
    elif primary.bet_type == "LAY":
        steps = [
            f"📋 Step 1: AI recommends LAYING {primary.team} — you are betting AGAINST them winning.",
            f"⚠️  Step 2: Understand your LIABILITY: if {primary.team} wins, you PAY ₹{primary.lay_liability:,.0f}.",
            f"💰 Step 3: Accept backer stake of ₹{primary.suggested_stake:,.0f} @ lay {primary.lay_odds}. Profit if they lose: ₹{primary.profit_if_win:,.0f}.",
            f"⏳ Step 4: Look for lay price {optimal_entry} or lower on the exchange.",
            f"🔔 Step 5: Close the lay if odds drift to {optimal_exit} (position turning against you).",
            f"🛡️ Step 6: Never expose more than {max_exposure_pct}% of bankroll in liability.",
            f"📈 Step 7: Monitor powerplay. Big over or early wicket quickly changes lay value.",
        ]
    else:
        steps = [
            "📋 Step 1: No clear Back or Lay edge in the current market.",
            "⏳ Step 2: Monitor the first 2-3 overs before committing capital.",
            "🔍 Step 3: Switch to Live Tip tab for in-play Back/Lay signals.",
        ]

    strategy = "entry_now" if abs(primary.edge) > 12 else ("wait_for_odds" if primary.bet_type != "AVOID" else "avoid")

    return BettingPlan(
        match_label=f"{team_a} vs {team_b}",
        primary_tip=primary,
        secondary_tip=secondary,
        strategy=strategy,
        optimal_entry_odds=optimal_entry,
        optimal_exit_odds=optimal_exit,
        stop_loss_odds=stop_loss,
        max_exposure_pct=max_exposure_pct,
        confidence=primary.confidence,
        rationale=rationale,
        steps=steps,
        risk_rating="Aggressive" if abs(primary.edge) > 15 else ("Moderate" if abs(primary.edge) > 8 else "Conservative"),
    )


# ─────────────────────────────────────────────────────────────────────────────
# Live Back/Lay Tip Generator
# ─────────────────────────────────────────────────────────────────────────────

def generate_live_tip(
    ai_probs: dict,
    exchange_odds_a: ExchangeOdds,
    exchange_odds_b: ExchangeOdds,
    recent_events: list,
    overs: float,
    wickets: int,
    runs_required: int,
    balls_remaining: int,
    bankroll: float = 10000.0,
    current_position: Optional[str] = None
) -> LiveTip:
    team_a_prob = ai_probs["team_a_prob"]
    team_b_prob = ai_probs["team_b_prob"]

    tip_a = evaluate_back_lay("Team A", team_a_prob, exchange_odds_a, bankroll, is_live=True)
    tip_b = evaluate_back_lay("Team B", team_b_prob, exchange_odds_b, bankroll, is_live=True)

    recent_wickets = sum(1 for e in recent_events[-4:] if e == "W")
    recent_runs    = sum(e for e in recent_events[-4:] if isinstance(e, int))

    if recent_wickets >= 2:
        momentum = "Bearish"
    elif recent_runs >= 16:
        momentum = "Bullish"
    elif recent_wickets == 1 and overs > 15:
        momentum = "Volatile"
    else:
        momentum = "Neutral"

    is_death = overs >= 16.0
    rrr = (runs_required / (balls_remaining / 6)) if balls_remaining > 0 else 99.0

    # EXIT override
    if current_position and recent_wickets >= 2:
        action = "EXIT"
        best_tip = tip_a if current_position == "team_a" else tip_b
        reasoning = f"Collapse: {recent_wickets} wickets in last 4 balls. Exit all {best_tip.team} positions immediately."
        urgency = "Immediate"
    elif is_death and rrr > 14 and current_position == "team_b":
        action = "EXIT"
        best_tip = tip_b
        reasoning = f"RRR {round(rrr,1)} in death overs. Chase probability collapsing — exit now."
        urgency = "Immediate"
    else:
        candidates = [t for t in [tip_a, tip_b] if t.bet_type != "AVOID"]
        if candidates:
            best_tip = max(candidates, key=lambda t: abs(t.edge))
            action = f"ENTER_{best_tip.bet_type}"
        else:
            best_tip = max([tip_a, tip_b], key=lambda t: abs(t.edge))
            action = "HOLD"

        urgency = (
            "Immediate" if abs(best_tip.edge) > 15 else
            "Next Over"  if abs(best_tip.edge) > 8 else
            "Monitor"
        )
        reasoning = best_tip.reasoning

    confidence_pct = round(min(95.0, max(45.0, abs(best_tip.edge) * 2.5 + 45)), 1)
    odds = exchange_odds_a if best_tip.team == "Team A" else exchange_odds_b

    return LiveTip(
        action=action,
        bet_type=best_tip.bet_type,
        team=best_tip.team,
        back_odds=odds.back,
        lay_odds=odds.lay,
        fair_odds=best_tip.ai_fair_odds,
        edge=best_tip.edge,
        suggested_stake=best_tip.suggested_stake,
        lay_liability=best_tip.lay_liability,
        profit_if_win=best_tip.profit_if_win,
        reasoning=reasoning,
        urgency=urgency,
        confidence_pct=confidence_pct,
        risk_level=best_tip.risk_level,
        momentum=momentum,
    )
