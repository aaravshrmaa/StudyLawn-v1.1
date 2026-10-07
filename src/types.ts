export type ActiveTab =
  | 'dashboard'
  | 'focus'
  | 'timetable'
  | 'completion'
  | 'tests'
  | 'profile'
  | 'about'
  | 'terms'
  | 'privacy';

export type ExamRegionPreset = 'US' | 'UK' | 'India' | 'Global' | 'Custom';

export interface UserProfile {
  id: string;
  name: string;
  examGoal: string;
  examRegion?: ExamRegionPreset;
  targetDate?: string;
  targetDailyHours: number;
  timezone?: string;
  timeFormat?: '12h' | '24h';
  createdAt?: string;
  updatedAt?: string;
}

export interface ScheduledStudySlot {
  id: string;
  title: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  date?: string;      // "YYYY-MM-DD"
  enabled: boolean;
  notes?: string;
  targetTopics?: string;
  allocatedTaskId?: string;
  allocationReason?: string;
  createdWhenPast?: boolean;
  markedComplete?: boolean;
  repeatEveryday?: boolean;
  unmarkedByUser?: boolean;
}

export interface SlotTemplateItem {
  title: string;
  startTime: string;
  endTime: string;
  targetTopics?: string;
  notes?: string;
  enabled?: boolean;
}

export interface SlotTemplate {
  id: string;
  title: string;
  createdAt: string;
  slots: SlotTemplateItem[];
}

export type CompletionCategory =
  | 'Deep Work'
  | 'Research'
  | 'Project'
  | 'Review'
  | 'Writing'
  | 'Practice'
  | 'Reading'
  | 'Strategy'
  | 'General'
  | string;

export interface StudyTask {
  id: string;
  title: string;
  category: CompletionCategory;
  priority: 'High' | 'Medium' | 'Low';
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  date?: string; // Target study date "YYYY-MM-DD"
  notes?: string;
  targetTopics?: string;
  order?: number;
}

export interface TestRecord {
  id: string;
  name: string;
  date: string;
  score?: string;
  totalMarks?: string;
  notes?: string;
  images: string[];
  mistakeAnalysis?: string;
  formulaReview?: string;
  createdAt: string;
}
