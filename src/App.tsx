import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
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
import { Category, DailyLog, Level, AppState, DailyChallenge, SubItem } from './types';
import { INITIAL_STATE, LEVEL_XP, ACHIEVEMENTS } from './constants';
import { CategoryCard } from './components/CategoryCard';
import { LogsView } from './components/LogsView';
import { ExploreView } from './components/ExploreView';
import { SettingsView } from './components/SettingsView';
import { CalendarView } from './components/CalendarView';
import { generateWeeklySummary, parseNLPSetup, getDailyChallenges, getSubItemSuggestions, getSubItemGoals, getFunFacts } from './services/geminiService';
import { cn } from './lib/utils';
import { differenceInDays, startOfDay, isSameDay } from 'date-fns';

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
        rewards: parsed.rewards || { points: 0, unlockedItems: [] },
        dailyChallenges: parsed.dailyChallenges || {},
        funFacts: parsed.funFacts || {},
      };
    }
    return { ...INITIAL_STATE, dailyNotes: {} };
  });

  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState(0); // 0: closed, 1: title, 2: subitem selection, 3: ask to continue
  const [setupData, setSetupData] = useState<{ title: string; subItems: SubItem[] }>({ title: '', subItems: [] });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGeneratingGoals, setIsGeneratingGoals] = useState(false);
  const [nlpInput, setNlpInput] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingChallenges, setIsGeneratingChallenges] = useState(false);
  const [isGeneratingFunFacts, setIsGeneratingFunFacts] = useState(false);

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

  // Daily Challenges Generation
  useEffect(() => {
    if (!state.dailyChallenges[today] && state.categories.length > 0 && !isGeneratingChallenges) {
      const generate = async () => {
        setIsGeneratingChallenges(true);
        const challenges = await getDailyChallenges(state.logs, state.categories, state.dailyNotes);
        if (challenges.length > 0) {
          setState(prev => ({
            ...prev,
            dailyChallenges: { ...prev.dailyChallenges, [today]: challenges }
          }));
        }
        setIsGeneratingChallenges(false);
      };
      generate();
    }
  }, [state.categories, today]);

  // Fun Facts Generation
  useEffect(() => {
    if (!state.funFacts[today] && !isGeneratingFunFacts) {
      const generate = async () => {
        setIsGeneratingFunFacts(true);
        const facts = await getFunFacts();
        if (facts.length > 0) {
          setState(prev => ({
            ...prev,
            funFacts: { ...prev.funFacts, [today]: facts }
          }));
        }
        setIsGeneratingFunFacts(false);
      };
      generate();
    }
  }, [today]);

  const handleCompleteChallenge = (challengeId: string) => {
    setState(prev => {
      const challenges = prev.dailyChallenges[today] || [];
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge || challenge.completed) return prev;

      const newChallenges = challenges.map(c => 
        c.id === challengeId ? { ...c, completed: true } : c
      );

      return {
        ...prev,
        rewards: { ...prev.rewards, points: prev.rewards.points + challenge.points },
        dailyChallenges: { ...prev.dailyChallenges, [today]: newChallenges }
      };
    });
  };

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

  const handleLog = (catId: string, subId: string, level: Level, note?: string) => {
    if (!isEditable) {
      alert('只能補登或修改 7 日內的紀錄');
      return;
    }
    setState(prev => {
      const oldEntry = prev.logs[currentDateStr]?.[catId]?.[subId];
      
      let xpGained = LEVEL_XP[level];
      let pointsGained = LEVEL_XP[level];
      if (oldEntry) {
        xpGained -= LEVEL_XP[oldEntry.achieved];
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
              [subId]: { achieved: level, note }
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

      const xpLost = LEVEL_XP[oldEntry.achieved];
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
    const parsed = custom || (setupData.title ? setupData : parseNLPSetup(nlpInput));
    if (!parsed || !parsed.title) {
      alert('請輸入大項目名稱');
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
    setSetupStep(0);
    setSetupData({ title: '', subItems: [] });
  };

  const startSetup = () => {
    setIsSetupOpen(true);
    setSetupStep(1);
    setSetupData({ title: '', subItems: [] });
  };

  const nextSetupStep = async (subName: string) => {
    setIsGeneratingGoals(true);
    const goals = await getSubItemGoals(setupData.title, subName);
    setIsGeneratingGoals(false);

    const newSub: SubItem = {
      id: `sub_${Date.now()}`,
      name: subName,
      levels: goals
    };
    
    const updatedSubItems = [...setupData.subItems, newSub];
    setSetupData(prev => ({ ...prev, subItems: updatedSubItems }));
    setSetupStep(3); // Go to "Ask to continue"
  };

  const prepareNextSubItem = async () => {
    setSetupStep(2);
    setIsSuggesting(true);
    const suggestions = await getSubItemSuggestions(setupData.title, setupData.subItems.map(s => s.name));
    setAiSuggestions(suggestions);
    setIsSuggesting(false);
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
        return (
          <ExploreView 
            onImport={(cats) => cats.forEach(c => handleAddCategory(c))} 
            profile={state.profile} 
            rewards={state.rewards} 
            dailyChallenges={state.dailyChallenges[today] || []}
            onCompleteChallenge={handleCompleteChallenge}
          />
        );
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
                    className="mt-3 p-6 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900 text-lg leading-relaxed italic font-['Microsoft_JhengHei','PingFang_TC','Heiti_TC',sans-serif]"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold uppercase text-xs tracking-widest text-indigo-400">Coach Gemini</span>
                      <button onClick={() => setAiSummary(null)} className="text-indigo-300 hover:text-indigo-500">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="whitespace-pre-line">
                      {aiSummary}
                    </div>
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
                  onLog={(subId, level, note) => handleLog(cat.id, subId, level, note)}
                  onResetLog={(subId) => handleResetLog(cat.id, subId)}
                  onDelete={() => handleDeleteCategory(cat.id)}
                  onEdit={handleEditCategory}
                  isEditable={isEditable}
                />
              ))}
              
              {state.categories.length < 6 && (
                <button 
                  onClick={startSetup}
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
            <h1 className="font-black text-xl tracking-tight text-slate-800">一起轉大人</h1>
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
                <h2 className="text-2xl font-black text-slate-800">
                  {setupStep === 1 ? '設定大項目' : `子項目 ${setupStep - 1}`}
                </h2>
                <button onClick={() => setIsSetupOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {setupStep === 1 ? (
                  <div className="space-y-4">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">請輸入大項目名稱</label>
                    <input 
                      type="text"
                      value={setupData.title}
                      onChange={(e) => setSetupData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="例如：健身、學習、社交..."
                      className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-emerald-500 focus:bg-white transition-all outline-none text-slate-700 font-bold text-lg"
                    />
                    <button 
                      onClick={prepareNextSubItem}
                      className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200"
                    >
                      下一步
                    </button>
                  </div>
                ) : setupStep === 2 ? (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl w-fit">
                      <Sparkles size={14} />
                      <span className="text-[10px] font-bold uppercase">AI 智慧建議子項目</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      {isSuggesting || isGeneratingGoals ? (
                        [1, 2, 3].map(i => (
                          <div key={i} className="h-14 bg-slate-50 animate-pulse rounded-2xl" />
                        ))
                      ) : (
                        aiSuggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => nextSetupStep(suggestion)}
                            className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-left font-bold text-slate-700 hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                          >
                            {suggestion}
                          </button>
                        ))
                      )}
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-300 font-bold">或</span></div>
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="手動輸入子項目..."
                        className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-emerald-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            nextSetupStep(e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 text-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">已新增子項目！</h3>
                    <p className="text-slate-500 text-sm">AI 已為您自動訂定 Mini/Advanced/Elite 目標，您之後可以隨時修改。</p>
                    
                    <div className="flex flex-col gap-3 pt-4">
                      <button 
                        onClick={prepareNextSubItem}
                        className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200"
                      >
                        繼續新增子項目
                      </button>
                      <button 
                        onClick={() => handleAddCategory()}
                        className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl"
                      >
                        完成設定
                      </button>
                    </div>
                  </div>
                )}
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
