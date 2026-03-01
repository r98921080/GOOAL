import React, { useState, useMemo } from 'react';
import { format, subDays, isSameDay, parseISO, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  BarChart3, 
  Book, 
  ChevronRight, 
  Star, 
  TrendingUp,
  History,
  Edit2,
  Save
} from 'lucide-react';
import { AppState, Category, DailyLog, Level } from '../types';
import { cn } from '../lib/utils';
import { CalendarView } from './CalendarView';

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
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} className={cn(i < entry.score ? "text-amber-400 fill-amber-400" : "text-slate-100")} />
                            ))}
                          </div>
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

    return (
      <div className="space-y-6">
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

        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            近七日執行度
          </h3>
          <div className="flex items-end justify-between h-32 px-2">
            {last7Days.map((date, i) => {
              const dStr = format(date, 'yyyy-MM-dd');
              const count = state.logs[dStr]?.[selectedCategoryId] ? Object.keys(state.logs[dStr][selectedCategoryId]).length : 0;
              const height = (count / 3) * 100;
              return (
                <div key={i} className="flex flex-col items-center gap-2 w-full">
                  <div className="w-4 bg-slate-100 rounded-full h-24 relative overflow-hidden">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      className="absolute bottom-0 left-0 right-0 bg-emerald-500 rounded-full"
                    />
                  </div>
                  <span className="text-[8px] font-bold text-slate-300 uppercase">{format(date, 'EEE')}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2">
            <History size={18} className="text-emerald-500" />
            歷史紀錄
          </h3>
          <div className="space-y-3">
            {Object.entries(state.logs)
              .filter(([_, log]) => log[selectedCategoryId])
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([date, log]) => (
                <div key={date} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-bold text-slate-500">{date}</span>
                  <div className="flex gap-1">
                    {Object.values(log[selectedCategoryId]).map((e, i) => (
                      <div key={i} className={cn(
                        "w-2 h-2 rounded-full",
                        e.achieved === 'elite' ? "bg-emerald-600" : e.achieved === 'advanced' ? "bg-emerald-400" : "bg-emerald-200"
                      )} />
                    ))}
                  </div>
                </div>
              ))}
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
