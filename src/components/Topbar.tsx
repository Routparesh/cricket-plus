import React from 'react';
import { Search, ChevronDown } from 'lucide-react';
import Image from 'next/image';

export default function Topbar() {
  return (
    <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      
      <div className="flex items-center gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search" 
            className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
        
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
             {/* Using a placeholder since we don't have an image asset */}
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600">WW</div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Walter White</span>
            <span className="text-xs text-gray-500">Heisenberg35@mail.com</span>
          </div>
          <ChevronDown size={16} className="text-gray-400 ml-1" />
        </div>
      </div>
    </div>
  );
}
