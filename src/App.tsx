import React, { useState, useEffect, useMemo } from 'react';
import { format, subDays, differenceInDays, startOfDay, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Plus, Settings, Share2, Sparkles, ChevronLeft, X, Compass, BookOpen, LayoutDashboard, Cloud, Zap, Calendar as CalendarIcon, Flower2, Sprout, TreeDeciduous, Info } from 'lucide-react';
import { Category, DailyLog, Level, AppState, DailyChallenge, SubItem, ExploreAnalysis, AppSettings } from './types';
import { INITIAL_STATE, LEVEL_XP, THEME_COLORS } from './constants';
import { CategoryCard } from './components/CategoryCard';
import { LogsView } from './components/LogsView';
import { ExploreView } from './components/ExploreView';
import { SettingsView } from './components/SettingsView';
import { CalendarView } from './components/CalendarView';
import { MusicPlayer } from './components/MusicPlayer';
import { generateWeeklySummary, parseNLPSetup, getDailyChallenges, getSubItemSuggestions, getSubItemGoals, getFunFacts, analyzeJournal, generateDailyAnalysis, pickMusic, generateNoteTitle } from './services/geminiService';
import { cn } from './lib/utils';

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
        },
        dailyNotes: parsed.dailyNotes || {},
        noteTitles: parsed.noteTitles || {},
        userNoteTitles: parsed.userNoteTitles || {},
        rewards: parsed.rewards || { points: 0, unlockedItems: [], gardenProgress: 0 },
        dailyChallenges: parsed.dailyChallenges || {},
        funFacts: parsed.funFacts || {},
        todos: parsed.todos || [],
        dailyAnalyses: parsed.dailyAnalyses || {},
        settings: {
          ...INITIAL_STATE.settings,
          ...parsed.settings
        }
      };
    }
    return { ...INITIAL_STATE, dailyNotes: {}, userNoteTitles: {} };
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
  const [isLevelInfoOpen, setIsLevelInfoOpen] = useState(false);
  const [isGardenInfoOpen, setIsGardenInfoOpen] = useState(false);

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
      // More permissive origin check for development
      const isAllowedOrigin = 
        event.origin.endsWith('.run.app') || 
        event.origin.includes('localhost') || 
        event.origin === window.location.origin;

      if (!isAllowedOrigin) return;
      
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

  // Weekly Music Update (Sunday)
  useEffect(() => {
    const now = new Date();
    const isSunday = now.getDay() === 0;
    const lastUpdate = new Date(state.settings.lastMusicUpdate);
    const diffDays = differenceInDays(now, lastUpdate);

    if (isSunday && diffDays >= 7) {
      handleRefreshMusic();
    }
  }, []);

  const handleRefreshMusic = async () => {
    const music = await pickMusic(state.settings.musicTheme);
    setState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        currentMusicUrl: music.url,
        lastMusicUpdate: new Date().toISOString()
      }
    }));
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const handleUpdateAnalysis = (analysis: ExploreAnalysis) => {
    setState(prev => ({ ...prev, exploreAnalysis: analysis }));
  };

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
        const existingFacts = Object.values(state.funFacts).flat().map(f => f.content);
        const facts = await getFunFacts(existingFacts);
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

  // Midnight Analysis Generation
  useEffect(() => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    if (!state.dailyAnalyses[yesterday] && state.dailyNotes[yesterday]) {
      const generate = async () => {
        const analysis = await generateDailyAnalysis(state.logs[yesterday] || {}, state.dailyNotes[yesterday]);
        if (analysis.summary || analysis.mindMap) {
          setState(prev => ({
            ...prev,
            dailyAnalyses: { ...prev.dailyAnalyses, [yesterday]: analysis }
          }));
        }
      };
      generate();
    }
  }, [today]);

  const handleCompleteChallenge = (challengeId: string) => {
    setState(prev => {
      const challenges = prev.dailyChallenges[today] || [];
      const challenge = challenges.find(c => c.id === challengeId);
      if (!challenge) return prev;

      const isCompleting = !challenge.completed;
      const newChallenges = challenges.map(c => 
        c.id === challengeId ? { ...c, completed: isCompleting } : c
      );

      return {
        ...prev,
        rewards: { 
          ...prev.rewards, 
          points: isCompleting ? prev.rewards.points + challenge.points : prev.rewards.points - challenge.points 
        },
        dailyChallenges: { ...prev.dailyChallenges, [today]: newChallenges }
      };
    });
  };

  const handleRemoveTodo = (todoId: string) => {
    setState(prev => ({
      ...prev,
      todos: prev.todos.filter(t => t.id !== todoId)
    }));
  };

  const handleAnalyzeJournal = async (date: string) => {
    const note = state.dailyNotes[date];
    if (!note) return;

    const analysis = await analyzeJournal(note);
    
    // Add new todos
    if (analysis.todos.length > 0) {
      const newTodos = analysis.todos.map(text => ({
        id: `todo_${Math.random().toString(36).substr(2, 9)}`,
        text
      }));
      setState(prev => ({
        ...prev,
        todos: [...prev.todos, ...newTodos]
      }));
    }

    return analysis.calendarEvents;
  };

  const handleCreateCalendarEvent = async (event: any) => {
    try {
      const response = await fetch('/api/calendar/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
      if (!response.ok) throw new Error('Failed to create event');
      return true;
    } catch (e) {
      console.error('Calendar error', e);
      return false;
    }
  };

  const handleLogin = async () => {
    // Open popup immediately to avoid blocker
    const popup = window.open('about:blank', 'google_auth', 'width=600,height=700');
    
    if (!popup) {
      alert('請允許彈出視窗以進行登入。');
      return;
    }

    try {
      const res = await fetch('/api/auth/url');
      const { url } = await res.json();
      popup.location.href = url;
    } catch (e) {
      console.error('Login error', e);
      popup.close();
      alert('登入失敗，請稍後再試。');
    }
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

      // Combo Bonus: If multiple habits logged today
      const todayLogs = prev.logs[currentDateStr] || {};
      let habitsLoggedToday = 0;
      Object.values(todayLogs).forEach(cat => {
        habitsLoggedToday += Object.keys(cat).length;
      });
      const comboBonus = habitsLoggedToday >= 3 ? 1.5 : 1.0;

      // Streak Bonus: 10% extra for every 7 days streak (max 50%)
      const streakBonus = 1 + Math.min(0.5, Math.floor(prev.profile.streak / 7) * 0.1);

      const totalXpGained = Math.round(xpGained * comboBonus * streakBonus);
      const totalPointsGained = Math.round(pointsGained * 2 * comboBonus * streakBonus);

      const newTotalXp = Math.max(0, prev.profile.totalXp + totalXpGained);
      const newLevel = Math.floor(newTotalXp / 100) + 1;
      const newStreak = prev.profile.streak + (prev.logs[currentDateStr] ? 0 : 1);
      const newPoints = Math.max(0, prev.rewards.points + totalPointsGained);
      let newGardenProgress = prev.rewards.gardenProgress + (xpGained * 5); 
      let bonusPoints = 0;

      if (newGardenProgress >= 100) {
        newGardenProgress = 0;
        bonusPoints = 500; 
      }

      return {
        ...prev,
        profile: { ...prev.profile, totalXp: newTotalXp, level: newLevel, streak: newStreak },
        rewards: { 
          ...prev.rewards, 
          points: newPoints + bonusPoints, 
          gardenProgress: newGardenProgress 
        },
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

  const handleUpdateDailyNote = async (date: string, note: string) => {
    setState(prev => ({
      ...prev,
      dailyNotes: {
        ...(prev.dailyNotes || {}),
        [date]: note
      }
    }));

    // Auto-generate title every time it's saved if note is not empty
    if (note.trim()) {
      const title = await generateNoteTitle(note);
      setState(prev => ({
        ...prev,
        noteTitles: {
          ...(prev.noteTitles || {}),
          [date]: title
        }
      }));
    }
  };
  
  const handleUpdateUserNoteTitle = (date: string, title: string) => {
    setState(prev => ({
      ...prev,
      userNoteTitles: {
        ...(prev.userNoteTitles || {}),
        [date]: title
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

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'explore':
        return (
          <ExploreView 
            state={state}
            onUpdateAnalysis={handleUpdateAnalysis}
            dailyChallenges={state.dailyChallenges[today] || []}
            onCompleteChallenge={handleCompleteChallenge}
          />
        );
      case 'logs':
        return (
          <LogsView 
            state={state} 
            onUpdateNote={handleUpdateDailyNote}
            onUpdateUserNoteTitle={handleUpdateUserNoteTitle}
            onAnalyzeJournal={handleAnalyzeJournal}
            onRemoveTodo={handleRemoveTodo}
            onCreateCalendarEvent={handleCreateCalendarEvent}
          />
        );
      case 'settings':
        return (
          <SettingsView 
            profile={state.profile} 
            user={user} 
            settings={state.settings}
            onLogin={handleLogin} 
            onLogout={handleLogout} 
            onUpdateSettings={handleUpdateSettings}
            onRefreshMusic={handleRefreshMusic}
          />
        );
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

            {/* AI Summary Section */}
            <section className="pb-4">
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

            {/* Garden Section - Moved to bottom */}
            <section className="bg-white/40 backdrop-blur-sm rounded-[40px] p-6 border border-white/20 shadow-xl overflow-hidden relative mb-12">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <Sprout size={18} className="text-emerald-500" />
                    成長花園
                    <button 
                      onClick={() => setIsGardenInfoOpen(true)}
                      className="p-1 text-slate-300 hover:text-emerald-500 transition-colors"
                    >
                      <Info size={14} />
                    </button>
                  </h2>
                  <div className="flex gap-2">
                    {state.profile.streak >= 3 && (
                      <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-1 rounded-full uppercase flex items-center gap-1">
                        <Flame size={10} /> 狂熱加成
                      </span>
                    )}
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full uppercase">
                      {state.rewards.gardenProgress < 30 ? '發芽中' : state.rewards.gardenProgress < 70 ? '茁壯中' : '繁花盛開'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-end justify-around h-24 mb-4">
                  <motion.div 
                    animate={{ 
                      scale: state.rewards.gardenProgress > 10 ? 1 : 0,
                      rotate: state.rewards.gardenProgress > 10 ? [0, 5, -5, 0] : 0
                    }}
                    transition={{ repeat: Infinity, duration: 5 }}
                    className="text-emerald-400"
                  >
                    <Sprout size={24} />
                  </motion.div>
                  <motion.div 
                    animate={{ 
                      scale: state.rewards.gardenProgress > 40 ? 1.2 : 0,
                      y: state.rewards.gardenProgress > 40 ? [0, -5, 0] : 0
                    }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="text-teal-500"
                  >
                    <TreeDeciduous size={32} />
                  </motion.div>
                  <motion.div 
                    animate={{ 
                      scale: state.rewards.gardenProgress > 80 ? 1.5 : 0,
                      rotate: state.rewards.gardenProgress > 80 ? [0, 10, -10, 0] : 0,
                      filter: state.rewards.gardenProgress > 80 ? 'drop-shadow(0 0 8px rgba(236, 72, 153, 0.4))' : 'none'
                    }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="text-pink-500"
                  >
                    <Flower2 size={40} />
                  </motion.div>
                </div>

                <div className="w-full h-2 bg-slate-200/50 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${state.rewards.gardenProgress}%` }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-[10px] text-slate-500 font-bold">
                    打卡灌溉進度 {state.rewards.gardenProgress}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold italic">
                    滿 100% 可獲得 500 點獎勵
                  </p>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full" />
              {state.profile.streak >= 7 && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: -20, x: Math.random() * 300, opacity: 0 }}
                      animate={{ y: 300, opacity: [0, 1, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: i * 0.8 }}
                      className="absolute text-yellow-400/20"
                    >
                      <Sparkles size={12} />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          </div>
        );
    }
  };

  const currentTheme = THEME_COLORS.find(t => t.id === state.settings.themeColor) || THEME_COLORS[0];

  return (
    <div className={cn("max-w-md mx-auto min-h-screen pb-24 relative transition-colors duration-500", currentTheme.class)}>
      <MusicPlayer settings={state.settings} />
      
      {/* Header */}
      <header className="p-6 flex items-center justify-between sticky top-0 bg-bg/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Trophy size={20} />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-slate-800">一起轉大人</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsLevelInfoOpen(true)}
                className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase hover:bg-slate-200 transition-colors flex items-center gap-1"
              >
                LV.{state.profile.level}
                <Sparkles size={8} className="text-emerald-500" />
              </button>
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
          {user ? (
            <img 
              src={`https://ui-avatars.com/api/?name=${user.display_name}&background=random`} 
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm" 
              title={user.display_name}
            />
          ) : (
            <button 
              onClick={handleLogin}
              className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-emerald-500 transition-all"
              title="登入 Google 帳號"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </header>

      <main className="px-6">
        {renderContent()}
      </main>

      {/* Garden Info Modal */}
      <AnimatePresence>
        {isGardenInfoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <Sprout className="text-emerald-500" /> 成長花園玩法
                </h2>
                <button onClick={() => setIsGardenInfoOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 text-slate-600">
                <div className="bg-emerald-50 p-4 rounded-2xl">
                  <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                    <Cloud size={16} /> 灌溉機制
                  </h3>
                  <p className="text-sm leading-relaxed">
                    每一次習慣打卡都是在為花園「灌溉」。XP 越高，灌溉的養分就越充足。
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-4 rounded-2xl">
                    <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2 text-xs">
                      <Flame size={14} /> 狂熱加成
                    </h3>
                    <p className="text-[10px] leading-relaxed text-orange-700">
                      連續打卡 3 天以上，灌溉效率提升 20%！
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl">
                    <h3 className="font-bold text-indigo-800 mb-2 flex items-center gap-2 text-xs">
                      <Sparkles size={14} /> 繁花盛開
                    </h3>
                    <p className="text-[10px] leading-relaxed text-indigo-700">
                      連續打卡 7 天，花園將會出現閃爍特效。
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Trophy size={16} className="text-amber-500" /> 收成獎勵
                  </h3>
                  <ul className="text-xs space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      進度達 100% 時，自動收成並重置。
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      每次收成可獲得 <span className="font-black text-emerald-600">500 積分</span>。
                    </li>
                  </ul>
                </div>

                <button 
                  onClick={() => setIsGardenInfoOpen(false)}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Level Info Modal */}
      <AnimatePresence>
        {isLevelInfoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <Trophy className="text-amber-500" /> 等級與積分說明
                </h2>
                <button onClick={() => setIsLevelInfoOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 text-slate-600">
                <div className="bg-emerald-50 p-4 rounded-2xl">
                  <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                    <Zap size={16} /> 經驗值 (XP) 獲取
                  </h3>
                  <ul className="text-sm space-y-2">
                    <li className="flex justify-between"><span>Mini 目標</span> <span className="font-bold text-emerald-600">+10 XP</span></li>
                    <li className="flex justify-between"><span>Advanced 目標</span> <span className="font-bold text-emerald-600">+30 XP</span></li>
                    <li className="flex justify-between"><span>Elite 目標</span> <span className="font-bold text-emerald-600">+50 XP</span></li>
                  </ul>
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl">
                  <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                    <Sparkles size={16} /> 加成機制 (更快速進化！)
                  </h3>
                  <ul className="text-sm space-y-3">
                    <li className="flex gap-3">
                      <div className="bg-white p-2 rounded-lg h-fit"><Flame size={14} className="text-orange-500" /></div>
                      <div>
                        <p className="font-bold text-slate-800">連續打卡獎勵</p>
                        <p className="text-xs">每滿 7 天連續打卡，XP 與積分獲得量提升 10% (最高 50%)。</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="bg-white p-2 rounded-lg h-fit"><Zap size={14} className="text-blue-500" /></div>
                      <div>
                        <p className="font-bold text-slate-800">Combo 連擊</p>
                        <p className="text-xs">單日打卡超過 3 個項目，該日所有獲得 XP 與積分提升 50%！</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl">
                  <h3 className="font-bold text-slate-800 mb-2">等級晉升</h3>
                  <p className="text-sm">每累積 100 XP 即可提升一級。等級越高，代表你對習慣的掌控力越強！</p>
                </div>

                <button 
                  onClick={() => setIsLevelInfoOpen(false)}
                  className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl"
                >
                  我知道了
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
