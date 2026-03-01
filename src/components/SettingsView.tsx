import React from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, LogOut, User, Cloud, Shield, Bell } from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsViewProps {
  profile: UserProfile;
  user: any;
  onLogin: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ profile, user, onLogin, onLogout }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <SettingsIcon className="text-emerald-500" size={20} />
        <h2 className="text-xl font-black text-slate-800">設定</h2>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 text-center">
        <div className="w-24 h-24 rounded-[32px] bg-emerald-50 mx-auto mb-4 flex items-center justify-center text-emerald-500">
          <User size={48} />
        </div>
        <h3 className="text-2xl font-black text-slate-800">{user?.display_name || profile.name}</h3>
        <p className="text-slate-400 text-sm mb-6">{user?.email || '尚未登入雲端帳號'}</p>
        
        {!user ? (
          <button 
            onClick={onLogin}
            className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <Cloud size={18} />
            登入 Google 同步數據
          </button>
        ) : (
          <button 
            onClick={onLogout}
            className="w-full py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            登出帳號
          </button>
        )}
      </div>

      {/* Settings Options */}
      <div className="space-y-3">
        <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Bell size={20} />
            </div>
            <span className="font-bold text-slate-700">每日提醒</span>
          </div>
          <div className="w-12 h-6 bg-slate-200 rounded-full relative">
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <span className="font-bold text-slate-700">隱私設定</span>
          </div>
          <ExternalLink size={18} className="text-slate-300" />
        </div>
      </div>

      <div className="text-center py-8">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Flex Progress v1.0.0</p>
      </div>
    </div>
  );
};

function ExternalLink({ className, size }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
