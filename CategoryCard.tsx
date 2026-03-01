import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Tooltip
} from 'recharts';
import { Category, DailyLog } from '../types';

interface ChartViewProps {
  categories: Category[];
  todayLogs: DailyLog;
}

export const ChartView: React.FC<ChartViewProps> = ({ categories, todayLogs }) => {
  const data = categories.map(cat => {
    const subLogs = todayLogs[cat.id] || {};
    const completedCount = Object.keys(subLogs).length;
    const avgScore = completedCount > 0 
      ? Object.values(subLogs).reduce((acc, curr) => acc + curr.score, 0) / completedCount 
      : 0;
    
    return {
      name: cat.title,
      value: completedCount || 0,
      displayValue: completedCount || 0.1, // Small value for pie visibility
      score: avgScore,
      fullMark: 3,
    };
  });

  if (categories.length === 0) {
    return (
      <div className="h-64 w-full flex flex-col items-center justify-center text-slate-300">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm font-bold uppercase tracking-widest">尚無數據</p>
      </div>
    );
  }

  if (categories.length <= 3) {
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="displayValue"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.value > 0 ? `rgba(16, 185, 129, ${0.2 + (entry.score / 5) * 0.8})` : '#f1f5f9'} 
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 3]} tick={false} axisLine={false} />
          <Radar
            name="今日進度"
            dataKey="value"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.5}
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
