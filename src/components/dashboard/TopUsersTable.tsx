import React from 'react';
import { User, MoreHorizontal } from 'lucide-react';

const users = [
  { id: 1, name: 'Michael', mobile: '+91987654327', deposit: '₹1,800.00', winning: '₹700.00', winPercent: '38.89%', commission: '₹120.00' },
  { id: 2, name: 'Alice', mobile: '+91987654322', deposit: '₹2,000.00', winning: '₹800.00', winPercent: '40.00%', commission: '₹150.00' },
  { id: 3, name: 'Bob', mobile: '+91987654323', deposit: '₹1,200.00', winning: '₹400.00', winPercent: '33.33%', commission: '₹75.00' },
  { id: 4, name: 'Sarah', mobile: '+91987654324', deposit: '₹2,500.00', winning: '₹1,200.00', winPercent: '48.00%', commission: '₹200.00' },
  { id: 5, name: 'David', mobile: '+91987654325', deposit: '₹1,000.00', winning: '₹250.00', winPercent: '25.00%', commission: '₹50.00' },
];

export default function TopUsersTable() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm mt-6">
      <div className="p-5 flex justify-between items-center border-b border-gray-50">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <User size={16} />
          <span>Top User on the App</span>
        </div>
        <button className="flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-100">
          Sort By Newest
          <MoreHorizontal size={14} />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 font-medium">Sr. No.</th>
              <th className="px-6 py-4 font-medium">User Name</th>
              <th className="px-6 py-4 font-medium">Mobile Number</th>
              <th className="px-6 py-4 font-medium text-right">Total Deposit</th>
              <th className="px-6 py-4 font-medium text-right">Total Winning</th>
              <th className="px-6 py-4 font-medium text-center">Winning %</th>
              <th className="px-6 py-4 font-medium text-right">Commission Earned</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-4 text-gray-500">{user.id}</td>
                <td className="px-6 py-4 font-medium">{user.name}</td>
                <td className="px-6 py-4 text-gray-500">{user.mobile}</td>
                <td className="px-6 py-4 text-right">{user.deposit}</td>
                <td className="px-6 py-4 text-right">{user.winning}</td>
                <td className="px-6 py-4 text-center">{user.winPercent}</td>
                <td className="px-6 py-4 text-right">{user.commission}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
