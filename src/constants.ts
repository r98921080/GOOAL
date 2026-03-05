import { AppState, Level } from "./types";

export const INITIAL_STATE: AppState = {
  profile: {
    name: "進化者",
    totalXp: 0,
    level: 1,
    streak: 0,
  },
  categories: [
    {
      id: "cat_1",
      title: "身體素質",
      subItems: [
        {
          id: "sub_1_1",
          name: "深蹲",
          levels: { mini: "10下", advanced: "30下", elite: "50下" },
        },
        {
          id: "sub_1_2",
          name: "跑步",
          levels: { mini: "1km", advanced: "3km", elite: "5km" },
        },
        {
          id: "sub_1_3",
          name: "伸展",
          levels: { mini: "2分鐘", advanced: "10分鐘", elite: "20分鐘" },
        },
      ],
    },
    {
      id: "cat_2",
      title: "心智成長",
      subItems: [
        {
          id: "sub_2_1",
          name: "閱讀",
          levels: { mini: "1頁", advanced: "10頁", elite: "30頁" },
        },
        {
          id: "sub_2_2",
          name: "冥想",
          levels: { mini: "1分鐘", advanced: "10分鐘", elite: "20分鐘" },
        },
        {
          id: "sub_2_3",
          name: "寫作",
          levels: { mini: "50字", advanced: "300字", elite: "500字" },
        },
      ],
    },
  ],
  logs: {},
  dailyNotes: {},
  noteTitles: {},
  userNoteTitles: {},
  rewards: {
    points: 0,
    unlockedItems: [],
    gardenProgress: 0,
    gardenLevel: 1,
    gardenHistory: [],
  },
  dailyChallenges: {},
  funFacts: {},
  todos: [],
  dailyAnalyses: {},
  settings: {
    musicEnabled: false,
    musicTheme: 'focus',
    notificationsEnabled: true,
    privacyMode: false,
    lastMusicUpdate: new Date(0).toISOString(),
    themeColor: 'default',
  }
};

export const THEME_COLORS = [
  { id: 'default', name: '極簡白', class: 'bg-slate-50' },
  { id: 'emerald', name: '翡翠綠', class: 'bg-gradient-to-br from-emerald-50 to-teal-50' },
  { id: 'indigo', name: '星空藍', class: 'bg-gradient-to-br from-indigo-50 to-purple-50' },
  { id: 'amber', name: '晨曦橘', class: 'bg-gradient-to-br from-amber-50 to-orange-50' },
  { id: 'rose', name: '玫瑰粉', class: 'bg-gradient-to-br from-rose-50 to-pink-50' },
  { id: 'dark', name: '深邃黑', class: 'bg-slate-900 text-slate-100' },
];

export const LEVEL_XP: Record<Level, number> = {
  mini: 10,
  advanced: 30,
  elite: 50,
};


