import React from 'react';
import { motion } from 'motion/react';
import { Compass, Copy, ExternalLink, Zap, Sparkles } from 'lucide-react';
import { Category } from '../types';
import { ACHIEVEMENTS } from '../constants';
import { cn } from '../lib/utils';

const COMMUNITY_TEMPLATES = [
  {
    id: 'tpl_1',
    name: '極簡主義者',
    author: 'Alex',
    categories: [
      { id: 'c1', title: '極簡生活', subItems: [{ name: '斷捨離', levels: { mini: '1件', advanced: '5件', elite: '10件' } }] },
      { id: 'c2', title: '財務自由', subItems: [{ name: '記帳', levels: { mini: '1筆', advanced: '全部', elite: '分析' } }] }
    ]
  },
  {
    id: 'tpl_2',
    name: '全能運動員',
    author: 'Coach J',
    categories: [
      { id: 'c3', title: '體能', subItems: [{ name: '波比跳', levels: { mini: '10下', advanced: '50下', elite: '100下' } }] },
      { id: 'c4', title: '耐力', subItems: [{ name: '跑步', levels: { mini: '2km', advanced: '10km', elite: '21km' } }] }
    ]
  }
];

interface ExploreViewProps {
  onImport: (categories: any[]) => void;
  profile: any;
  rewards: any;
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onImport, profile, rewards }) => {
  const unlockedIds = new Set(profile.achievements.map((a: any) => a.id));

  return (
    <div className="space-y-8">
      {/* Rewards Section */}
      <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500" size={20} />
            <h2 className="text-lg font-black text-slate-800">成長積分</h2>
          </div>
          <span className="text-2xl font-black text-amber-500">{rewards.points}</span>
        </div>
        <p className="text-xs text-slate-400">完成打卡與達成成就可獲得積分，未來可用於兌換獎勵。</p>
      </section>

      {/* Achievements Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="text-indigo-500" size={20} />
          <h2 className="text-lg font-black text-slate-800">成就系統</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = unlockedIds.has(ach.id);
            return (
              <motion.div 
                key={ach.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "p-4 rounded-3xl border transition-all flex flex-col items-center text-center",
                  isUnlocked ? "bg-indigo-50 border-indigo-100" : "bg-slate-50 border-slate-100 grayscale opacity-50"
                )}
              >
                <span className="text-3xl mb-2">{ach.icon}</span>
                <h4 className="text-xs font-black text-slate-800 mb-1">{ach.title}</h4>
                <p className="text-[10px] text-slate-400 leading-tight">{ach.description}</p>
                {isUnlocked && (
                  <div className="mt-2 text-[8px] font-bold text-indigo-500 uppercase">已達成</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Templates Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Compass className="text-emerald-500" size={20} />
          <h2 className="text-lg font-black text-slate-800">探索模板</h2>
        </div>

        <div className="grid gap-4">
          {COMMUNITY_TEMPLATES.map(tpl => (
            <motion.div 
              key={tpl.id}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{tpl.name}</h3>
                  <p className="text-xs text-slate-400">由 {tpl.author} 分享</p>
                </div>
                <button 
                  onClick={() => {
                    if (confirm(`確定要匯入「${tpl.name}」模板嗎？這將會新增這些類別到你的清單中。`)) {
                      onImport(tpl.categories);
                    }
                  }}
                  className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition-colors"
                >
                  <Copy size={18} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {tpl.categories.map(c => (
                  <span key={c.id} className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase">
                    {c.title}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Section Placeholder */}
      <section className="p-8 bg-slate-900 rounded-[40px] text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <h3 className="text-lg font-black">好友監督模式</h3>
          </div>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            即將推出！邀請好友互相監督，當你偷懶時，好友會收到通知。共同達成目標，獲得雙倍積分獎勵。
          </p>
          <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-bold transition-all">
            搶先預約功能
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full" />
      </section>

      <div className="p-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[32px] text-white text-center">
        <Zap className="mx-auto mb-4" size={32} />
        <h3 className="text-xl font-black mb-2">更多模板即將推出</h3>
        <p className="text-emerald-100 text-sm">我們正在建立一個充滿動力的成長社群。</p>
      </div>
    </div>
  );
};
