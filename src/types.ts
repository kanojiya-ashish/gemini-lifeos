export type JournalCategory = 'daily_reflection' | 'brainstorm' | 'goal_planning' | 'freeform' | 'decision_making';
export type SentimentType = 'positive' | 'reflective' | 'challenging' | 'optimistic' | 'neutral';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface InteractionDoc {
  id: string;
  userId: string;
  title: string;
  category: JournalCategory;
  messages: ChatMessage[];
  summary?: string;
  extractedGoals?: string[];
  sentiment?: SentimentType;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export type GoalStatus = 'active' | 'completed' | 'archived';
export type GoalCategory = 'mindset' | 'career' | 'health' | 'habits' | 'personal';

export interface GoalDoc {
  id: string;
  userId: string;
  sourceInteractionId?: string;
  title: string;
  description: string;
  targetCategory: GoalCategory;
  status: GoalStatus;
  extractedDate: number;
  targetDate?: string;
  progress: number; // 0 - 100
}

export interface InsightDoc {
  id: string;
  userId: string;
  type: 'weekly_reflection' | 'pattern_detection' | 'growth_trend';
  title: string;
  weekLabel: string;
  accomplishments: string[];
  challenges: string[];
  keyThemes: string[];
  goalsIdentified: string[];
  suggestedFocusAreas: string[];
  entriesAnalyzedCount: number;
  generatedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
  lastLoginAt: number;
}
