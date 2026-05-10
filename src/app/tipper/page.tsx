"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Search, X, ChevronRight, RefreshCw, Shield, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface Match {
  id: string;
  name: string;
  team_a: string;
  team_b: string;
  status: string;
  match_type: string;
  venue: string;
  score: string;
  date: string;
}

// Build AI plan — uses real odds from liveData when available
const getMockPlan = (match: Match, live?: any) => {
  const teamAProb = live?.win_probability?.team_a ?? 63.2;
  const backOdds  = live?.odds?.team_a_back ?? 1.95;
  const layOdds   = live?.odds?.team_a_lay  ?? 1.93;
  const fairOdds  = parseFloat((100 / teamAProb).toFixed(2));
  const impliedPct = (1 / backOdds) * 100;
  const edge      = parseFloat((teamAProb - impliedPct).toFixed(1));
  const ev        = parseFloat(((teamAProb / 100) * (backOdds - 1) - (1 - teamAProb / 100)).toFixed(2));
  const betType   = (live && edge > 5) ? 'BACK' : (live && edge < -5) ? 'LAY' : 'BACK';
  const backTeam  = teamAProb >= 50 ? match.team_a : match.team_b;

  return {
    team_to_back: backTeam,
    bet_type: betType,
    back_odds: backOdds,
    lay_odds: layOdds,
    ai_fair_odds: fairOdds,
    edge,
    ev_pct: ev,
    suggested_stake: 350,
    lay_liability: 0,
    profit_if_win: parseFloat((350 * (backOdds - 1)).toFixed(2)),
    kelly_stake_pct: 3.5,
    confidence: Math.abs(edge) > 10 ? 'High' : Math.abs(edge) > 5 ? 'Medium' : 'Low',
    risk_level: Math.abs(edge) > 10 ? 'Low' : 'Medium',
    risk_rating: 'Moderate',
    optimal_entry_odds: parseFloat((fairOdds * 1.05).toFixed(2)),
    optimal_exit_odds:  parseFloat((fairOdds * 0.78).toFixed(2)),
    stop_loss_odds:     parseFloat((backOdds * 1.35).toFixed(2)),
    max_exposure_pct: 7.0,
    rationale: [
      `AI gives ${backTeam} a ${teamAProb.toFixed(1)}% win probability.`,
      `Exchange back price of ${backOdds} implies only ${impliedPct.toFixed(1)}%. Edge ${edge > 0 ? '+' : ''}${edge}%.`,
      ev > 0 ? `Positive EV of +${ev} confirms this is a worthwhile bet.` : `Marginal EV — proceed with caution.`,
    ],
    steps: [
      `📋 Step 1: ${betType} ${backTeam} on the exchange.`,
      `⏳ Step 2: Enter when ${betType === 'BACK' ? 'back' : 'lay'} odds reach ${parseFloat((fairOdds * 1.05).toFixed(2))} or better.`,
      `💰 Step 3: Stake ₹350 (3.5% bankroll). Profit if ${betType === 'BACK' ? 'win' : 'team loses'}: ₹${parseFloat((350 * (backOdds - 1)).toFixed(2))}.`,
      `🔔 Step 4: Cash-out target at ${parseFloat((fairOdds * 0.78).toFixed(2))} to lock in green.`,
      `🛡️ Step 5: Stop-loss at ${parseFloat((backOdds * 1.35).toFixed(2))} — exit if odds drift past this.`,
      `📈 Step 6: Switch to Live Tip tab for real-time Back/Lay updates.`,
    ],
  };
};



