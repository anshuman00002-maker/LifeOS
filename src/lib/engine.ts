import { DayCompletion, Routine, HabitStat, AITip } from './types';
import { getCompletions, getRoutines, getHabitStats } from './storage';

// ── SCORING ────────────────────────────────────────────────────────────────
export function calculateDayScore(completions: DayCompletion[], routines: Routine[]): {
    score: number; maxScore: number; completed: number; skipped: number; total: number;
} {
    let score = 0;
    let maxScore = 0;
    let completed = 0;
    let skipped = 0;

    for (const comp of completions) {
        const routine = routines.find(r => r.id === comp.routineId);
        if (!routine) continue;
        maxScore += routine.points;
        if (comp.status === 'completed') { score += routine.points; completed++; }
        else if (comp.status === 'skipped') { score = Math.max(0, score - 5); skipped++; }
    }

    return { score, maxScore: Math.max(maxScore, 100), completed, skipped, total: completions.length };
}

export function getDisciplineScore(score: number, maxScore: number): number {
    if (maxScore === 0) return 0;
    return Math.round((score / maxScore) * 100);
}

export function getCategoryPoints(category: string): number {
    const map: Record<string, number> = {
        Health: 20, Study: 15, Work: 15, Personal: 10, Social: 10,
    };
    return map[category] ?? 10;
}

// ── HABIT STREAK ───────────────────────────────────────────────────────────
export function computeStreak(routineId: string, completions: DayCompletion[]): number {
    const sorted = completions
        .filter(c => c.routineId === routineId && c.status === 'completed')
        .map(c => c.date)
        .sort()
        .reverse();

    if (!sorted.length) return 0;

    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    for (const dateStr of sorted) {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        const diff = Math.round((cursor.getTime() - d.getTime()) / 86400000);
        if (diff > 1) break;
        streak++;
        cursor = d;
    }
    return streak;
}

// ── XP & LEVELS ────────────────────────────────────────────────────────────
export function getLevel(totalXP: number): number {
    if (totalXP >= 7000) return 5;
    if (totalXP >= 3500) return 4;
    if (totalXP >= 1500) return 3;
    if (totalXP >= 500) return 2;
    return 1;
}

export function getXPForLevel(level: number): number {
    const thresholds = [0, 0, 500, 1500, 3500, 7000];
    return thresholds[level] ?? 0;
}

export function getLevelProgress(totalXP: number): number {
    const level = getLevel(totalXP);
    if (level >= 5) return 100;
    const current = getXPForLevel(level);
    const next = getXPForLevel(level + 1);
    return Math.round(((totalXP - current) / (next - current)) * 100);
}

// ── AI ENGINE ──────────────────────────────────────────────────────────────
export function generateAITips(userId: string): AITip[] {
    const tips: AITip[] = [];
    const completions = getCompletions(userId);
    const routines = getRoutines(userId);
    const stats = getHabitStats(userId);

    if (!routines.length) {
        tips.push({ id: 'no_routines', message: 'Start by adding your first daily routine to begin tracking your progress!', type: 'suggestion' });
        return tips;
    }

    // Find habitually skipped routines
    for (const routine of routines) {
        const routineCompletions = completions.filter(c => c.routineId === routine.id);
        const skipped = routineCompletions.filter(c => c.status === 'skipped').length;
        const total = routineCompletions.length;
        if (total >= 3 && skipped / total > 0.5) {
            tips.push({
                id: `skip_${routine.id}`,
                message: `You frequently skip "${routine.title}". Consider adjusting its time or duration to make it more achievable.`,
                type: 'warning',
                routineId: routine.id,
            });
        }
    }

    // Find peak productivity hour
    const completedByHour: Record<number, number> = {};
    for (const c of completions.filter(c => c.status === 'completed')) {
        if (c.completedAt) {
            const hour = new Date(c.completedAt).getHours();
            completedByHour[hour] = (completedByHour[hour] ?? 0) + 1;
        }
    }
    const peakHour = Object.entries(completedByHour).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
    if (peakHour) {
        const h = Number(peakHour[0]);
        const label = h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        tips.push({ id: 'peak_hour', message: `You're most productive around ${label}. Schedule your most important tasks during this time!`, type: 'info' });
    }

    // Praise strong streaks
    const topStat = [...stats].sort((a, b) => b.currentStreak - a.currentStreak)[0];
    if (topStat && topStat.currentStreak >= 3) {
        const r = routines.find(x => x.id === topStat.routineId);
        if (r) {
            tips.push({ id: `praise_${r.id}`, message: `🔥 You're on a ${topStat.currentStreak}-day streak with "${r.title}". Keep it up!`, type: 'praise' });
        }
    }

    // Generic tips if few specific ones
    if (tips.length < 2) {
        tips.push({ id: 'gen1', message: 'Consistency beats perfection. Even completing 80% of your routines builds strong habits over time.', type: 'info' });
        tips.push({ id: 'gen2', message: 'Try scheduling your hardest tasks at the beginning of your day when willpower is highest.', type: 'suggestion' });
    }

    return tips.slice(0, 4);
}

// ── LIFE ARCHITECT ─────────────────────────────────────────────────────────
export interface ArchitectGoal {
    id: string;
    title: string;
    description: string;
    icon: string;
    suggestedRoutines: Omit<Routine, 'id' | 'userId' | 'createdAt' | 'order'>[];
}

