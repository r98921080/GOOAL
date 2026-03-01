export type Level = 'mini' | 'advanced' | 'elite';

export interface SubItem {
  id: string;
  name: string;
  levels: {
    mini: string;
    advanced: string;
    elite: string;
  };
}

export interface Category {
  id: string;
  title: string;
  subItems: SubItem[];
}

export interface DailyLogEntry {
  achieved: Level;
  score: number; // 1-5 stars
  note?: string;
}

export interface DailyLog {
  [categoryId: string]: {
    [subItemId: string]: DailyLogEntry;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface UserProfile {
  name: string;
  totalXp: number;
  level: number;
  streak: number;
  achievements: Achievement[];
}

export interface AppState {
  profile: UserProfile;
  categories: Category[];
  logs: {
    [date: string]: DailyLog;
  };
  dailyNotes: {
    [date: string]: string;
  };
  rewards: {
    points: number;
    unlockedItems: string[];
  };
}
