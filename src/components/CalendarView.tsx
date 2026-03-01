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

  const getDayStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayLog = logs[dateStr];
    if (!dayLog) return 'none';
    
    const totalSubItems = Object.values(dayLog).reduce((acc, cat) => acc + Object.keys(cat).length, 0);
    if (totalSubItems >= 3) return 'high';
    if (totalSubItems > 0) return 'low';
    return 'none';
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
          const status = getDayStatus(day);
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
              <span className={cn("text-xs font-bold", isSelected ? "text-white" : "text-slate-700")}>
                {format(day, 'd')}
              </span>
              {status !== 'none' && !isSelected && (
                <div className={cn(
                  "w-1 h-1 rounded-full mt-1",
                  status === 'high' ? "bg-emerald-500" : "bg-emerald-300"
                )} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
