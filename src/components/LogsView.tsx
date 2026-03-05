import React, { useState, useMemo } from 'react';
import { format, subDays, isSameDay, parseISO, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  BarChart3, 
  Book, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  History,
  Edit2,
  Save,
  Sparkles,
  Info,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { AppState, Category, DailyLog, Level } from '../types';
import { cn } from '../lib/utils';
import { CalendarView } from './CalendarView';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths,
  isSameMonth
} from 'date-fns';

interface LogsViewProps {
  state: AppState;
  onUpdateNote: (date: string, note: string) => void;
  onUpdateUserNoteTitle: (date: string, title: string) => void;
  onAnalyzeJournal: (date: string) => Promise<any[] | undefined>;
  onRemoveTodo: (id: string) => void;
  onCreateCalendarEvent: (event: any) => Promise<boolean>;
}

type LogTab = 'daily' | 'trends' | 'diary';

export const LogsView: React.FC<LogsViewProps> = ({ 
  state, 
  onUpdateNote,
  onUpdateUserNoteTitle,
  onAnalyzeJournal,
  onRemoveTodo,
  onCreateCalendarEvent
}) => {
  const [activeTab, setActiveTab] = useState<LogTab>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(state.categories[0]?.id || '');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState('');
  const [viewMonth, setViewMonth] = useState(new Date());
  const [trendDetailDate, setTrendDetailDate] = useState<string | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedEvents, setSuggestedEvents] = useState<any[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayLog = state.logs[dateStr] || {};
  const dayNote = state.dailyNotes?.[dateStr] || '';

  const last7Days = useMemo(() => {
    return [...Array(7)].map((_, i) => subDays(new Date(), i)).reverse();
  }, []);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const events = await onAnalyzeJournal(dateStr);
    if (events && events.length > 0) {
      setSuggestedEvents(events);
      setCurrentEventIndex(0);
      setShowEventModal(true);
    }
    setIsAnalyzing(false);
  };

  const handleConfirmEvent = async () => {
    const event = suggestedEvents[currentEventIndex];
    const success = await onCreateCalendarEvent(event);
    if (success) {
      if (currentEventIndex < suggestedEvents.length - 1) {
        setCurrentEventIndex(prev => prev + 1);
      } else {
        setShowEventModal(false);
        alert('行程已成功建立至 Google 日曆！');
      }
    } else {
      alert('建立行程失敗，請檢查權限或網路。');
    }
  };

  const renderDaily = () => (
    <div className="space-y-6">
      <CalendarView 
        logs={state.logs} 
        selectedDate={selectedDate} 
        onDateSelect={(d) => {
          setSelectedDate(d);
          setTempNote(state.dailyNotes?.[format(d, 'yyyy-MM-dd')] || '');
        }} 
      />

      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h3 className="font-black text-slate-800 flex items-center gap-2">
              <Book size={18} className="text-emerald-500" />
              當日心得
            </h3>
            {state.noteTitles?.[dateStr] && (
              <span className="text-[10px] font-black text-emerald-600 ml-7 uppercase tracking-wider">
                「{state.noteTitles[dateStr]}」
              </span>
            )}
          </div>
          {!isEditingNote ? (
            <div className="flex items-center gap-1">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !dayNote}
                className={cn(
                  "p-2 rounded-xl transition-all flex items-center gap-1 text-[10px] font-bold uppercase",
                  isAnalyzing ? "bg-slate-100 text-slate-400" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                )}
              >
                <Sparkles size={14} className={cn(isAnalyzing && "animate-spin")} />
                AI 檢視
              </button>
              <button 
                onClick={() => {
                  setTempNote(dayNote);
                  setIsEditingNote(true);
                }}
                className="p-2 text-slate-400 hover:text-emerald-500"
              >
                <Edit2 size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                onUpdateNote(dateStr, tempNote);
                setIsEditingNote(false);
              }}
              className="p-2 text-emerald-500"
            >
              <Save size={16} />
            </button>
          )}
        </div>
        
        {isEditingNote ? (
          <textarea
            value={tempNote}
            onChange={(e) => setTempNote(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-emerald-500 h-32 resize-none"
            placeholder="寫下今天的感觸..."
          />
        ) : (
          <p className={cn(
            "text-sm leading-relaxed",
            dayNote ? "text-slate-600 italic" : "text-slate-300"
          )}>
            {dayNote || "這天還沒有留下任何文字紀錄。"}
          </p>
        )}
      </div>

      {/* Fun Facts Module */}
      {state.funFacts[dateStr] && (
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="font-black text-lg mb-4 flex items-center gap-2">
              <Sparkles size={20} />
              今日冷知識
            </h3>
            <div className="space-y-4">
              {state.funFacts[dateStr].map((fact) => (
                <div key={fact.id} className="flex gap-3 items-start">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 shrink-0">
                    {fact.category}
                  </span>
                  <p className="text-sm leading-relaxed text-indigo-50">
                    {fact.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 blur-3xl rounded-full" />
        </div>
      )}

      {/* Todo List Module */}
      {state.todos.length > 0 && (
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
            <History size={18} className="text-emerald-500" />
            待辦事項
          </h3>
          <div className="flex flex-wrap gap-2">
            {state.todos.map(todo => (
              <div 
                key={todo.id} 
                className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full"
              >
                <button 
                  onClick={() => onRemoveTodo(todo.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
                <span className="text-xs font-bold text-slate-600">{todo.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Analysis Module */}
      {state.dailyAnalyses[dateStr] && (
        <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-lg">
          <h3 className="font-black text-lg mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-400" />
            心智圖分析
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <h4 className="text-[10px] font-black uppercase text-emerald-400 mb-2 tracking-widest">中心思想</h4>
              <p className="text-sm text-slate-300 leading-relaxed italic">
                {state.dailyAnalyses[dateStr].summary}
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <h4 className="text-[10px] font-black uppercase text-emerald-400 mb-2 tracking-widest">心智結構</h4>
              <div className="text-xs text-slate-400 whitespace-pre-line font-mono">
                {state.dailyAnalyses[dateStr].mindMap}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">完成詳情</h3>
        {Object.keys(dayLog).length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-sm">
            當日無打卡紀錄
          </div>
        ) : (
          Object.entries(dayLog).map(([catId, catLogs]) => {
            const category = state.categories.find(c => c.id === catId);
            if (!category) return null;
            return (
              <div key={catId} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                <h4 className="font-black text-emerald-600 text-xs mb-3 uppercase tracking-widest">{category.title}</h4>
                <div className="space-y-3">
                  {Object.entries(catLogs).map(([subId, entry]) => {
                    const subItem = category.subItems.find(s => s.id === subId);
                    if (!subItem) return null;
                    return (
                      <div key={subId} className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">{subItem.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase">
                            {entry.achieved}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const renderTrends = () => {
    const category = state.categories.find(c => c.id === selectedCategoryId);
    
    if (!category) {
      return (
        <div className="p-12 text-center bg-white rounded-[32px] border border-dashed border-slate-200 text-slate-300">
          請先選擇一個類別
        </div>
      );
    }

    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const chartData = days.map(day => {
      const dStr = format(day, 'yyyy-MM-dd');
      const dayLogs = state.logs[dStr]?.[selectedCategoryId] || {};
      const completedCount = Object.keys(dayLogs).length;
      return {
        date: dStr,
        displayDate: format(day, 'd'),
        count: completedCount,
        logs: dayLogs
      };
    });

    const monthlyNotes = Object.entries(state.dailyNotes || {})
      .filter(([date]) => isSameMonth(parseISO(date), viewMonth))
      .sort((a, b) => a[0].localeCompare(b[0]));

    return (
      <div className="space-y-6">
        {/* Category Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {state.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                selectedCategoryId === cat.id ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" : "bg-white text-slate-400 border border-slate-100"
              )}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
          <button onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <ChevronLeft size={20} className="text-slate-400" />
          </button>
          <h3 className="font-black text-slate-800">{format(viewMonth, 'yyyy年 MM月')}</h3>
          <button onClick={() => setViewMonth(addMonths(viewMonth, 1))} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
            <ChevronRight size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Line Chart */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            每日完成進度
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData} 
                onClick={(data: any) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    setTrendDetailDate(data.activePayload[0].payload.date);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <YAxis 
                  domain={[0, 3]} 
                  ticks={[0, 1, 2, 3]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-2 rounded-lg text-[10px] font-bold">
                          {payload[0].payload.date}: {payload[0].value} 項完成
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">點擊圖表圓點查看當日詳情</p>
        </div>

        {/* Day Detail Section */}
        <AnimatePresence>
          {trendDetailDate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-emerald-50 rounded-3xl p-5 border border-emerald-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-emerald-800 text-sm">{trendDetailDate} 詳情</h4>
                  <button onClick={() => setTrendDetailDate(null)} className="text-emerald-400 hover:text-emerald-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  {category.subItems.map(sub => {
                    const entry = state.logs[trendDetailDate]?.[category.id]?.[sub.id];
                    return (
                      <div key={sub.id} className="flex items-center justify-between bg-white/50 p-3 rounded-xl">
                        <span className="text-xs font-bold text-slate-700">{sub.name}</span>
                        {entry ? (
                          <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded uppercase">
                            {entry.achieved}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase">未完成</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Monthly Notes */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
            <Book size={18} className="text-emerald-500" />
            本月心得回顧
          </h3>
          <div className="space-y-4">
            {monthlyNotes.length === 0 ? (
              <p className="text-center py-8 text-slate-300 text-sm italic">本月尚無心得紀錄</p>
            ) : (
              monthlyNotes.map(([date, note]) => (
                <div key={date} className="border-l-2 border-emerald-100 pl-4 py-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-400">{date}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed italic">"{note}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDiary = () => {
    const diaryEntries = Object.entries(state.dailyNotes || {})
      .filter(([date, note]) => {
        const title = state.noteTitles?.[date] || '';
        return note.toLowerCase().includes(searchQuery.toLowerCase()) || 
               title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               date.includes(searchQuery);
      })
      .sort((a, b) => b[0].localeCompare(a[0]));

    const toggleExpand = (date: string) => {
      const newSet = new Set(expandedEntries);
      if (newSet.has(date)) newSet.delete(date);
      else newSet.add(date);
      setExpandedEntries(newSet);
    };

    const expandAll = () => {
      setExpandedEntries(new Set(diaryEntries.map(([date]) => date)));
    };

    const collapseAll = () => {
      setExpandedEntries(new Set());
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="搜尋日誌內容、標題或日期..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none text-slate-600"
          />
        </div>

        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            共 {diaryEntries.length} 篇紀錄
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={expandAll}
              className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 hover:text-emerald-500 transition-colors"
            >
              <Maximize2 size={12} /> 全部展開
            </button>
            <button 
              onClick={collapseAll}
              className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1 hover:text-emerald-500 transition-colors"
            >
              <Minimize2 size={12} /> 全部收合
            </button>
          </div>
        </div>

        {diaryEntries.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-[32px] border border-dashed border-slate-200 text-slate-300">
            {searchQuery ? '找不到符合的日誌' : '尚未撰寫任何日記'}
          </div>
        ) : (
          <div className="relative space-y-4 pl-4 border-l-2 border-slate-100 ml-6">
            {diaryEntries.map(([date, note]) => {
              const isExpanded = expandedEntries.has(date);
              const aiTitle = state.noteTitles?.[date];
              const userTitle = state.userNoteTitles?.[date] || '';
              const parsedDate = parseISO(date);

              return (
                <motion.div 
                  key={date}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  {/* Timeline Dot */}
                  <div className={cn(
                    "absolute -left-[25px] top-6 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-colors duration-300",
                    isExpanded ? "bg-emerald-500" : "bg-slate-200"
                  )} />

                  <div 
                    className={cn(
                      "bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100 transition-all duration-300",
                      isExpanded ? "p-6 ring-2 ring-emerald-500/10" : "p-4 hover:border-emerald-200"
                    )}
                  >
                    <div 
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleExpand(date)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {format(parsedDate, 'yyyy.MM.dd')}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-500/60 uppercase">
                              {format(parsedDate, 'EEE')}
                            </span>
                            {aiTitle && (
                              <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">
                                AI: {aiTitle}
                              </span>
                            )}
                            {userTitle && !isExpanded && (
                              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase truncate max-w-[100px]">
                                {userTitle}
                              </span>
                            )}
                          </div>
                          
                          {isExpanded ? (
                            <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Edit2 size={12} className="text-slate-300 shrink-0" />
                              <input 
                                type="text"
                                value={userTitle}
                                onChange={(e) => onUpdateUserNoteTitle(date, e.target.value)}
                                placeholder="自行命名這一天..."
                                className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 outline-none focus:border-emerald-300"
                              />
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 italic">
                              {note}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDate(parsedDate);
                            setActiveTab('daily');
                          }}
                          className="p-2 text-slate-300 hover:text-emerald-500 transition-colors"
                          title="查看詳情"
                        >
                          <ChevronRight size={18} />
                        </button>
                        <div className="text-slate-300">
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-slate-50"
                        >
                          <p className="text-sm text-slate-600 leading-relaxed italic whitespace-pre-line">
                            "{note}"
                          </p>
                          
                          <div className="flex justify-between items-center mt-6">
                            <div className="flex gap-2">
                              {state.logs[date] && Object.keys(state.logs[date]).length > 0 && (
                                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full uppercase">
                                  已打卡 {Object.keys(state.logs[date]).length} 個項目
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={() => toggleExpand(date)}
                              className="text-[10px] font-bold text-slate-400 uppercase hover:text-slate-600 transition-colors"
                            >
                              收合內容
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex bg-slate-100 p-1 rounded-2xl">
        {(['daily', 'trends', 'diary'] as LogTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === tab ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {tab === 'daily' ? '日報' : tab === 'trends' ? '趨勢' : '日記'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'daily' && renderDaily()}
          {activeTab === 'trends' && renderTrends()}
          {activeTab === 'diary' && renderDiary()}
        </motion.div>
      </AnimatePresence>
      
      {/* Calendar Event Modal */}
      <AnimatePresence>
        {showEventModal && suggestedEvents[currentEventIndex] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                  <CalendarIcon size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">建立行事曆行程</h3>
                <p className="text-sm text-slate-400 mb-6">AI 偵測到您的日誌中提到以下行程，是否要加入 Google 日曆？</p>
                
                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">行程名稱</label>
                    <input 
                      type="text" 
                      value={suggestedEvents[currentEventIndex].summary}
                      onChange={(e) => {
                        const newEvents = [...suggestedEvents];
                        newEvents[currentEventIndex].summary = e.target.value;
                        setSuggestedEvents(newEvents);
                      }}
                      className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">地點</label>
                    <input 
                      type="text" 
                      value={suggestedEvents[currentEventIndex].location}
                      onChange={(e) => {
                        const newEvents = [...suggestedEvents];
                        newEvents[currentEventIndex].location = e.target.value;
                        setSuggestedEvents(newEvents);
                      }}
                      className="w-full bg-transparent text-sm font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">開始時間</label>
                      <input 
                        type="datetime-local" 
                        value={suggestedEvents[currentEventIndex].start.slice(0, 16)}
                        onChange={(e) => {
                          const newEvents = [...suggestedEvents];
                          newEvents[currentEventIndex].start = e.target.value;
                          setSuggestedEvents(newEvents);
                        }}
                        className="w-full bg-transparent text-[10px] font-bold text-slate-700 outline-none"
                      />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">結束時間</label>
                      <input 
                        type="datetime-local" 
                        value={suggestedEvents[currentEventIndex].end.slice(0, 16)}
                        onChange={(e) => {
                          const newEvents = [...suggestedEvents];
                          newEvents[currentEventIndex].end = e.target.value;
                          setSuggestedEvents(newEvents);
                        }}
                        className="w-full bg-transparent text-[10px] font-bold text-slate-700 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowEventModal(false)}
                    className="flex-1 py-4 rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-50 transition-all"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handleConfirmEvent}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                  >
                    確認建立
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
