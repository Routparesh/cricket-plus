import React from 'react';
import { ChevronRight } from 'lucide-react';

interface MatchCardProps {
  title: string;
  team1: { name: string; score?: string; logoColor: string };
  team2: { name: string; score?: string; logoColor: string };
  status?: string;
  time?: string;
  date?: string;
  day?: string;
  badge?: string;
}

export default function MatchCard({ title, team1, team2, status, time, date, day, badge }: MatchCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col min-w-[300px] flex-1">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs text-gray-500 font-medium">{title}</span>
        {badge && (
          <span className="px-2 py-0.5 bg-gray-900 text-white text-[10px] rounded-full font-semibold">
            {badge}
          </span>
        )}
      </div>

      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-sm ${team1.logoColor}`}></div>
          <span className="text-sm font-semibold">{team1.name}</span>
        </div>
        {team1.score ? (
          <span className="text-sm font-bold">{team1.score}</span>
        ) : (
          <div className="text-right">
            <div className="text-xs text-gray-500">{day}</div>
            <div className="text-sm font-bold">{time}</div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-sm ${team2.logoColor}`}></div>
          <span className="text-sm font-semibold">{team2.name}</span>
        </div>
        {team2.score ? (
          <span className="text-sm font-bold">{team2.score}</span>
        ) : (
          <div className="text-right">
            <div className="text-xs text-gray-500">{date}</div>
            <div className="text-xs font-bold text-gray-400">{time && !team1.score ? '' : time}</div>
          </div>
        )}
      </div>

      <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-xs font-medium text-gray-500">
        <div className="flex gap-3">
          <span className="cursor-pointer hover:text-gray-900">Schedule</span>
          <span className="cursor-pointer hover:text-gray-900">{status ? 'Report' : 'Table'}</span>
          <span className="cursor-pointer hover:text-gray-900">{status ? 'Series' : 'Videos'}</span>
          {!status && <span className="cursor-pointer hover:text-gray-900">Series</span>}
        </div>
        <ChevronRight size={14} className="cursor-pointer hover:text-gray-900" />
      </div>
    </div>
  );
}
