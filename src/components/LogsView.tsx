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
  X
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
}

type LogTab = 'daily' | 'trends' | 'diary';

export const LogsView: React.FC<LogsViewProps> = ({ state, onUpdateNote }) => {
  const [activeTab, setActiveTab] = useState<LogTab>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(state.categories[0]?.id || '');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState('');
  const [viewMonth, setViewMonth] = useState(new Date());
  const [trendDetailDate, setTrendDetailDate] = useState<string | null>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayLog = state.logs[dateStr] || {};
  const dayNote = state.dailyNotes?.[dateStr] || '';

  const last7Days = useMemo(() => {
    return [...Array(7)].map((_, i) => subDays(new Date(), i)).reverse();
  }, []);

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
          <h3 className="font-black text-slate-800 flex items-center gap-2">
            <Book size={18} className="text-emerald-500" />
            當日心得
          </h3>
          {!isEditingNote ? (
            <button 
              onClick={() => {
                setTempNote(dayNote);
                setIsEditingNote(true);
              }}
              className="p-2 text-slate-400 hover:text-emerald-500"
            >
              <Edit2 size={16} />
            </button>
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
      .sort((a, b) => b[0].localeCompare(a[0]));

    return (
      <div className="space-y-4">
        {diaryEntries.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-[32px] border border-dashed border-slate-200 text-slate-300">
            尚未撰寫任何日記
          </div>
        ) : (
          diaryEntries.map(([date, note]) => (
            <motion.div 
              key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100"
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-black text-slate-800">{date}</span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{format(parseISO(date), 'EEEE')}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic line-clamp-3">
                "{note}"
              </p>
              <button 
                onClick={() => {
                  setSelectedDate(parseISO(date));
                  setActiveTab('daily');
                }}
                className="mt-4 text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-1"
              >
                查看詳情 <ChevronRight size={10} />
              </button>
            </motion.div>
          ))
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
    </div>
  );
};