export default function TipperPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bankroll, setBankroll] = useState(10000);
  const [todayAmount, setTodayAmount] = useState(5000);  // Today's betting amount
  const [activeTab, setActiveTab] = useState<'plan' | 'live'>('plan');
  const [liveData, setLiveData] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<Match[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Manual trade tracking state
  const [tradeState, setTradeState] = useState({
    e1Placed: false,
    e2Placed: false,
    exited: false,
  });

  const resetTrade = () => setTradeState({ e1Placed: false, e2Placed: false, exited: false });

  // Fetch initial live match suggestions on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const res = await fetch(`/api/matches/search`);
        const data = await res.json();
        // Only keep matches that are live
        const liveMatches = (data.matches || []).filter((m: any) => 
          !m.status.toLowerCase().includes('won') && !m.status.toLowerCase().includes('yet')
        );
        setSuggestions(liveMatches.length > 0 ? liveMatches : data.matches.slice(0, 4));
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };
    loadSuggestions();
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/matches/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.matches || []);
      } catch {
        setResults([]);
      } finally { setIsSearching(false); }
    }, 400);
  }, [query]);

  // Load live data for selected match
  const loadLiveData = useCallback(async (manual = false) => {
    if (!selectedMatch) return;
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/live/${selectedMatch.id}`);
      const data = await res.json();
      setLiveData(data);
    } catch { setLiveData(null); }
    finally { setIsRefreshing(false); }
  }, [selectedMatch]);

  // Initial load when match selected
  useEffect(() => {
    if (!selectedMatch) { setLiveData(null); return; }
    loadLiveData();
  }, [selectedMatch, loadLiveData]);

  // Build plan from live data
  const plan = selectedMatch ? getMockPlan(selectedMatch, liveData) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Tipper</h1>
            <p className="text-gray-500 text-sm">Search a match to get your personalized Back/Lay betting plan</p>
          </div>
        </div>
        {selectedMatch && (
          <div className="flex items-center gap-2">
            {/* Manual Refresh Only */}
            <button
              onClick={() => loadLiveData(true)}
              disabled={isRefreshing || !selectedMatch}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing Live Data...' : 'Refresh Live Data'}
            </button>
          </div>
        )}
      </div>

      {/* Match Search Box */}
      <div className="relative">
        <div className="flex items-center gap-3 bg-white border-2 border-indigo-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-indigo-500 transition-colors">
          <Search size={20} className="text-indigo-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedMatch(null); }}
            placeholder="Type team name e.g. India, RCB, MI, Australia..."
            className="flex-1 text-sm font-medium outline-none bg-transparent placeholder-gray-400"
          />
          {isSearching && <RefreshCw size={16} className="text-indigo-400 animate-spin" />}
          {query && !isSearching && (
            <button onClick={() => { setQuery(''); setResults([]); setSelectedMatch(null); }}>
              <X size={16} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {results.length > 0 && !selectedMatch && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto">
            {results.map(match => (
              <button
                key={match.id}
                onClick={() => { setSelectedMatch(match); setResults([]); setQuery(match.name); }}
                className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center justify-between border-b border-gray-50 last:border-0 transition-colors"
              >
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{match.team_a} vs {match.team_b}</div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-bold">{match.match_type}</span>
                    {match.score && <span>{match.score}</span>}
                    {match.venue && <span>• {match.venue.slice(0, 30)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {match.status.toLowerCase().includes('won') || match.status.toLowerCase().includes('yet')
                    ? <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Completed</span>
                    : <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />LIVE
                      </span>
                  }
                  <ChevronRight size={14} className="text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {query && !isSearching && results.length === 0 && !selectedMatch && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 px-4 py-5 text-center text-sm text-gray-500">
            No matches found for &quot;{query}&quot;. Try a different team name.
          </div>
        )}
      </div>

      {/* Placeholder when no match selected */}
      {!selectedMatch && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-indigo-400" />
            </div>
            <h3 className="font-bold text-gray-700 text-lg mb-2">Search for a Match</h3>
            <p className="text-gray-400 text-sm max-w-xs mx-auto">
              Type a team name above (e.g. &quot;India&quot;, &quot;RCB&quot;, &quot;Australia&quot;) to get your AI Back/Lay betting plan.
            </p>
          </div>

          {/* Automatic Live Match Suggestions */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Suggested Live Matches
            </h3>

            {isLoadingSuggestions ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-500 gap-2">
                <RefreshCw size={16} className="animate-spin text-indigo-400" />
                Loading live matches...
              </div>
            ) : suggestions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {suggestions.map(match => (
                  <button
                    key={match.id}
                    onClick={() => { setSelectedMatch(match); setQuery(match.name); }}
                    className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all text-left flex items-start justify-between group"
                  >
                    <div>
                      <div className="font-bold text-gray-900 text-sm mb-1">{match.team_a} vs {match.team_b}</div>
                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-bold uppercase">{match.match_type}</span>
                        {match.score ? (
                          <span className="text-indigo-600 font-semibold">{match.score}</span>
                        ) : (
                          <span>{match.status.slice(0, 30)}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      <ChevronRight size={16} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 text-sm border border-gray-100">
                No live matches found right now. Use the search box above to find upcoming matches.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI Plan (shown after match is selected) ── */}
      {selectedMatch && plan && (
        <div className="space-y-6">

          {/* Match Banner */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900">{selectedMatch.team_a} vs {selectedMatch.team_b}</div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-bold">{selectedMatch.match_type}</span>
                {selectedMatch.score && <span>{selectedMatch.score}</span>}
                {selectedMatch.venue && <span>• {selectedMatch.venue}</span>}
              </div>
            </div>
            <button onClick={() => { setSelectedMatch(null); setQuery(''); }} className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
              <X size={12} /> Change
            </button>
          </div>

          {/* Bankroll Input */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-600 shrink-0">Your Bankroll</span>
            <div className="relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
              <input type="number" value={bankroll} onChange={e => setBankroll(Number(e.target.value))}
                className="w-full pl-7 pr-4 py-2 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <span className="text-sm text-gray-500">Suggested stake: <span className="text-indigo-700 font-bold">₹{((plan.kelly_stake_pct / 100) * bankroll).toLocaleString()}</span></span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {(['plan', 'trading', 'live'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                {tab === 'plan' ? '📋 Pre-Match Plan' : tab === 'trading' ? '📊 Trading Plan' : '⚡ Live Tip'}
                {tab === 'live' && <span className="ml-2 inline-flex w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                {tab === 'trading' && <span className="ml-2 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[9px] font-bold rounded uppercase">PRO</span>}
              </button>
            ))}
          </div>

          {activeTab === 'plan' && (
            <div className="space-y-5">

              {/* Hero Card */}
              <div className={`rounded-2xl p-8 text-white shadow-xl relative overflow-hidden ${plan.bet_type === 'BACK' ? 'bg-gradient-to-br from-indigo-600 to-indigo-800' : 'bg-gradient-to-br from-rose-600 to-rose-900'}`}>
                <div className="absolute -right-12 -top-12 w-56 h-56 bg-white/5 rounded-full" />
                <div className="relative z-10">
                  <div className="text-sm font-semibold opacity-70 mb-3">AI TIPPER — {selectedMatch.team_a} vs {selectedMatch.team_b}</div>
                  <div className="text-3xl font-black mb-1">{plan.bet_type} {plan.team_to_back}</div>
                  <div className="text-lg opacity-80 mb-6">@ {plan.bet_type === 'BACK' ? plan.back_odds : plan.lay_odds}</div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
                    {[
                      { label: plan.bet_type === 'BACK' ? 'Back Odds' : 'Lay Odds', value: plan.bet_type === 'BACK' ? plan.back_odds : plan.lay_odds },
                      { label: 'AI Fair Odds', value: plan.ai_fair_odds },
                      { label: 'AI Edge', value: `+${plan.edge}%` },
                      { label: 'EV', value: `+${plan.ev_pct}%` },
                    ].map(item => (
                      <div key={item.label}>
                        <div className="text-xs opacity-60 mb-1">{item.label}</div>
                        <div className="text-2xl font-bold">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Back vs Lay Info Bar */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="text-xs font-bold text-blue-600 mb-2">BACK PRICE ({selectedMatch.team_a})</div>
                  <div className="text-3xl font-black text-blue-700">{plan.back_odds}</div>
                  <div className="text-xs text-blue-500 mt-1">Bet FOR {selectedMatch.team_a} to win</div>
                  {plan.bet_type === 'BACK' && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle size={12} /> AI RECOMMENDS THIS
                    </div>
                  )}
                </div>
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                  <div className="text-xs font-bold text-rose-600 mb-2">LAY PRICE ({selectedMatch.team_a})</div>
                  <div className="text-3xl font-black text-rose-700">{plan.lay_odds}</div>
                  <div className="text-xs text-rose-500 mt-1">Bet AGAINST {selectedMatch.team_a} to win</div>
                  {plan.bet_type === 'LAY' && (
                    <div className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle size={12} /> AI RECOMMENDS THIS
                    </div>
                  )}
                </div>
              </div>

              {/* Stake Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <div className="text-xs text-gray-500 font-medium mb-2">STAKE</div>
                  <div className="text-2xl font-bold text-gray-900">₹{((plan.kelly_stake_pct / 100) * bankroll).toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">{plan.kelly_stake_pct}% (Quarter-Kelly)</div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <div className="text-xs text-gray-500 font-medium mb-2">{plan.bet_type === 'LAY' ? 'YOUR LIABILITY' : 'POTENTIAL PROFIT'}</div>
                  <div className={`text-2xl font-bold ${plan.bet_type === 'LAY' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {plan.bet_type === 'LAY' ? `₹${plan.lay_liability.toLocaleString()}` : `₹${plan.profit_if_win.toLocaleString()}`}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{plan.bet_type === 'LAY' ? 'If team wins, you pay this' : 'If team wins'}</div>
                </div>
                <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                  <div className="text-xs text-gray-500 font-medium mb-2">CONFIDENCE</div>
                  <div className="text-2xl font-bold text-gray-900">{plan.confidence}</div>
                  <div className="text-xs text-gray-400 mt-1">Risk: {plan.risk_rating}</div>
                </div>
              </div>

              {/* Price Levels */}
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Key Price Levels</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Optimal Entry', value: plan.optimal_entry_odds, color: 'text-indigo-700', bg: 'bg-indigo-50', desc: 'Wait for this price or better' },
                    { label: 'Cash-Out Target', value: plan.optimal_exit_odds, color: 'text-emerald-700', bg: 'bg-emerald-50', desc: 'Lock in profit here' },
                    { label: 'Stop Loss', value: plan.stop_loss_odds, color: 'text-rose-700', bg: 'bg-rose-50', desc: 'Exit if price hits this' },
                  ].map(item => (
                    <div key={item.label} className={`flex items-center justify-between px-4 py-3 rounded-lg ${item.bg}`}>
                      <div>
                        <div className={`font-bold text-sm ${item.color}`}>{item.label}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                      <div className={`text-2xl font-black ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Rationale */}
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Why AI recommends this</h3>
                <ul className="space-y-3">
                  {plan.rationale.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <CheckCircle size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step-by-Step */}
              <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Step-by-Step Betting Plan</h3>
                <ol className="space-y-3">
                  {plan.steps.map((step, i) => (
                    <li key={i} className="flex gap-4">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                      <p className="text-sm text-gray-700 pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>Responsible Betting:</strong> AI tips are probabilistic guidance, not guarantees. Never exceed your daily loss limit.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'live' && (
            <div className="space-y-4">
              {liveData ? (
                <div className={`rounded-2xl p-8 text-white text-center shadow-xl ${plan.bet_type === 'BACK' ? 'bg-gradient-to-br from-emerald-600 to-emerald-800' : 'bg-gradient-to-br from-rose-600 to-rose-900'}`}>
                  <div className="text-sm opacity-70 mb-2">AI LIVE TIP — {selectedMatch.team_a} vs {selectedMatch.team_b}</div>
                  <div className="text-4xl font-black mb-1">{plan.bet_type === 'BACK' ? 'ENTER BACK' : 'ENTER LAY'}</div>
                  <div className="text-lg opacity-80 mb-2">{plan.team_to_back} @ {plan.back_odds}</div>
                  <div className="text-sm opacity-70 mb-6">Score: {liveData.score} ({liveData.overs} ov) · {liveData.status?.slice(0,40)}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/20">
                    <div><div className="text-xs opacity-60">AI Win %</div><div className="text-2xl font-bold">{liveData.win_probability.team_a}%</div></div>
                    <div><div className="text-xs opacity-60">Back Odds</div><div className="text-2xl font-bold">{liveData.odds.team_a_back}</div></div>
                    <div><div className="text-xs opacity-60">Lay Odds</div><div className="text-2xl font-bold">{liveData.odds.team_a_lay}</div></div>
                    <div><div className="text-xs opacity-60">Edge</div><div className="text-2xl font-bold text-yellow-300">{plan.edge > 0 ? '+' : ''}{plan.edge}%</div></div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
                  <RefreshCw size={32} className="mx-auto text-gray-400 mb-3 animate-spin" />
                  <p className="text-gray-500 text-sm">Fetching live data for {selectedMatch.team_a} vs {selectedMatch.team_b}...</p>
                </div>
              )}
              {liveData?.signal && (
                <div className={`rounded-xl p-5 border flex items-start gap-3 ${liveData.signal.type === 'ENTRY' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                  <Zap size={20} className={liveData.signal.type === 'ENTRY' ? 'text-emerald-600' : 'text-rose-600'} />
                  <div>
                    <div className={`font-bold text-sm ${liveData.signal.type === 'ENTRY' ? 'text-emerald-900' : 'text-rose-900'}`}>AI {liveData.signal.type} SIGNAL</div>
                    <p className="text-sm mt-1 text-gray-700">{liveData.signal.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TRADING PLAN TAB ── */}
          {(activeTab as string) === 'trading' && (() => {
            // ── User's today amount split into 2 entries ──
            const total    = todayAmount > 0 ? todayAmount : 0;
            const e1Stake  = Math.round(total * 0.75);   // 75% on 1st entry
            const e2Stake  = Math.round(total * 0.25);   // 25% on 2nd entry
            const curOdds  = liveData?.odds?.team_a_back ?? 1.80;

            // Entry trigger odds
            const E1 = 1.50;  // 50 paise (1.40 to 1.50 range)
            const E2 = 1.20;  // 20 paise

            // Determine active entries based on MANUAL user clicks instead of automatic
            const entriesDone = tradeState.e2Placed ? 2 : tradeState.e1Placed ? 1 : 0;
            const isExited = tradeState.exited;

            // Liabilities (safe — never NaN)
            const e1Liability = isFinite(e1Stake) ? Math.round(e1Stake * (E1 - 1)) : 0;
            const e2Liability = isFinite(e2Stake) ? Math.round(e2Stake * (E2 - 1)) : 0;
            const totalLiability = (tradeState.e1Placed ? e1Liability : 0) + (tradeState.e2Placed ? e2Liability : 0);

            // Average lay price — guard division by zero
            const stakeSum = (tradeState.e1Placed ? e1Stake : 0) + (tradeState.e2Placed ? e2Stake : 0);
            const avgPrice = stakeSum > 0
              ? parseFloat((((tradeState.e1Placed ? E1 * e1Stake : 0) + (tradeState.e2Placed ? E2 * e2Stake : 0)) / stakeSum).toFixed(2))
              : 0;

            // Profit if team loses (you win your stake)
            const totalWin = stakeSum;

            // Exit rules (2-entry system)
            const exitRules = [
              { condition: 'Only 1st entry done & rate rises above 1.60 (drift)',  result: 'LOSSCUT', active: entriesDone === 1 && curOdds > 1.60 },
              { condition: 'Only 1st entry done & team rate drops below 1.25',     result: 'BOOKSET', active: entriesDone === 1 && curOdds < 1.25 },
              { condition: 'Both entries done & opposite team touches 1.50',       result: 'LOSSCUT', active: entriesDone === 2 && (2 - curOdds) < 1.50 },
              { condition: 'Both entries done & team goes below 1.15',             result: 'BOOKSET', active: entriesDone === 2 && curOdds < 1.15 },
              { condition: 'Both entries done & team rate around 1.20–1.25',       result: 'BOOKSET', active: entriesDone === 2 && curOdds >= 1.20 && curOdds <= 1.25 },
              { condition: '1st entry done & team around 1.30–1.35 favourite',    result: 'BOOKSET', active: entriesDone === 1 && curOdds >= 1.28 && curOdds <= 1.35 },
              { condition: 'Rate drifts above 1.80 after any entry placed',       result: 'LOSSCUT', active: curOdds > 1.80 && entriesDone > 0 },
              { condition: 'In failure of all above conditions',                   result: 'LOSS',    active: entriesDone === 0 },
            ];
            const activeSignal = exitRules.find(r => r.active);

            return (
              <div className="space-y-5">

                {/* ── Today's Betting Amount Input ── */}
                <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">💰</span>
                    <h3 className="font-bold text-gray-900">Today&apos;s Betting Amount</h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">Enter your total capital for today. The plan auto-divides it: <strong>75% on Entry 1</strong> (1.40 - 1.50) and <strong>25% on Entry 2</strong> (≤1.20).</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                      <input
                        type="number"
                        value={todayAmount}
                        onChange={e => setTodayAmount(Math.max(0, Number(e.target.value)))}
                        className="pl-7 pr-4 py-3 border-2 border-indigo-200 rounded-xl text-xl font-black w-44 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    {[1000, 2000, 5000, 10000, 25000].map(amt => (
                      <button key={amt} onClick={() => setTodayAmount(amt)}
                        className={`px-3 py-2 rounded-lg text-sm font-bold border transition-all ${todayAmount === amt ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-indigo-50'}`}>
                        ₹{(amt / 1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="bg-indigo-50 rounded-xl p-4 text-center border border-indigo-100">
                      <div className="text-xs text-indigo-600 font-bold mb-1">1ST ENTRY (75%)</div>
                      <div className="text-2xl font-black text-indigo-900">₹{e1Stake.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 mt-1">LAY at 1.40 - 1.50</div>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                      <div className="text-xs text-purple-600 font-bold mb-1">2ND ENTRY (25%)</div>
                      <div className="text-2xl font-black text-purple-900">₹{e2Stake.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 mt-1">LAY at ≤ 1.20</div>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-4 text-center border border-rose-100">
                      <div className="text-xs text-rose-600 font-bold mb-1">MAX LIABILITY</div>
                      <div className="text-2xl font-black text-rose-700">₹{(e1Liability + e2Liability).toLocaleString()}</div>
                      <div className="text-xs text-gray-500 mt-1">if team wins (both entries)</div>
                    </div>
                  </div>
                </div>

                {/* ── Status Banner ── */}
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-6 text-white relative">
                  {(tradeState.e1Placed || tradeState.e2Placed || tradeState.exited) && (
                    <button onClick={resetTrade} className="absolute top-4 right-4 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">
                      🔄 RESET TRADE
                    </button>
                  )}
                  <div className="text-xs font-bold opacity-60 mb-1 tracking-widest">MATCH TRADING METHOD — 2 ENTRY</div>
                  <div className="text-2xl font-black mb-3">LAY {selectedMatch.team_a}</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Live Rate', val: String(curOdds), sub: 'current back odds', col: 'text-yellow-300' },
                      { label: 'Entries Placed', val: `${entriesDone}/2`, sub: 'manual tracking', col: 'text-yellow-300' },
                      { label: 'Avg Lay Price', val: entriesDone > 0 ? String(avgPrice) : '—', sub: 'weighted avg', col: 'text-white' },
                      { label: 'Live Liability', val: `₹${totalLiability.toLocaleString()}`, sub: 'if team wins now', col: 'text-rose-300' },
                    ].map(item => (
                      <div key={item.label} className="bg-white/10 rounded-xl p-3">
                        <div className="text-xs opacity-60 mb-1">{item.label}</div>
                        <div className={`text-xl font-black ${item.col}`}>{item.val}</div>
                        <div className="text-xs opacity-50 mt-0.5">{item.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Active Signal ── */}
                {isExited ? (
                  <div className="rounded-2xl p-5 border-2 flex items-center justify-between gap-4 bg-gray-50 border-gray-300">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">🏁</span>
                      <div>
                        <div className="font-black text-2xl text-gray-700">TRADE CLOSED</div>
                        <p className="text-sm text-gray-500 mt-1">You have manually marked this trade as exited.</p>
                      </div>
                    </div>
                    <button onClick={resetTrade} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold text-sm transition-colors">
                      Start New Trade
                    </button>
                  </div>
                ) : activeSignal ? (
                  <div className={`rounded-2xl p-5 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${activeSignal.result === 'BOOKSET' ? 'bg-emerald-50 border-emerald-400' : activeSignal.result === 'LOSSCUT' ? 'bg-rose-50 border-rose-400' : 'bg-gray-50 border-gray-300'}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{activeSignal.result === 'BOOKSET' ? '📗' : activeSignal.result === 'LOSSCUT' ? '✂️' : '❌'}</span>
                      <div>
                        <div className={`font-black text-2xl ${activeSignal.result === 'BOOKSET' ? 'text-emerald-800' : activeSignal.result === 'LOSSCUT' ? 'text-rose-800' : 'text-gray-700'}`}>⚡ {activeSignal.result} NOW</div>
                        <p className="text-sm text-gray-700 mt-1">{activeSignal.condition}</p>
                      </div>
                    </div>
                    {(activeSignal.result === 'BOOKSET' || activeSignal.result === 'LOSSCUT') && (
                      <button 
                        onClick={() => setTradeState(s => ({ ...s, exited: true }))}
                        className={`px-6 py-3 rounded-xl font-black text-white shrink-0 shadow-sm transition-transform hover:scale-105 ${activeSignal.result === 'BOOKSET' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                        MARK AS EXITED
                      </button>
                    )}
                  </div>
                ) : null}

                {/* ── 2 Entry Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-transition" style={{ opacity: isExited ? 0.5 : 1 }}>
                  {[
                    { num: 1, odds: E1, stake: e1Stake, pct: '75%', desc: 'LAY between 40–50 paise (1.40 - 1.50)', placed: tradeState.e1Placed, inRange: curOdds <= E1, liability: e1Liability, profit: e1Stake, color: 'indigo' },
                    { num: 2, odds: E2, stake: e2Stake, pct: '25%', desc: 'LAY below 20 paise (1.20)', placed: tradeState.e2Placed, inRange: curOdds <= E2, liability: e2Liability, profit: e2Stake, color: 'purple' },
                  ].map(e => (
                    <div key={e.num} className={`rounded-2xl border-2 p-6 relative transition-colors ${e.placed ? (e.color === 'indigo' ? 'border-indigo-400 bg-indigo-50' : 'border-purple-400 bg-purple-50') : 'border-gray-200 bg-white'}`}>
                      {e.placed && (
                        <span className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 ${e.color === 'indigo' ? 'bg-indigo-600' : 'bg-purple-600'}`}>
                          ✓ PLACED ON EXCHANGE
                        </span>
                      )}
                      <div className={`text-xs font-bold mb-2 ${e.placed ? (e.color === 'indigo' ? 'text-indigo-500' : 'text-purple-500') : 'text-gray-400'}`}>
                        ENTRY {e.num}
                      </div>
                      <div className="text-5xl font-black text-gray-900 mb-1">≤ {e.odds}</div>
                      <div className="text-sm text-gray-500 mb-5">{e.desc}</div>
                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                          <div className="text-xs text-gray-400 mb-1">STAKE ({e.pct})</div>
                          <div className="text-xl font-black text-gray-900">₹{e.stake.toLocaleString()}</div>
                        </div>
                        <div className="bg-rose-50 rounded-xl p-3 text-center">
                          <div className="text-xs text-rose-500 mb-1">LIABILITY</div>
                          <div className="text-xl font-black text-rose-700">₹{e.liability.toLocaleString()}</div>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3 text-center">
                          <div className="text-xs text-emerald-500 mb-1">WIN (lay wins)</div>
                          <div className="text-xl font-black text-emerald-700">₹{e.profit.toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {e.placed ? (
                          <button 
                            disabled={isExited}
                            onClick={() => setTradeState(s => ({ ...s, [e.num === 1 ? 'e1Placed' : 'e2Placed']: false }))}
                            className="w-full py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            Undo (Mark as Not Placed)
                          </button>
                        ) : (
                          <>
                            {e.inRange && !isExited && (
                              <div className="text-xs font-bold text-emerald-600 mb-1 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Rate is {curOdds}! Safe to place entry on exchange.
                              </div>
                            )}
                            <button 
                              disabled={isExited || (e.num === 2 && !tradeState.e1Placed)}
                              onClick={() => setTradeState(s => ({ ...s, [e.num === 1 ? 'e1Placed' : 'e2Placed']: true }))}
                              className={`w-full py-3 rounded-xl font-black text-white text-sm shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed ${e.inRange ? (e.color === 'indigo' ? 'bg-indigo-600' : 'bg-purple-600') : 'bg-gray-800'}`}>
                              {e.num === 2 && !tradeState.e1Placed ? 'Place Entry 1 First' : 'MARK AS PLACED'}
                            </button>
                            {!e.inRange && !isExited && (
                              <div className="text-xs text-center text-gray-500 mt-1">
                                Rate currently at <strong>{curOdds}</strong>. You can force place it anyway.
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Combined Book (if both entries active) ── */}
                {entriesDone === 2 && (
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
                    <div className="text-sm font-bold opacity-75 mb-3 tracking-wider">✅ COMBINED BOOK — BOTH ENTRIES ACTIVE</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div><div className="text-xs opacity-70">Total Invested</div><div className="text-2xl font-black">₹{todayAmount.toLocaleString()}</div></div>
                      <div><div className="text-xs opacity-70">Avg Lay Price</div><div className="text-2xl font-black">{avgPrice}</div></div>
                      <div><div className="text-xs opacity-70">Win if team loses</div><div className="text-2xl font-black text-yellow-300">₹{totalWin.toLocaleString()}</div></div>
                      <div><div className="text-xs opacity-70">Total Liability</div><div className="text-2xl font-black text-rose-200">₹{totalLiability.toLocaleString()}</div></div>
                    </div>
                  </div>
                )}

                {/* ── Exit Rules Table ── */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900">Exit Rules — Losscut &amp; Bookset</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Live rate: <strong>{curOdds}</strong> — Conditions checked in real-time</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {exitRules.map((rule, i) => (
                      <div key={i} className={`flex items-center justify-between px-5 py-3 gap-4 ${rule.active ? (rule.result === 'BOOKSET' ? 'bg-emerald-50' : rule.result === 'LOSSCUT' ? 'bg-rose-50' : 'bg-gray-100') : ''}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${rule.active ? (rule.result === 'BOOKSET' ? 'bg-emerald-500' : rule.result === 'LOSSCUT' ? 'bg-rose-500' : 'bg-gray-400') : 'bg-gray-200'}`} />
                          <span className={`text-sm ${rule.active ? 'font-bold text-gray-900' : 'text-gray-600'}`}>{rule.condition}</span>
                        </div>
                        <span className={`text-xs font-black px-3 py-1.5 rounded-full shrink-0 ${rule.result === 'BOOKSET' ? 'bg-emerald-100 text-emerald-800' : rule.result === 'LOSSCUT' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-600'}`}>{rule.result}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    <strong>Bookset</strong> = Back the same team at lower odds to lock in a guaranteed green book on both outcomes. <strong>Losscut</strong> = Exit position immediately to cap losses. <strong>Paise</strong> = decimal after 1.x (40 paise = 1.40 odds).
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
