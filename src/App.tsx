import React, { useState, useEffect, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Flame, 
  Plus, 
  Settings, 
  Share2, 
  Sparkles,
  ChevronLeft,
  X,
  Compass,
  BookOpen,
  LayoutDashboard,
  Cloud,
  Zap,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Category, DailyLog, Level, AppState } from './types';
import { INITIAL_STATE, LEVEL_XP, ACHIEVEMENTS } from './constants';
import { CategoryCard } from './components/CategoryCard';
import { LogsView } from './components/LogsView';
import { ExploreView } from './components/ExploreView';
import { SettingsView } from './components/SettingsView';
import { CalendarView } from './components/CalendarView';
import { generateWeeklySummary, parseNLPSetup } from './services/geminiService';
import { cn } from './lib/utils';
import { differenceInDays, startOfDay } from 'date-fns';

type Tab = 'dashboard' | 'explore' | 'logs' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [user, setUser] = useState<any>(null);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('flex_progress_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_STATE,
        ...parsed,
        profile: {
          ...INITIAL_STATE.profile,
          ...parsed.profile,
          achievements: parsed.profile?.achievements || []
        },
        dailyNotes: parsed.dailyNotes || {},
        rewards: parsed.rewards || { points: 0, unlockedItems: [] }
      };
    }
    return { ...INITIAL_STATE, dailyNotes: {} };
  });

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [nlpInput, setNlpInput] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const currentDateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayLogs = useMemo(() => state.logs[currentDateStr] || {}, [state.logs, currentDateStr]);

  const isEditable = useMemo(() => {
    const diff = differenceInDays(startOfDay(new Date()), startOfDay(selectedDate));
    return diff >= 0 && diff <= 7;
  }, [selectedDate]);

  // Auth & Sync
  useEffect(() => {
    fetch('/api/me').then(res => res.json()).then(data => setUser(data));
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetch('/api/me').then(res => res.json()).then(data => {
          setUser(data);
          syncFromCloud();
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const syncFromCloud = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const cloudState = await res.json();
        if (cloudState) setState(cloudState);
      }
    } catch (e) {
      console.error('Sync error', e);
    }
  };

  const syncToCloud = async (newState: AppState) => {
    if (!user) return;
    try {
      await fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState)
      });
    } catch (e) {
      console.error('Sync error', e);
    }
  };

  useEffect(() => {
    localStorage.setItem('flex_progress_state', JSON.stringify(state));
    syncToCloud(state);
  }, [state, user]);

  const checkAchievements = (newState: AppState) => {
    const unlockedIds = new Set(newState.profile.achievements.map(a => a.id));
    const newAchievements = [...newState.profile.achievements];
    let pointsGained = 0;

    ACHIEVEMENTS.forEach(ach => {
      if (unlockedIds.has(ach.id)) return;

      let unlocked = false;
      if (ach.id === 'first_step' && Object.keys(newState.logs).length > 0) unlocked = true;
      if (ach.id === 'streak_3' && newState.profile.streak >= 3) unlocked = true;
      if (ach.id === 'streak_7' && newState.profile.streak >= 7) unlocked = true;
      if (ach.id === 'level_5' && newState.profile.level >= 5) unlocked = true;
      
      if (ach.id === 'elite_master') {
        const todayLogs = newState.logs[today] || {};
        let eliteCount = 0;
        Object.values(todayLogs).forEach(cat => {
          Object.values(cat).forEach(sub => {
            if (sub.achieved === 'elite') eliteCount++;
          });
        });
        if (eliteCount >= 3) unlocked = true;
      }

      if (ach.id === 'balance_master') {
        const todayLogs = newState.logs[today] || {};
        const activeCats = Object.keys(todayLogs).length;
        if (activeCats === newState.categories.length && activeCats > 0) unlocked = true;
      }

      if (unlocked) {
        newAchievements.push({ ...ach, unlockedAt: new Date().toISOString() });
        pointsGained += 50; // Each achievement gives 50 points
      }
    });

    if (pointsGained > 0) {
      return {
        ...newState,
        profile: { ...newState.profile, achievements: newAchievements },
        rewards: { ...newState.rewards, points: newState.rewards.points + pointsGained }
      };
    }
    return newState;
  };

  const handleLog = (catId: string, subId: string, level: Level, score: number, note?: string) => {
    if (!isEditable) {
      alert('只能補登或修改 7 日內的紀錄');
      return;
    }
    setState(prev => {
      const oldEntry = prev.logs[currentDateStr]?.[catId]?.[subId];
      
      let xpGained = LEVEL_XP[level] * score;
      let pointsGained = LEVEL_XP[level];
      if (oldEntry) {
        xpGained -= LEVEL_XP[oldEntry.achieved] * oldEntry.score;
        pointsGained -= LEVEL_XP[oldEntry.achieved];
      }

      const newTotalXp = Math.max(0, prev.profile.totalXp + xpGained);
      const newLevel = Math.floor(newTotalXp / 100) + 1;
      const newStreak = prev.profile.streak + (prev.logs[currentDateStr] ? 0 : 1);
      const newPoints = Math.max(0, prev.rewards.points + pointsGained);

      const nextState = {
        ...prev,
        profile: { ...prev.profile, totalXp: newTotalXp, level: newLevel, streak: newStreak },
        rewards: { ...prev.rewards, points: newPoints },
        logs: {
          ...prev.logs,
          [currentDateStr]: {
            ...(prev.logs[currentDateStr] || {}),
            [catId]: {
              ...(prev.logs[currentDateStr]?.[catId] || {}),
              [subId]: { achieved: level, score, note }
            }
          }
        }
      };

      return checkAchievements(nextState);
    });
  };

  const handleResetLog = (catId: string, subId: string) => {
    if (!isEditable) {
      alert('只能修改 7 日內的紀錄');
      return;
    }
    setState(prev => {
      const dayLogs = prev.logs[currentDateStr];
      if (!dayLogs || !dayLogs[catId] || !dayLogs[catId][subId]) return prev;

      const oldEntry = dayLogs[catId][subId];
      
      const newCatLogs = { ...dayLogs[catId] };
      delete newCatLogs[subId];

      const newDayLogs = { ...dayLogs };
      if (Object.keys(newCatLogs).length === 0) {
        delete newDayLogs[catId];
      } else {
        newDayLogs[catId] = newCatLogs;
      }

      const newLogs = { ...prev.logs };
      if (Object.keys(newDayLogs).length === 0) {
        delete newLogs[currentDateStr];
      } else {
        newLogs[currentDateStr] = newDayLogs;
      }

      const xpLost = LEVEL_XP[oldEntry.achieved] * oldEntry.score;
      const pointsLost = LEVEL_XP[oldEntry.achieved];
      const newTotalXp = Math.max(0, prev.profile.totalXp - xpLost);
      const newLevel = Math.floor(newTotalXp / 100) + 1;
      const newPoints = Math.max(0, prev.rewards.points - pointsLost);

      return {
        ...prev,
        profile: { ...prev.profile, totalXp: newTotalXp, level: newLevel },
        rewards: { ...prev.rewards, points: newPoints },
        logs: newLogs
      };
    });
  };

  const handleUpdateDailyNote = (date: string, note: string) => {
    setState(prev => ({
      ...prev,
      dailyNotes: {
        ...(prev.dailyNotes || {}),
        [date]: note
      }
    }));
  };

  const handleAddCategory = (custom?: Partial<Category>) => {
    const parsed = custom || parseNLPSetup(nlpInput);
    if (!parsed) {
      alert('請使用格式：類別：項目1, 項目2, 項目3');
      return;
    }
    if (state.categories.length >= 6) {
      alert('最多只能設定 6 個大項目');
      return;
    }

    setState(prev => ({
      ...prev,
      categories: [...prev.categories, { ...parsed, id: `cat_${Date.now()}` } as Category]
    }));
    setNlpInput('');
    setIsSetupOpen(false);
  };

  const handleDeleteCategory = (id: string) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c.id !== id)
    }));
  };

  const handleEditCategory = (updated: Category) => {
    setState(prev => ({
      ...prev,
      categories: prev.categories.map(c => c.id === updated.id ? updated : c)
    }));
  };

  const handleLogin = async () => {
    const res = await fetch('/api/auth/url');
    const { url } = await res.json();
    window.open(url, 'google_login', 'width=600,height=700');
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'explore':
        return <ExploreView onImport={(cats) => cats.forEach(c => handleAddCategory(c))} profile={state.profile} rewards={state.rewards} />;
      case 'logs':
        return <LogsView state={state} onUpdateNote={handleUpdateDailyNote} />;
      case 'settings':
        return <SettingsView profile={state.profile} user={user} onLogin={handleLogin} onLogout={handleLogout} />;
      default:
        return (
          <div className="space-y-6">
            {/* Calendar Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-500 text-xs uppercase tracking-widest">成長月曆</h2>
                {!isSameDay(selectedDate, new Date()) && (
                  <button 
                    onClick={() => setSelectedDate(new Date())}
                    className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full uppercase"
                  >
                    回到今天
                  </button>
                )}
              </div>
              <CalendarView 
                logs={state.logs} 
                selectedDate={selectedDate} 
                onDateSelect={(d) => setSelectedDate(d)} 
              />
              {!isEditable && (
                <p className="mt-2 text-[10px] text-red-400 text-center font-bold">⚠️ 只能編輯 7 日內的紀錄</p>
              )}
            </section>

            {/* AI Summary Section */}
            <section>
              <button 
                onClick={async () => {
                  setIsSummarizing(true);
                  const summary = await generateWeeklySummary(state.logs, state.categories);
                  setAiSummary(summary);
                  setIsSummarizing(false);
                }}
                disabled={isSummarizing}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-between group overflow-hidden relative"
              >
                <div className="flex items-center gap-3 z-10">
                  <Sparkles size={18} className={cn(isSummarizing && "animate-spin")} />
                  <span className="font-bold text-sm">AI 週日誌摘要</span>
                </div>
                <ChevronLeft size={18} className="rotate-180 z-10" />
                <motion.div 
                  className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.1 }}
                />
              </button>
              
              <AnimatePresence>
                {aiSummary && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 p-5 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-sm leading-relaxed italic"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold uppercase text-[10px] tracking-widest text-indigo-400">Coach Gemini</span>
                      <button onClick={() => setAiSummary(null)} className="text-indigo-300 hover:text-indigo-500">
                        <X size={14} />
                      </button>
                    </div>
                    {aiSummary}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            {/* Categories List */}
            <section className="pb-8">
              <h2 className="font-bold text-slate-500 text-xs uppercase tracking-widest mb-4">核心習慣 (6-3-3)</h2>
              {state.categories.map(cat => (
                <CategoryCard 
                  key={cat.id} 
                  category={cat} 
                  logs={todayLogs} 
                  onLog={(subId, level, score, note) => handleLog(cat.id, subId, level, score, note)}
                  onResetLog={(subId) => handleResetLog(cat.id, subId)}
                  onDelete={() => handleDeleteCategory(cat.id)}
                  onEdit={handleEditCategory}
                  isEditable={isEditable}
                />
              ))}
              
              {state.categories.length < 6 && (
                <button 
                  onClick={() => setIsSetupOpen(true)}
                  className="w-full py-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 flex flex-col items-center gap-2 hover:border-emerald-300 hover:text-emerald-500 transition-all"
                >
                  <Plus size={24} />
                  <span className="font-bold text-sm">新增大項目</span>
                </button>
              )}
            </section>
          </div>
        );
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 relative">
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-bg/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Trophy size={20} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-slate-800">FLEX PROGRESS</h1>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">LV.{state.profile.level}</span>
              <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400" style={{ width: `${state.profile.totalXp % 100}%` }} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full font-bold text-sm">
            <Zap size={16} fill="currentColor" />
            {state.rewards.points}
          </div>
          <div className="flex items-center gap-1 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-full font-bold text-sm">
            <Flame size={16} fill="currentColor" />
            {state.profile.streak}
          </div>
          {user && (
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200">
              <Cloud size={14} />
            </div>
          )}
        </div>
      </header>

      <main className="px-6">
        {renderContent()}
      </main>

      {/* Setup Modal */}
      <AnimatePresence>
        {isSetupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-slate-800">智慧設定</h2>
                <button onClick={() => setIsSetupOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">NLP 快速建立</label>
                  <textarea 
                    value={nlpInput}
                    onChange={(e) => setNlpInput(e.target.value)}
                    placeholder="例如：健身：跑步, 懸吊, 波比"
                    className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-emerald-500 focus:bg-white transition-all outline-none text-slate-700 font-medium h-32 resize-none"
                  />
                  <p className="mt-2 text-[10px] text-slate-400 italic">格式：類別：項目1, 項目2, 項目3</p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleAddCategory()}
                    className="flex-1 py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors"
                  >
                    建立結構
                  </button>
                  <button 
                    onClick={() => {
                      const shareUrl = `${window.location.origin}?template=${btoa(JSON.stringify(state.categories))}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert('模板連結已複製！');
                    }}
                    className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-8 z-40">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'dashboard' ? "text-emerald-500" : "text-slate-300")}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold uppercase">儀表板</span>
        </button>
        <button 
          onClick={() => setActiveTab('explore')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'explore' ? "text-emerald-500" : "text-slate-300")}
        >
          <Compass size={24} />
          <span className="text-[10px] font-bold uppercase">探索</span>
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'logs' ? "text-emerald-500" : "text-slate-300")}
        >
          <BookOpen size={24} />
          <span className="text-[10px] font-bold uppercase">日誌</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'settings' ? "text-emerald-500" : "text-slate-300")}
        >
          <Settings size={24} />
          <span className="text-[10px] font-bold uppercase">設定</span>
        </button>
      </nav>
    </div>
  );
}
