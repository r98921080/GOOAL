import React, { useMemo } from 'react';
import { format, eachDayOfInterval, startOfYear, endOfYear, isSameDay, subMonths } from 'date-fns';
import { DailyLog, Level } from '../types';
import { cn } from '../lib/utils';

interface HeatmapProps {
  logs: { [date: string]: DailyLog };
}

export const Heatmap: React.FC<HeatmapProps> = ({ logs }) => {
  const days = useMemo(() => {
    const end = new Date();
    const start = subMonths(end, 3); // Show last 3 months
    return eachDayOfInterval({ start, end });
  }, []);

  const getIntensity = (dateStr: string) => {
    const dayLog = logs[dateStr];
    if (!dayLog) return 0;

    let totalPoints = 0;
    Object.values(dayLog).forEach(catLog => {
      Object.values(catLog).forEach(subLog => {
        if (subLog.achieved === 'elite') totalPoints += 3;
        else if (subLog.achieved === 'advanced') totalPoints += 2;
        else if (subLog.achieved === 'mini') totalPoints += 1;
      });
    });

    return Math.min(totalPoints, 10); // Cap at 10 for color scaling
  };

  const getColorClass = (intensity: number) => {
    if (intensity === 0) return 'bg-slate-100';
    if (intensity < 3) return 'bg-emerald-200';
    if (intensity < 6) return 'bg-emerald-400';
    if (intensity < 9) return 'bg-emerald-600';
    return 'bg-emerald-800';
  };

  return (
    <div className="flex flex-wrap gap-1 p-4 bg-white rounded-2xl shadow-sm overflow-hidden">
      {days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const intensity = getIntensity(dateStr);
        return (
          <div
            key={dateStr}
            title={`${dateStr}: ${intensity} points`}
            className={cn(
              "w-3 h-3 rounded-sm",
              getColorClass(intensity)
            )}
          />
        );
      })}
    </div>
  );
};
