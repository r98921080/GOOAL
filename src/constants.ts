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
};

export const LEVEL_XP: Record<Level, number> = {
  mini: 1,
  advanced: 3,
  elite: 5,
};
