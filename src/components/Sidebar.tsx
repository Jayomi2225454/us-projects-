import React from 'react';
import { User, ShieldCheck, Trash2, LayoutDashboard, LogOut } from 'lucide-react';
import { ViewType } from '../types';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  isRestricted?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isRestricted }) => {
  const items = [
    { id: 'citizen' as ViewType, label: 'Citizen', icon: User },
    { id: 'cleaner' as ViewType, label: 'Cleaner', icon: Trash2 },
    { id: 'admin' as ViewType, label: 'Admin', icon: ShieldCheck },
  ];

  const handleLogout = () => {
    signOut(auth);
  };

  return (
    <div className="w-64 bg-[#000080] text-white h-screen flex flex-col p-4 shadow-xl">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-white p-2 rounded-lg">
          <LayoutDashboard className="text-[#000080]" size={24} />
        </div>
        <h1 className="font-bold text-xl tracking-tight">SafaiSetu</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {items.filter(item => !isRestricted || currentView === item.id).map((item) => {
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => !isRestricted && onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-white text-[#000080] shadow-lg" 
                  : "hover:bg-white/10 text-white/70 hover:text-white"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-[#000080]" : "group-hover:scale-110 transition-transform"} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-100 transition-all font-medium"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
        
        <div className="flex items-center gap-2 px-2 py-4 bg-white/5 rounded-xl">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            currentView === 'admin' ? 'bg-[#000080] text-white' : 
            currentView === 'cleaner' ? 'bg-[#138808] text-white' : 
            'bg-[#FF9933] text-white'
          }`}>
            {currentView[0].toUpperCase()}
          </div>
          <div className="text-xs">
            <p className="font-semibold capitalize">{currentView} Account</p>
            <p className="opacity-50 text-[10px]">SafaiSetu Verified</p>
          </div>
        </div>
      </div>
    </div>
  );
};
