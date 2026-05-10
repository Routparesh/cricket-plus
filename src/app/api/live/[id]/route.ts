import { NextRequest, NextResponse } from 'next/server';

const CRICKET_API_KEY = process.env.CRICKET_API_KEY || '340342d9-11cd-4234-8ae3-8eaae6475a61';
const ODDS_API_KEY    = process.env.ODDS_API_KEY    || '7698e98685081fe2ab2f5c0ef7918804';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // ── Fetch live matches from CricAPI ──────────────────
    const cricRes = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${CRICKET_API_KEY}&offset=0`,
      { cache: 'no-store' }
    );
    const cricData = await cricRes.json();
    const allMatches: any[] = cricData?.data || [];

    // Find the match by ID or use the first live match
    let match = allMatches.find((m: any) => m.id === id);
    if (!match) match = allMatches.find((m: any) =>
      !['won', 'drawn', 'abandoned'].some(k => m.status?.toLowerCase().includes(k))
    );
    if (!match && allMatches.length > 0) match = allMatches[0];

    if (!match) {
      return NextResponse.json({ error: 'No live matches found' }, { status: 404 });
    }

    // ── Parse Score ──────────────────────────────────────
    const teams: string[] = match.teams || ['Team A', 'Team B'];
    const scores: any[]   = match.score || [];
    const batting          = scores[scores.length - 1] || {};
    const runs    = Number(batting.r  || 0);
    const wickets = Number(batting.w  || 0);
    const overs   = Number(batting.o  || 0);

    // ── Fetch Odds ───────────────────────────────────────
    let teamABack = 2.00, teamBBack = 2.00;
    try {
      const oddsRes = await fetch(
        `https://api.the-odds-api.com/v4/sports/cricket/odds?apiKey=${ODDS_API_KEY}&regions=uk&markets=h2h&oddsFormat=decimal`,
        { cache: 'no-store', next: { revalidate: 60 } }
      );
      const oddsData: any[] = await oddsRes.json();
      const teamALow = teams[0].toLowerCase();
      const teamBLow = teams[1].toLowerCase();

      for (const event of oddsData) {
        const bookmakers: any[] = event.bookmakers || [];
        for (const bookie of bookmakers) {
          const h2h = bookie.markets?.find((m: any) => m.key === 'h2h');
          if (!h2h) continue;
          const outA = h2h.outcomes?.find((o: any) => teamALow.split(' ').some((w: string) => o.name.toLowerCase().includes(w)));
          const outB = h2h.outcomes?.find((o: any) => teamBLow.split(' ').some((w: string) => o.name.toLowerCase().includes(w)));
          if (outA && outB) {
            teamABack = outA.price;
            teamBBack = outB.price;
            break;
          }
        }
        if (teamABack !== 2.00) break;
      }
    } catch {
      // Odds API failed — use probability-based fallback
    }

    // ── Simple AI Win Probability ────────────────────────
    const totalBalls  = Math.round(overs * 6);
    const remaining   = Math.max(0, 120 - totalBalls);
    const rr          = totalBalls > 0 ? (runs / (totalBalls / 6)) : 0;
    const projectedEnd = runs + remaining * (rr / 6);
    let teamAProb = Math.min(95, Math.max(5, 45 + (rr - 7) * 3 - wickets * 4));
    let teamBProb = 100 - teamAProb;

    // ── Signal ───────────────────────────────────────────
    const impliedA = (1 / teamABack) * 100;
    const edge     = teamAProb - impliedA;
    let signal = null;
    if (edge > 10) {
      signal = {
        type: 'ENTRY',
        message: `AI detects +${edge.toFixed(1)}% edge on ${teams[0]}. Market undervaluing their win probability.`,
        suggested_stake: 300,
        risk_level: 'Medium',
      };
    } else if (wickets >= 7 && overs > 15) {
      signal = {
        type: 'EXIT',
        message: `Late collapse warning — ${wickets} wickets down in death overs. Consider cashing out.`,
        suggested_stake: 0,
        risk_level: 'High',
      };
    }

    return NextResponse.json({
      match_id: match.id,
      team_a: teams[0],
      team_b: teams[1],
      score: `${runs}/${wickets}`,
      overs: overs.toFixed(1),
      status: match.status || 'Live',
      win_probability: {
        team_a: parseFloat(teamAProb.toFixed(1)),
        team_b: parseFloat(teamBProb.toFixed(1)),
      },
      odds: {
        team_a_back: teamABack,
        team_b_back: teamBBack,
        team_a_lay: parseFloat((teamABack - 0.02).toFixed(2)),
        team_b_lay: parseFloat((teamBBack - 0.02).toFixed(2)),
      },
      signal,
    });

  } catch (err) {
    console.error('Live API error:', err);
    return NextResponse.json({ error: 'Failed to fetch live data' }, { status: 500 });
  }
}
