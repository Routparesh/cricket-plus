import React from 'react';
import { Users } from 'lucide-react';

export default function FollowersFollowing() {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2 mb-6 text-sm font-semibold text-gray-700">
        <Users size={16} />
        <span>Followers & Following</span>
      </div>
      
      <div className="flex justify-around items-center pt-2">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
            <Users size={16} />
          </div>
          <div className="text-xl font-bold text-gray-900">2023k</div>
          <div className="text-xs text-gray-500 font-medium">Followers</div>
        </div>
        
        <div className="h-12 w-px bg-gray-100"></div>
        
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
            <Users size={16} />
          </div>
          <div className="text-xl font-bold text-gray-900">2024k</div>
          <div className="text-xs text-gray-500 font-medium">Following</div>
        </div>
      </div>
    </div>
  );
}
