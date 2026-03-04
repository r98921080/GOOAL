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

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  type: 'social' | 'efficacy' | 'habit' | 'other';
}

export interface FunFact {
  id: string;
  content: string;
  category: string;
}

export interface TodoItem {
  id: string;
  text: string;
}

export interface DailyAnalysis {
  summary: string;
  mindMap: string;
}

export interface ExploreAnalysis {
  emotions: string;
  psychology: string;
  balance: string;
  advice: string;
  goalAdjustments: string;
  updatedAt: string;
}

export interface AppSettings {
  musicEnabled: boolean;
  musicTheme: 'focus' | 'relax' | 'energy' | 'ambient';
  notificationsEnabled: boolean;
  privacyMode: boolean;
  lastMusicUpdate: string;
  currentMusicUrl?: string;
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
  dailyChallenges: {
    [date: string]: DailyChallenge[];
  };
  funFacts: {
    [date: string]: FunFact[];
  };
  todos: TodoItem[];
  dailyAnalyses: {
    [date: string]: DailyAnalysis;
  };
  exploreAnalysis?: ExploreAnalysis;
  settings: AppSettings;
}
