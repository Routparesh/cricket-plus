import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Briefcase, 
  Wrench,
  ChevronDown,
  ChevronLeft,
  Zap,
  BarChart2,
  Wallet,
  Radio
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={18} /> },
    { label: 'AI Tipper', href: '/tipper', icon: <Zap size={18} />, badge: 'NEW' },
    { label: 'Live Match', href: '/live/7232ab90-7de0-4ec0-a34f-13c33bf215a1', icon: <Radio size={18} />, badgeLive: true },
    { label: 'Bankroll', href: '/bankroll', icon: <Wallet size={18} /> },
    { label: 'Analytics', href: '/analytics', icon: <BarChart2 size={18} /> },
  ];

  const adminItems = [
    { label: 'Admin Console', href: '/admin', icon: <Settings size={18} /> },
    { label: 'User & Identity', href: '#', icon: <Users size={18} /> },
    { label: 'Operations', href: '#', icon: <Briefcase size={18} /> },
    { label: 'Tools', href: '#', icon: <Wrench size={18} /> },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="font-bold text-sm">CricketPulse</span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Main Nav */}
        <div className="text-[10px] font-bold text-gray-400 uppercase px-3 mb-2 tracking-wider">Platform</div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-[#4F46E5] rounded-lg text-sm font-medium transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="group-hover:text-[#4F46E5]">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            <div className="flex items-center gap-1">
              {item.badge && (
                <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[9px] font-bold rounded uppercase">
                  {item.badge}
                </span>
              )}
              {item.badgeLive && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
            </div>
          </Link>
        ))}

        {/* Admin Nav */}
        <div className="text-[10px] font-bold text-gray-400 uppercase px-3 mb-2 mt-6 tracking-wider">Admin</div>
        {adminItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-[#4F46E5] rounded-lg text-sm font-medium transition-colors group"
          >
            <span className="group-hover:text-[#4F46E5]">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
