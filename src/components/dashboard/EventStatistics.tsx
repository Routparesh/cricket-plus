"use client";

import React from 'react';
import { BarChart2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'Day 1', india: 4, australia: 8 },
  { name: 'Day 2', india: 8, australia: 2 },
  { name: 'Day 3', india: 2, australia: 8 },
  { name: 'Day 4', india: 6, australia: 4 },
  { name: 'Day 5', india: 4, australia: 6 },
];

export default function EventStatistics() {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col h-full min-h-[300px]">
      <div className="flex items-center gap-2 mb-6 text-sm font-semibold text-gray-700">
        <BarChart2 size={16} />
        <span>Event Statistics</span>
      </div>
      
      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
            <Legend 
              iconType="plainline" 
              wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
              payload={[
                { value: 'India', type: 'line', color: '#3b82f6' },
                { value: 'Australia', type: 'line', color: '#ef4444' }
              ]}
            />
            <Line type="monotone" dataKey="india" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="australia" stroke="#ef4444" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