export const ARCHITECT_GOALS: ArchitectGoal[] = [
    {
        id: 'fit',
        title: 'Become Fit',
        description: 'Build a strong, healthy body through consistent exercise',
        icon: '💪',
        suggestedRoutines: [
            { title: 'Morning Workout', category: 'Health', startTime: '07:00', duration: 45, repeatPattern: 'Daily', reminderMinutes: 10, priority: 'High', points: 20 },
            { title: 'Evening Walk', category: 'Health', startTime: '18:00', duration: 30, repeatPattern: 'Daily', reminderMinutes: 5, priority: 'Medium', points: 15 },
            { title: 'Stretching', category: 'Health', startTime: '22:00', duration: 15, repeatPattern: 'Daily', reminderMinutes: 5, priority: 'Low', points: 10 },
        ],
    },
    {
        id: 'reader',
        title: 'Become a Reader',
        description: 'Develop a daily reading habit and expand your knowledge',
        icon: '📚',
        suggestedRoutines: [
            { title: 'Morning Reading', category: 'Study', startTime: '08:00', duration: 20, repeatPattern: 'Daily', reminderMinutes: 5, priority: 'Medium', points: 15 },
            { title: 'Evening Reading', category: 'Study', startTime: '21:00', duration: 30, repeatPattern: 'Daily', reminderMinutes: 10, priority: 'High', points: 15 },
        ],
    },
    {
        id: 'productive',
        title: 'Become More Productive',
        description: 'Master deep work and time management',
        icon: '🚀',
        suggestedRoutines: [
            { title: 'Deep Work Session', category: 'Work', startTime: '09:00', duration: 90, repeatPattern: 'Weekdays', reminderMinutes: 10, priority: 'High', points: 20 },
            { title: 'Email & Comms', category: 'Work', startTime: '11:30', duration: 30, repeatPattern: 'Weekdays', reminderMinutes: 5, priority: 'Medium', points: 10 },
            { title: 'Daily Planning', category: 'Personal', startTime: '08:00', duration: 15, repeatPattern: 'Daily', reminderMinutes: 5, priority: 'High', points: 10 },
            { title: 'Weekly Review', category: 'Personal', startTime: '17:00', duration: 30, repeatPattern: 'Weekends', reminderMinutes: 15, priority: 'Medium', points: 15 },
        ],
    },
    {
        id: 'early_riser',
        title: 'Wake Up Early',
        description: 'Own the morning with a powerful early routine',
        icon: '🌅',
        suggestedRoutines: [
            { title: 'Wake Up', category: 'Personal', startTime: '05:30', duration: 5, repeatPattern: 'Daily', reminderMinutes: 0, priority: 'High', points: 10 },
            { title: 'Morning Meditation', category: 'Health', startTime: '05:35', duration: 10, repeatPattern: 'Daily', reminderMinutes: 0, priority: 'High', points: 10 },
            { title: 'Morning Journaling', category: 'Personal', startTime: '07:00', duration: 15, repeatPattern: 'Daily', reminderMinutes: 5, priority: 'Medium', points: 10 },
        ],
    },
    {
        id: 'mindful',
        title: 'Improve Mental Health',
        description: 'Build calm, clarity and emotional resilience',
        icon: '🧘',
        suggestedRoutines: [
            { title: 'Meditation', category: 'Health', startTime: '07:00', duration: 15, repeatPattern: 'Daily', reminderMinutes: 5, priority: 'High', points: 10 },
            { title: 'Gratitude Journal', category: 'Personal', startTime: '21:00', duration: 10, repeatPattern: 'Daily', reminderMinutes: 5, priority: 'Medium', points: 10 },
            { title: 'Digital Detox Hour', category: 'Personal', startTime: '20:00', duration: 60, repeatPattern: 'Daily', reminderMinutes: 10, priority: 'Medium', points: 10 },
        ],
    },
];

// ── WEEKLY STATS ───────────────────────────────────────────────────────────
export function getWeeklyStats(userId: string): { day: string; completed: number; skipped: number; score: number }[] {
    const completions = getCompletions(userId);
    const routines = getRoutines(userId);
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        const dayComps = completions.filter(c => c.date === dateStr);
        const { score, maxScore, completed, skipped } = calculateDayScore(dayComps, routines);
        result.push({ day: dayName, completed, skipped, score: getDisciplineScore(score, maxScore) });
    }
    return result;
}

export function getMonthlyStats(userId: string): { week: string; rate: number }[] {
    const completions = getCompletions(userId);
    const result = [];
    for (let w = 3; w >= 0; w--) {
        let completed = 0; let total = 0;
        for (let d = 6; d >= 0; d--) {
            const date = new Date();
            date.setDate(date.getDate() - w * 7 - d);
            const dateStr = date.toISOString().slice(0, 10);
            const dayComps = completions.filter(c => c.date === dateStr);
            completed += dayComps.filter(c => c.status === 'completed').length;
            total += dayComps.length;
        }
        result.push({ week: `${4 - w}W ago`, rate: total ? Math.round((completed / total) * 100) : 0 });
    }
    return result;
}

export function getYearlyHeatmap(userId: string): { date: string; score: number }[] {
    const completions = getCompletions(userId);
    const routines = getRoutines(userId);
    const result = [];
    for (let i = 364; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayComps = completions.filter(c => c.date === dateStr);
        const { score, maxScore } = calculateDayScore(dayComps, routines);
        result.push({ date: dateStr, score: getDisciplineScore(score, maxScore) });
    }
    return result;
}
