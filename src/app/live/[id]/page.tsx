"use client";

import React, { use, useState, useEffect, useCallback } from 'react';
import { Activity, TrendingUp, TrendingDown, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

// ── Types ────────────────────────────────────────────────
interface MatchState {
  team_a: string;
  team_b: string;
  score: string;
  overs: string | number;
  status: string;
  win_probability: { team_a: number; team_b: number };
  odds: { team_a_back: number; team_b_back: number };
  signal: { type: string; message: string; suggested_stake: number; risk_level: string } | null;
}

// ── Next.js API route that fetches from CricAPI ──────────
// Route: /api/live/[id]
export default function LiveMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [history, setHistory] = useState<{ over: string; teamA: number; teamB: number }[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const fetchLiveData = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/live/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: MatchState = await res.json();
      setMatchState(data);
      setHistory(prev => {
        const overs = String(data.overs);
        if (prev.length > 0 && prev[prev.length - 1].over === overs) return prev;
        const next = [...prev, { over: overs, teamA: data.win_probability.team_a, teamB: data.win_probability.team_b }];
        return next.slice(-12);
      });
      setLastUpdated(new Date().toLocaleTimeString());
      setCountdown(30);
      setError('');
    } catch {
      setError('Could not fetch live data. Check your connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => { fetchLiveData(); }, [fetchLiveData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchLiveData(), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLiveData]);

  // Countdown ticker (only when autoRefresh is on)
  useEffect(() => {
    if (!autoRefresh) { setCountdown(30); return; }
    const tick = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 30), 1000);
    return () => clearInterval(tick);
  }, [autoRefresh]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-gray-500">
      <RefreshCw size={20} className="animate-spin" />
      <span>Fetching live match data...</span>
    </div>
  );

  if (error || !matchState) return (
    <div className="max-w-2xl mx-auto mt-16 bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
      <AlertTriangle size={40} className="mx-auto text-amber-500 mb-4" />
      <h2 className="text-lg font-bold text-amber-900 mb-2">Backend Not Running</h2>
      <p className="text-amber-700 text-sm mb-6">{error || 'No match data available.'}</p>
      <div className="bg-white rounded-xl p-4 text-left border border-amber-100">
        <p className="text-xs font-bold text-gray-700 mb-2">Start the backend in a new terminal:</p>
        <code className="block bg-gray-900 text-green-400 text-xs p-3 rounded-lg">
          cd C:\Users\SHREEG\Desktop\cricket-api\backend{'\n'}
          python -m uvicorn main:app --reload --port 8000
        </code>
      </div>
      <button onClick={fetchLiveData} className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
        Retry
      </button>
    </div>
  );

  const { team_a, team_b, score, overs, status, win_probability, odds, signal } = matchState;

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{team_a} vs {team_b}</h1>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse inline-block" />
              LIVE
            </span>
          </div>
          <p className="text-gray-500 text-sm">{status} · Last updated: {lastUpdated}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Manual Refresh */}
          <button
            onClick={() => fetchLiveData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60 transition-all"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(a => !a)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              autoRefresh
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
            {autoRefresh ? `Auto ON · ${countdown}s` : 'Auto OFF'}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Score Card */}
        <div className="bg-gray-900 rounded-xl p-6 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-gray-800 rounded-full opacity-50" />
          <div className="relative z-10">
            <div className="text-sm text-gray-400 mb-1">Current Score</div>
            <div className="text-5xl font-bold">{score}</div>
            <div className="text-lg text-gray-300 mt-1">Overs: {overs}</div>
            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between">
              <div><div className="text-xs text-gray-400">Status</div><div className="font-semibold text-sm">{status.slice(0, 30)}</div></div>
            </div>
          </div>
        </div>

        {/* Win Probability */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-5 text-sm font-semibold text-gray-700">
            <Activity size={16} /> AI Win Probability
          </div>
          <div className="space-y-4">
            {[
              { team: team_a, prob: win_probability.team_a, color: 'bg-blue-600', text: 'text-blue-600' },
              { team: team_b, prob: win_probability.team_b, color: 'bg-orange-500', text: 'text-orange-500' },
            ].map(t => (
              <div key={t.team}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-bold text-gray-900">{t.team}</span>
                  <span className={`font-bold ${t.text}`}>{t.prob}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div className={`${t.color} h-2.5 rounded-full transition-all duration-700`} style={{ width: `${t.prob}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Odds */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-5 text-sm font-semibold text-gray-700">
            <TrendingUp size={16} /> Live Bookmaker Odds
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
              <div className="text-sm font-bold text-blue-900 mb-1">{team_a}</div>
              <div className="text-2xl font-bold text-blue-700">{odds.team_a_back}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-100">
              <div className="text-sm font-bold text-orange-900 mb-1">{team_b}</div>
              <div className="text-2xl font-bold text-orange-700">{odds.team_b_back}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Signal Card */}
      {signal && (
        <div className={`rounded-xl p-6 border shadow-sm flex items-start gap-4 ${signal.type === 'ENTRY' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${signal.type === 'ENTRY' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            {signal.type === 'ENTRY' ? <Zap size={24} /> : <AlertTriangle size={24} />}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${signal.type === 'ENTRY' ? 'text-emerald-900' : 'text-rose-900'}`}>
              AI {signal.type} SIGNAL
            </h3>
            <p className={`mt-1 font-medium ${signal.type === 'ENTRY' ? 'text-emerald-700' : 'text-rose-700'}`}>{signal.message}</p>
            <div className="mt-3 flex gap-3">
              <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-bold shadow-sm">Stake: ₹{signal.suggested_stake}</span>
              <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-bold shadow-sm">Risk: {signal.risk_level}</span>
            </div>
          </div>
        </div>
      )}

      {/* Momentum Chart */}
      {history.length > 1 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-5 text-sm font-semibold text-gray-700">
            <Activity size={16} /> Match Momentum
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="over" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                <Tooltip />
                <Line type="monotone" dataKey="teamA" name={team_a} stroke="#2563eb" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="teamB" name={team_b} stroke="#f97316" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
