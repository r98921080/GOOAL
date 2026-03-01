import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ChevronRight, CheckCircle2, Trash2, Edit3, Save, X as CloseIcon } from 'lucide-react';
import { Category, DailyLog, Level, SubItem } from '../types';
import { cn } from '../lib/utils';

interface CategoryCardProps {
  category: Category;
  logs: DailyLog;
  onLog: (subId: string, level: Level, score: number, note?: string) => void;
  onResetLog: (subId: string) => void;
  onDelete: () => void;
  onEdit: (updatedCategory: Category) => void;
  isEditable?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ 
  category, 
  logs, 
  onLog, 
  onResetLog, 
  onDelete, 
  onEdit,
  isEditable = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedSub, setSelectedSub] = useState<SubItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(category.title);
  const [editSubItems, setEditSubItems] = useState(category.subItems);
  const [tempScore, setTempScore] = useState(5);
  const [note, setNote] = useState('');

  const catLogs = logs[category.id] || {};
  const completedCount = Object.keys(catLogs).length;
  const progress = (completedCount / 3) * 100;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer outline-none"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xl">
            {category.title[0]}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-lg text-slate-800">{category.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-emerald-500"
                />
              </div>
              <span className="text-xs text-slate-400 font-medium">{completedCount}/3</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="p-2 text-slate-300 hover:text-emerald-500 transition-colors"
          >
            <Edit3 size={16} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`⚠️ 確定要刪除「${category.title}」嗎？\n這將移除此項目的所有設定，但歷史數據會保留在日誌中。`)) {
                onDelete();
              }
            }}
            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
          <ChevronRight className={cn("text-slate-300 transition-transform", isExpanded && "rotate-90")} />
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white rounded-[32px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-800">編輯項目</h2>
                <button onClick={() => setIsEditing(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <CloseIcon size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">大項目名稱</label>
                  <input 
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">子項目設定 (3個)</label>
                  {editSubItems.map((sub, idx) => (
                    <div key={sub.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <input 
                        type="text"
                        value={sub.name}
                        onChange={(e) => {
                          const newSubs = [...editSubItems];
                          newSubs[idx].name = e.target.value;
                          setEditSubItems(newSubs);
                        }}
                        placeholder="子項目名稱"
                        className="w-full bg-transparent font-bold text-slate-700 border-b border-slate-200 pb-1 outline-none focus:border-emerald-500"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        {(['mini', 'advanced', 'elite'] as Level[]).map(lvl => (
                          <div key={lvl}>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{lvl}</span>
                            <input 
                              type="text"
                              value={sub.levels[lvl]}
                              onChange={(e) => {
                                const newSubs = [...editSubItems];
                                newSubs[idx].levels[lvl] = e.target.value;
                                setEditSubItems(newSubs);
                              }}
                              className="w-full text-[10px] bg-white border border-slate-200 rounded-lg p-1 outline-none focus:border-emerald-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    onEdit({ ...category, title: editTitle, subItems: editSubItems });
                    setIsEditing(false);
                  }}
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  儲存修改
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-5 pb-5 space-y-3"
          >
            {category.subItems.map(sub => {
              const log = catLogs[sub.id];
              return (
                <div key={sub.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-slate-700">{sub.name}</span>
                    {log && (
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold uppercase">
                        <CheckCircle2 size={14} />
                        {log.achieved}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {(['mini', 'advanced', 'elite'] as Level[]).map(level => (
                      <button
                        key={level}
                        onClick={() => isEditable && setSelectedSub(sub)}
                        disabled={!isEditable}
                        className={cn(
                          "py-2 px-1 rounded-xl text-[10px] font-bold uppercase transition-all",
                          log?.achieved === level 
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                            : "bg-white text-slate-400 border border-slate-200 hover:border-emerald-300",
                          !isEditable && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {level}
                        <div className="text-[8px] opacity-60 font-normal mt-0.5">{sub.levels[level]}</div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Log Modal */}
      <AnimatePresence>
        {selectedSub && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-8"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
                <h2 className="text-2xl font-black text-slate-800 mb-2">{selectedSub.name}</h2>
                <p className="text-slate-400">選擇今日達成的等級與質量</p>
              </div>

              <div className="mb-8">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">今日心得 (選填)</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="記錄一下今天的狀態..."
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:border-emerald-500 h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-8">
                {(['mini', 'advanced', 'elite'] as Level[]).map(level => (
                  <button
                    key={level}
                    onClick={() => {
                      onLog(selectedSub.id, level, tempScore, note);
                      setSelectedSub(null);
                      setNote('');
                    }}
                    className="flex flex-col items-center p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    <span className="text-sm font-black text-slate-700 group-hover:text-emerald-700 uppercase">{level}</span>
                    <span className="text-xs text-slate-400 mt-1">{selectedSub.levels[level]}</span>
                  </button>
                ))}
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">評分質量</span>
                  <div className="flex items-center gap-1">
                    <Star className="text-amber-400 fill-amber-400" size={16} />
                    <span className="font-bold text-slate-800">{tempScore}</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={tempScore}
                  onChange={(e) => setTempScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <button
                onClick={() => setSelectedSub(null)}
                className="w-full py-4 rounded-2xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition-colors"
              >
                取消
              </button>

              {logs[category.id]?.[selectedSub.id] && (
                <button
                  onClick={() => {
                    if (window.confirm('確定要重置此項目的今日進度嗎？')) {
                      onResetLog(selectedSub.id);
                      setSelectedSub(null);
                    }
                  }}
                  className="w-full py-3 mt-3 rounded-2xl bg-rose-50 text-rose-500 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  重置今日進度
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
