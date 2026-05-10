"use client";

import React from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, Award, Target, Activity } from 'lucide-react';

const roiData = [
  { month: 'Jan', roi: 5.2 },
  { month: 'Feb', roi: 8.4 },
  { month: 'Mar', roi: -2.1 },
  { month: 'Apr', roi: 12.5 },
  { month: 'May', roi: 18.2 },
  { month: 'Jun', roi: 24.8 },
];

const profitData = [
  { day: 'Mon', profit: 1200 },
  { day: 'Tue', profit: -400 },
  { day: 'Wed', profit: 2100 },
  { day: 'Thu', profit: 800 },
  { day: 'Fri', profit: -1200 },
  { day: 'Sat', profit: 3400 },
  { day: 'Sun', profit: 5600 },
];

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Track your betting ROI and strategy performance</p>
        </div>
        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          Export Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp size={20} />
            </div>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">+24.8%</span>
          </div>
          <div className="text-sm font-medium text-gray-500 mb-1">Total ROI</div>
          <div className="text-2xl font-bold text-gray-900">24.8%</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Award size={20} />
            </div>
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">+12%</span>
          </div>
          <div className="text-sm font-medium text-gray-500 mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-gray-900">62.4%</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Target size={20} />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-500 mb-1">Total Bets Placed</div>
          <div className="text-2xl font-bold text-gray-900">1,248</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
              <Activity size={20} />
            </div>
          </div>
          <div className="text-sm font-medium text-gray-500 mb-1">Total Profit</div>
          <div className="text-2xl font-bold text-gray-900">₹84,500</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ROI Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-6">Cumulative ROI (6 Months)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip />
                <Line type="monotone" dataKey="roi" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-6">Weekly Profit/Loss</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                <Tooltip />
                <Area type="monotone" dataKey="profit" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
