export type Category = 'Health' | 'Study' | 'Work' | 'Personal' | 'Social';
export type RepeatPattern = 'Daily' | 'Weekdays' | 'Weekends' | 'Custom';
export type Priority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'pending' | 'completed' | 'skipped' | 'delayed';

export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    age?: number;
    timezone: string;
    wakeTime: string; // HH:MM
    sleepTime: string; // HH:MM
    notifications: boolean;
    createdAt: string;
    currentLevel: number;
    totalXP: number;
    longestStreak: number;
    currentStreak: number;
}

export interface Routine {
    id: string;
    userId: string;
    title: string;
    category: Category;
    startTime: string; // HH:MM
    duration: number; // minutes
    repeatPattern: RepeatPattern;
    customDays?: number[]; // 0=Sun, 1=Mon...6=Sat
    reminderMinutes: number; // 5 | 10 | 15
    priority: Priority;
    notes?: string;
    points: number;
    createdAt: string;
    order: number;
}

export interface DayCompletion {
    id: string;
    routineId: string;
    userId: string;
    date: string; // YYYY-MM-DD
    status: TaskStatus;
    completedAt?: string;
    scheduledTime: string;
}

export interface HabitStat {
    routineId: string;
    userId: string;
    currentStreak: number;
    longestStreak: number;
    totalCompleted: number;
    totalScheduled: number;
    lastCompletedDate?: string;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: string;
    condition: string;
}

export interface DailyScore {
    date: string;
    userId: string;
    score: number;
    maxScore: number;
    completed: number;
    skipped: number;
    total: number;
    productive: boolean;
}

export interface AITip {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'suggestion' | 'praise';
    routineId?: string;
}

export const CATEGORY_COLORS: Record<Category, string> = {
    Health: '#22c55e',
    Study: '#3b82f6',
    Work: '#f59e0b',
    Personal: '#a855f7',
    Social: '#ec4899',
};

export const CATEGORY_BG: Record<Category, string> = {
    Health: 'rgba(34,197,94,0.15)',
    Study: 'rgba(59,130,246,0.15)',
    Work: 'rgba(245,158,11,0.15)',
    Personal: 'rgba(168,85,247,0.15)',
    Social: 'rgba(236,72,153,0.15)',
};

export const LEVEL_NAMES: Record<number, string> = {
    1: 'Beginner',
    2: 'Organized',
    3: 'Focused',
    4: 'Disciplined',
    5: 'Elite Routine Master',
};

export const XP_PER_LEVEL = [0, 0, 500, 1500, 3500, 7000];

export const DEFAULT_BADGES: Badge[] = [
    { id: 'streak7', name: '7 Day Streak', description: 'Complete routines 7 days in a row', icon: '🔥', condition: 'streak7' },
    { id: 'streak30', name: '30 Day Streak', description: 'Complete routines 30 days in a row', icon: '⚡', condition: 'streak30' },
    { id: 'early_riser', name: 'Early Riser', description: 'Complete a morning routine before 7 AM', icon: '🌅', condition: 'early_riser' },
    { id: 'fitness_champ', name: 'Fitness Champion', description: 'Complete 20 Health routines', icon: '💪', condition: 'fitness_champ' },
    { id: 'study_warrior', name: 'Study Warrior', description: 'Complete 20 Study routines', icon: '📚', condition: 'study_warrior' },
    { id: 'perfect_day', name: 'Perfect Day', description: 'Complete all routines in a single day', icon: '🌟', condition: 'perfect_day' },
    { id: 'first_routine', name: 'Getting Started', description: 'Add your first routine', icon: '🚀', condition: 'first_routine' },
    { id: 'life_architect', name: 'Life Architect', description: 'Use the Life Architect Mode', icon: '🏗️', condition: 'life_architect' },
];
