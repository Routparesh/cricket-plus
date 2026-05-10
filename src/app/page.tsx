import React from 'react';
import MatchCard from '@/components/dashboard/MatchCard';
import WalletBalance from '@/components/dashboard/WalletBalance';
import EventStatistics from '@/components/dashboard/EventStatistics';
import MarketOverview from '@/components/dashboard/MarketOverview';
import FollowersFollowing from '@/components/dashboard/FollowersFollowing';
import TopUsersTable from '@/components/dashboard/TopUsersTable';

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Row: Match Cards */}
      <div className="flex flex-wrap gap-4">
        <MatchCard 
          title="Eliminator • WPL • WT20 • Brabourne"
          team1={{ name: 'Mumbai Indians Women', logoColor: 'bg-blue-600' }}
          team2={{ name: 'Gujarat Giants Women', logoColor: 'bg-orange-500' }}
          time="7:30 PM"
          day="Today"
        />
        <MatchCard 
          title="2nd • T20I • Pakistan Tour of New Zeal..."
          badge="T20I"
          team1={{ name: 'New Zealand', logoColor: 'bg-black' }}
          team2={{ name: 'Pakistan', logoColor: 'bg-green-600' }}
          time="18 Mar, 7:30 PM"
          day="Tuesday"
        />
        <MatchCard 
          title="Result • 2nd T20I • Christchurch"
          team1={{ name: 'SL-W', score: '113-7', logoColor: 'bg-blue-800' }}
          team2={{ name: 'NZ-W', score: '117-3', logoColor: 'bg-black' }}
          date="18/3/20 ov, T:114"
          status="result"
        />
        <MatchCard 
          title="Final • Malaysia Tri-Nation T20I Series..."
          badge="T20I"
          team1={{ name: 'HK', score: '126-5 (20)', logoColor: 'bg-red-600' }}
          team2={{ name: 'BHR', score: '129-2 (18.4)', logoColor: 'bg-green-500' }}
          status="result"
        />
      </div>

      {/* Middle Row: Stats & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <div className="flex-1">
            <WalletBalance />
          </div>
          <div className="flex-1">
            <FollowersFollowing />
          </div>
        </div>

        {/* Center Column */}
        <div className="lg:col-span-2 flex flex-col">
          <EventStatistics />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 flex flex-col">
          <MarketOverview />
        </div>
      </div>

      {/* Bottom Row: Table */}
      <div>
        <TopUsersTable />
      </div>

    </div>
  );
}
