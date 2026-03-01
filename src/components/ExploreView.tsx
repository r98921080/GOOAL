import React from 'react';
import { motion } from 'motion/react';
import { Compass, Copy, ExternalLink, Zap } from 'lucide-react';
import { Category } from '../types';

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
}

export const ExploreView: React.FC<ExploreViewProps> = ({ onImport }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Compass className="text-emerald-500" size={20} />
        <h2 className="text-xl font-black text-slate-800">探索模板</h2>
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

      <div className="p-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[32px] text-white text-center">
        <Zap className="mx-auto mb-4" size={32} />
        <h3 className="text-xl font-black mb-2">更多模板即將推出</h3>
        <p className="text-emerald-100 text-sm">我們正在建立一個充滿動力的成長社群。</p>
      </div>
    </div>
  );
};
