import { NextRequest, NextResponse } from 'next/server';

const CRICKET_API_KEY = process.env.CRICKET_API_KEY || '340342d9-11cd-4234-8ae3-8eaae6475a61';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';

  try {
    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${CRICKET_API_KEY}&offset=0`,
      { cache: 'no-store' }
    );
    const data = await res.json();
    const allMatches: any[] = data?.data || [];

    // Filter by team name if query provided
    const qLow = q.trim().toLowerCase();
    const filtered = qLow
      ? allMatches.filter((m: any) =>
          m.teams?.some((t: string) => t.toLowerCase().includes(qLow)) ||
          m.name?.toLowerCase().includes(qLow)
        )
      : allMatches.slice(0, 20);

    const matches = filtered.map((m: any) => {
      const teams: string[] = m.teams || ['Team A', 'Team B'];
      const scores: any[] = m.score || [];
      const scoreStr = scores
        .map((s: any) => `${s.r ?? 0}/${s.w ?? 0} (${s.o ?? 0} ov)`)
        .join(' | ');

      return {
        id: m.id,
        name: m.name || teams.join(' vs '),
        team_a: teams[0] || 'Team A',
        team_b: teams[1] || 'Team B',
        status: m.status || '',
        match_type: (m.matchType || 'T20').toUpperCase(),
        venue: m.venue || '',
        score: scoreStr,
        date: (m.dateTimeGMT || '').slice(0, 10),
      };
    });

    return NextResponse.json({ matches });
  } catch (err) {
    console.error('Match search error:', err);
    return NextResponse.json({ matches: [] });
  }
}
