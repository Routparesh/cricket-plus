"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, ShieldAlert, TrendingDown, Save } from 'lucide-react';

// Example API fetcher (would point to actual FastAPI /api/v1/bankroll route)
const fetchBankroll = async () => {
  // Mock API call for now
  return {
    total_balance: 12652,
    risk_level: 'medium',
    daily_loss_limit: 1000,
    stop_loss: 5000,
  };
};

export default function BankrollPage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: bankroll, isLoading } = useQuery({
    queryKey: ['bankroll'],
    queryFn: fetchBankroll,
  });

  const [formData, setFormData] = useState({
    total_balance: 0,
    risk_level: 'medium',
    daily_loss_limit: 0,
    stop_loss: 0,
  });

  // Sync state when data loads
  React.useEffect(() => {
    if (bankroll) {
      setFormData(bankroll);
    }
  }, [bankroll]);

  const handleSave = () => {
    console.log("Saving new bankroll state:", formData);
    // TODO: useMutation to send to FastAPI
    setIsEditing(false);
  };

  if (isLoading) return <div className="p-6">Loading Bankroll Data...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bankroll Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your funds, risk levels, and loss limits</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Edit Settings
          </button>
        ) : (
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Save size={16} />
            Save Changes
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Total Balance Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Wallet size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Total Balance</h3>
          </div>
          
          {isEditing ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <input 
                type="number"
                value={formData.total_balance}
                onChange={(e) => setFormData({...formData, total_balance: Number(e.target.value)})}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="text-4xl font-bold text-gray-900">
              ₹{formData.total_balance.toLocaleString()}
            </div>
          )}
        </div>

        {/* Risk Level Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <ShieldAlert size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Risk Profile</h3>
          </div>
          
          {isEditing ? (
            <select 
              value={formData.risk_level}
              onChange={(e) => setFormData({...formData, risk_level: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
            >
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
          ) : (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold capitalize">
              {formData.risk_level} Risk
            </div>
          )}
        </div>

        {/* Daily Loss Limit Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
              <TrendingDown size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Daily Loss Limit</h3>
          </div>
          
          {isEditing ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <input 
                type="number"
                value={formData.daily_loss_limit}
                onChange={(e) => setFormData({...formData, daily_loss_limit: Number(e.target.value)})}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="text-2xl font-bold text-gray-900">
              ₹{formData.daily_loss_limit.toLocaleString()}
            </div>
          )}
          <p className="text-sm text-gray-500 mt-2">Maximum acceptable loss per day.</p>
        </div>

        {/* Stop Loss Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
              <ShieldAlert size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Hard Stop Loss</h3>
          </div>
          
          {isEditing ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
              <input 
                type="number"
                value={formData.stop_loss}
                onChange={(e) => setFormData({...formData, stop_loss: Number(e.target.value)})}
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          ) : (
            <div className="text-2xl font-bold text-gray-900">
              ₹{formData.stop_loss.toLocaleString()}
            </div>
          )}
          <p className="text-sm text-gray-500 mt-2">Absolute minimum balance before freezing trades.</p>
        </div>

      </div>
    </div>
  );
}
