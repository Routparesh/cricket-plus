"use client";

import React from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Expected Earnings', value: 400 },
  { name: 'Commission Earned', value: 300 },
  { name: 'No of Open Trades', value: 300 },
  { name: 'No of closed Trades', value: 200 },
];

const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#06b6d4'];

export default function MarketOverview() {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col h-full min-h-[300px]">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-gray-700">
        <PieChartIcon size={16} />
        <span>Market Overview</span>
      </div>
      
      <div className="flex flex-col flex-1">
        <div className="h-[180px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <span className="text-sm font-bold text-gray-900">₹31,000</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-gray-500">Expected Earnings</span>
            </div>
            <span className="font-semibold">₹31,000</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-gray-500">Commission Earned Till Now</span>
            </div>
            <span className="font-semibold">₹76,000</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="text-gray-500">No of Open Trades</span>
            </div>
            <span className="font-semibold">30</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              <span className="text-gray-500">No of closed Trades</span>
            </div>
            <span className="font-semibold">30</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-gray-500">Expected Future Trades</span>
            </div>
            <span className="font-semibold">30</span>
          </div>
        </div>
      </div>
    </div>
  );
}
