import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyLog } from '../types';
import { cn } from '../lib/utils';
import { LEVEL_XP } from '../constants';

interface CalendarViewProps {
  logs: { [date: string]: DailyLog };
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ logs, selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const averageScore = React.useMemo(() => {
    const scores = Object.values(logs).map(dayLog => {
      let s = 0;
      Object.values(dayLog).forEach(cat => {
        Object.values(cat).forEach(sub => {
          s += LEVEL_XP[sub.achieved];
        });
      });
      return s;
    }).filter(s => s > 0);
    
    if (scores.length === 0) return 10;
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }, [logs]);

  const getDayScore = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLog = logs[dateStr];
    if (!dayLog) return 0;
    
    let score = 0;
    Object.values(dayLog).forEach(cat => {
      Object.values(cat).forEach(sub => {
        score += LEVEL_XP[sub.achieved];
      });
    });
    return score;
  };

  const getDayColor = (score: number, avg: number) => {
    if (score === 0) return 'text-slate-300';
    if (score < avg) {
      const ratio = score / avg;
      if (ratio < 0.5) return 'text-blue-700 font-bold';
      return 'text-blue-400';
    }
    if (score < avg * 2.5) {
      const ratio = (score - avg) / (avg * 1.5);
      if (ratio > 0.7) return 'text-emerald-800 font-black';
      if (ratio > 0.3) return 'text-emerald-600 font-bold';
      return 'text-emerald-400';
    }
    return 'text-rose-500 font-black scale-110';
  };

  const getAnimal = (score: number, avg: number) => {
    if (score === 0) return null;
    if (score < avg * 0.5) return '🐛';
    if (score < avg) return '🐢';
    if (score < avg * 1.5) return '🐰';
    if (score < avg * 2.5) return '🐯';
    return '🐲';
  };

  return (
    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-slate-800">{format(currentMonth, 'yyyy年 M月')}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-full text-slate-400">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-300 uppercase">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const score = getDayScore(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <button
                key={i}
                onClick={() => onDateSelect(day)}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all",
                  !isCurrentMonth && "opacity-20",
                  isSelected ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "hover:bg-slate-50"
                )}
              >
                <span className={cn("text-xs font-bold", isSelected ? "text-white" : getDayColor(score, averageScore))}>
                  {format(day, 'd')}
                </span>
                {score > 0 && !isSelected && (
                  <span className="text-[10px] mt-0.5">{getAnimal(score, averageScore)}</span>
                )}
              </button>
            );
        })}
      </div>
    </div>
  );
};
