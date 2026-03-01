import { AppState, Level } from "./types";

export const INITIAL_STATE: AppState = {
  profile: {
    name: "進化者",
    totalXp: 0,
    level: 1,
    streak: 0,
    achievements: [],
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
  rewards: {
    points: 0,
    unlockedItems: [],
  },
  dailyChallenges: {},
  funFacts: {},
  todos: [],
  dailyAnalyses: {},
};

export const LEVEL_XP: Record<Level, number> = {
  mini: 1,
  advanced: 3,
  elite: 5,
};

export const ACHIEVEMENTS = [
  { id: 'first_step', title: '踏出第一步', description: '完成第一次打卡', icon: '🌱' },
  { id: 'streak_3', title: '三日不懈', description: '連續打卡 3 天', icon: '🔥' },
  { id: 'streak_7', title: '一週達人', description: '連續打卡 7 天', icon: '💎' },
  { id: 'level_5', title: '進化者', description: '等級達到 LV.5', icon: '🚀' },
  { id: 'elite_master', title: '極致追求', description: '單日完成 3 個 Elite 目標', icon: '👑' },
  { id: 'balance_master', title: '平衡大師', description: '所有大項目皆有打卡紀錄', icon: '⚖️' },
];
