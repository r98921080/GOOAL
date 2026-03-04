import React from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, LogOut, User, Cloud, Shield, Bell, Music, RefreshCw, EyeOff } from 'lucide-react';
import { UserProfile, AppSettings } from '../types';

interface SettingsViewProps {
  profile: UserProfile;
  user: any;
  settings: AppSettings;
  onLogin: () => void;
  onLogout: () => void;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onRefreshMusic: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ 
  profile, 
  user, 
  settings, 
  onLogin, 
  onLogout, 
  onUpdateSettings,
  onRefreshMusic
}) => {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-2 mb-4">
        <SettingsIcon className="text-emerald-500" size={20} />
        <h2 className="text-xl font-black text-slate-800">設定</h2>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 text-center">
        <div className="w-24 h-24 rounded-[32px] bg-emerald-50 mx-auto mb-4 flex items-center justify-center text-emerald-500">
          {user ? (
            <img 
              src={`https://ui-avatars.com/api/?name=${user.display_name}&background=random`} 
              className="w-full h-full rounded-[32px] object-cover"
            />
          ) : (
            <User size={48} />
          )}
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

      {/* Music Settings */}
      <section>
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">AI 音樂與氛圍</h4>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Music size={20} />
              </div>
              <div>
                <span className="font-bold text-slate-700 block text-sm">背景音樂</span>
                <span className="text-[10px] text-slate-400">依據 AI 評估自動挑選</span>
              </div>
            </div>
            <button 
              onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                settings.musicEnabled ? "bg-emerald-500" : "bg-slate-200"
              )}
            >
              <motion.div 
                animate={{ x: settings.musicEnabled ? 24 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
              />
            </button>
          </div>

          {settings.musicEnabled && (
            <div className="space-y-4 pt-4 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">音樂風格</span>
                <select 
                  value={settings.musicTheme}
                  onChange={(e) => onUpdateSettings({ musicTheme: e.target.value as any })}
                  className="text-xs font-bold bg-slate-50 border-none rounded-lg p-2 outline-none"
                >
                  <option value="focus">專注 (Focus)</option>
                  <option value="relax">放鬆 (Relax)</option>
                  <option value="energy">活力 (Energy)</option>
                  <option value="ambient">氛圍 (Ambient)</option>
                </select>
              </div>
              <button 
                onClick={onRefreshMusic}
                className="w-full py-3 bg-slate-50 text-slate-500 text-xs font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-100"
              >
                <RefreshCw size={14} />
                更換音樂
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Advanced Settings */}
      <section>
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 ml-2">進階選項</h4>
        <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-50">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <span className="font-bold text-slate-700 text-sm">每日推送提醒</span>
            </div>
            <button 
              onClick={() => onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                settings.notificationsEnabled ? "bg-emerald-500" : "bg-slate-200"
              )}
            >
              <motion.div 
                animate={{ x: settings.notificationsEnabled ? 24 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
              />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                <EyeOff size={20} />
              </div>
              <span className="font-bold text-slate-700 text-sm">隱私保護模式</span>
            </div>
            <button 
              onClick={() => onUpdateSettings({ privacyMode: !settings.privacyMode })}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                settings.privacyMode ? "bg-emerald-500" : "bg-slate-200"
              )}
            >
              <motion.div 
                animate={{ x: settings.privacyMode ? 24 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
              />
            </button>
          </div>

          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
                <Shield size={20} />
              </div>
              <span className="font-bold text-slate-700 text-sm">數據安全與備份</span>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>
        </div>
      </section>

      <div className="text-center py-8">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Flex Progress v1.1.0</p>
      </div>
    </div>
  );
};

function ChevronRight({ className, size }: { className?: string, size?: number }) {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
