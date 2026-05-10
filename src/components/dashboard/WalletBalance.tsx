import React from 'react';
import { Wallet } from 'lucide-react';

export default function WalletBalance() {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center gap-2 mb-6 text-sm font-semibold text-gray-700">
        <Wallet size={16} />
        <span>Wallet Balance</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
          <Wallet size={24} />
        </div>
        <div>
          <div className="text-3xl font-bold text-gray-900">₹12,652</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Total Wallet Balance</div>
        </div>
      </div>
    </div>
  );
}
