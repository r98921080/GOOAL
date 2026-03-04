import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Zap, Sparkles, Brain, Heart, Activity, Target, RefreshCw, Loader2 } from 'lucide-react';
import { Category, DailyChallenge, ExploreAnalysis, AppState } from '../types';
import { cn } from '../lib/utils';
import { performDeepLifeAnalysis } from '../services/geminiService';

interface ExploreViewProps {
  state: AppState;
  onUpdateAnalysis: (analysis: ExploreAnalysis) => void;
  dailyChallenges: DailyChallenge[];
  onCompleteChallenge: (id: string) => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ state, onUpdateAnalysis, dailyChallenges, onCompleteChallenge }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysis = state.exploreAnalysis;

  const handleDeepAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await performDeepLifeAnalysis(state);
      onUpdateAnalysis(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Daily Challenges Section */}
      {dailyChallenges.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="text-amber-500" size={20} />
            <h2 className="text-lg font-black text-slate-800">今日小挑戰</h2>
          </div>
          <div className="space-y-3">
            {dailyChallenges.map(challenge => (
              <button
                key={challenge.id}
                onClick={() => onCompleteChallenge(challenge.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border transition-all flex items-center justify-between text-left",
                  challenge.completed 
                    ? "bg-slate-50 border-slate-100 opacity-60" 
                    : "bg-white border-slate-100 hover:border-emerald-200 shadow-sm"
                )}
              >
                <div className="flex-1">
                  <h4 className={cn("font-bold text-sm", challenge.completed ? "text-slate-400 line-through" : "text-slate-700")}>
                    {challenge.title}
                  </h4>
                  <p className={cn(
                    "text-base mt-1 font-medium", 
                    challenge.completed ? "text-slate-400 line-through" : "text-indigo-900"
                  )}>
                    {challenge.description}
                  </p>
                </div>
                <div className={cn(
                  "ml-4 px-3 py-1 rounded-full text-[10px] font-black uppercase",
                  challenge.completed ? "bg-slate-200 text-slate-400" : "bg-emerald-50 text-emerald-600"
                )}>
                  {challenge.completed ? '已完成' : `+${challenge.points}`}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* AI Deep Analysis Section */}
      <section className="relative overflow-hidden bg-slate-900 rounded-[40px] p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Brain size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black">AI 深度生命探索</h2>
                <p className="text-slate-400 text-xs">分析情緒、心理狀態與生活平衡</p>
              </div>
            </div>
            <button 
              onClick={handleDeepAnalysis}
              disabled={isAnalyzing}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all disabled:opacity-50"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {analysis ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
                    <div className="flex items-center gap-2 mb-3 text-pink-400">
                      <Heart size={18} />
                      <span className="text-xs font-black uppercase tracking-wider">情緒與心理</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{analysis.emotions}</p>
                    <p className="text-xs text-slate-500 mt-3 italic">{analysis.psychology}</p>
                  </div>

                  <div className="bg-white/5 rounded-3xl p-5 border border-white/10">
                    <div className="flex items-center gap-2 mb-3 text-blue-400">
                      <Activity size={18} />
                      <span className="text-xs font-black uppercase tracking-wider">生活平衡度</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{analysis.balance}</p>
                  </div>
                </div>

                <div className="bg-emerald-500/10 rounded-3xl p-6 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-4 text-emerald-400">
                    <Sparkles size={18} />
                    <span className="text-xs font-black uppercase tracking-wider">成長建議</span>
                  </div>
                  <div className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                    {analysis.advice}
                  </div>
                </div>

                <div className="bg-amber-500/10 rounded-3xl p-6 border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-4 text-amber-400">
                    <Target size={18} />
                    <span className="text-xs font-black uppercase tracking-wider">目標微調洞見</span>
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{analysis.goalAdjustments}</p>
                </div>

                <p className="text-[10px] text-slate-500 text-center">
                  最後分析時間：{new Date(analysis.updatedAt).toLocaleString()}
                </p>
              </motion.div>
            ) : (
              <div className="text-center py-12">
                <Compass className="mx-auto text-slate-700 mb-4 animate-pulse" size={48} />
                <h3 className="text-lg font-bold text-slate-300">尚未進行深度分析</h3>
                <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
                  點擊右上角按鈕，讓 AI 根據您的紀錄察覺您的心理狀態並提供生活建議。
                </p>
                <button 
                  onClick={handleDeepAnalysis}
                  disabled={isAnalyzing}
                  className="mt-6 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-500/20"
                >
                  開始深度探索
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full" />
      </section>

      <div className="p-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[32px] text-white text-center shadow-xl">
        <Activity className="mx-auto mb-4" size={32} />
        <h3 className="text-xl font-black mb-2">持續進化中</h3>
        <p className="text-emerald-100 text-sm">您的每一份數據都是 AI 提供精準建議的養分。</p>
      </div>
    </div>
  );
};
