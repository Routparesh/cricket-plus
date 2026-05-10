"use client";

import React from 'react';
import { Settings, Users, Database, Shield } from 'lucide-react';

export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Console</h1>
          <p className="text-gray-500 text-sm mt-1">Manage AI models, API keys, and platform settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* ML Models Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <Database size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">AI Models</h3>
          <p className="text-sm text-gray-500 mt-1">Manage XGBoost weights and inference nodes</p>
          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
            <span className="text-emerald-600 font-medium">2 Active Models</span>
            <span className="text-indigo-600 font-medium">Manage &rarr;</span>
          </div>
        </div>

        {/* API Integration Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
            <Settings size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Data Providers</h3>
          <p className="text-sm text-gray-500 mt-1">Configure OddsAPI and CricAPI webhooks</p>
          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
            <span className="text-emerald-600 font-medium">Healthy</span>
            <span className="text-indigo-600 font-medium">Manage &rarr;</span>
          </div>
        </div>

        {/* User Management */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Users size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">User Moderation</h3>
          <p className="text-sm text-gray-500 mt-1">View user analytics and subscription tiers</p>
          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
            <span className="text-gray-600 font-medium">1,248 Users</span>
            <span className="text-indigo-600 font-medium">Manage &rarr;</span>
          </div>
        </div>

        {/* Security & Roles */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4">
            <Shield size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Security / RLS</h3>
          <p className="text-sm text-gray-500 mt-1">Configure Supabase RLS and admin access</p>
          <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center text-sm">
            <span className="text-gray-600 font-medium">3 Admins</span>
            <span className="text-indigo-600 font-medium">Manage &rarr;</span>
          </div>
        </div>

      </div>

      <div className="mt-8 bg-gray-900 rounded-xl p-8 text-white">
        <h3 className="text-xl font-bold mb-2">Production Deployment Status</h3>
        <p className="text-gray-400 mb-6">CI/CD pipeline and infrastructure health.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Frontend (Vercel)</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="font-bold">v1.0.4 - Deployed</span>
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Backend (Docker/ECS)</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="font-bold">v2.1.0 - Healthy</span>
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400 mb-1">Database (Supabase)</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="font-bold">Connected (99.9% uptime)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
