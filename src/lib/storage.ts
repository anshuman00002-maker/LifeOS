import { User, Routine, DayCompletion, HabitStat, DailyScore, Badge, DEFAULT_BADGES } from './types';

const KEYS = {
    USERS: 'rma_users',
    CURRENT_USER: 'rma_current_user',
    ROUTINES: 'rma_routines',
    COMPLETIONS: 'rma_completions',
    HABIT_STATS: 'rma_habit_stats',
    DAILY_SCORES: 'rma_daily_scores',
    BADGES: 'rma_badges',
    NOTIFICATIONS_SEEN: 'rma_notif_seen',
};

const isClient = typeof window !== 'undefined';

function get<T>(key: string): T[] {
    if (!isClient) return [];
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch { return []; }
}

function set<T>(key: string, data: T[]): void {
    if (!isClient) return;
    localStorage.setItem(key, JSON.stringify(data));
}

// ── USERS ──────────────────────────────────────────────────────────────────
export function getUsers(): User[] { return get<User>(KEYS.USERS); }
export function saveUser(user: User): void {
    const users = getUsers().filter(u => u.id !== user.id);
    set(KEYS.USERS, [...users, user]);
}
export function getUserByEmail(email: string): User | undefined {
    return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

// ── SESSION ────────────────────────────────────────────────────────────────
export function getCurrentUser(): User | null {
    if (!isClient) return null;
    const id = localStorage.getItem(KEYS.CURRENT_USER);
    if (!id) return null;
    return getUsers().find(u => u.id === id) ?? null;
}
export function setCurrentUser(userId: string | null): void {
    if (!isClient) return;
    if (userId) localStorage.setItem(KEYS.CURRENT_USER, userId);
    else localStorage.removeItem(KEYS.CURRENT_USER);
}

// ── ROUTINES ───────────────────────────────────────────────────────────────
export function getRoutines(userId: string): Routine[] {
    return get<Routine>(KEYS.ROUTINES)
        .filter(r => r.userId === userId)
        .sort((a, b) => a.order - b.order);
}
export function saveRoutine(routine: Routine): void {
    const all = get<Routine>(KEYS.ROUTINES).filter(r => r.id !== routine.id);
    set(KEYS.ROUTINES, [...all, routine]);
}
export function deleteRoutine(routineId: string): void {
    set(KEYS.ROUTINES, get<Routine>(KEYS.ROUTINES).filter(r => r.id !== routineId));
}
export function updateRoutineOrder(routines: Routine[]): void {
    const all = get<Routine>(KEYS.ROUTINES);
    const ids = routines.map(r => r.id);
    const others = all.filter(r => !ids.includes(r.id));
    set(KEYS.ROUTINES, [...others, ...routines]);
}

// ── COMPLETIONS ────────────────────────────────────────────────────────────
export function getCompletions(userId: string): DayCompletion[] {
    return get<DayCompletion>(KEYS.COMPLETIONS).filter(c => c.userId === userId);
}
export function getCompletionsByDate(userId: string, date: string): DayCompletion[] {
    return getCompletions(userId).filter(c => c.date === date);
}
export function saveCompletion(completion: DayCompletion): void {
    const all = get<DayCompletion>(KEYS.COMPLETIONS).filter(c => c.id !== completion.id);
    set(KEYS.COMPLETIONS, [...all, completion]);
}
export function upsertCompletion(completion: DayCompletion): void {
    const key = `${completion.routineId}_${completion.date}`;
    const all = get<DayCompletion>(KEYS.COMPLETIONS);
    const existing = all.find(c => `${c.routineId}_${c.date}` === key);
    if (existing) {
        set(KEYS.COMPLETIONS, all.map(c => (`${c.routineId}_${c.date}` === key ? completion : c)));
    } else {
        set(KEYS.COMPLETIONS, [...all, completion]);
    }
}

// ── HABIT STATS ────────────────────────────────────────────────────────────
export function getHabitStats(userId: string): HabitStat[] {
    return get<HabitStat>(KEYS.HABIT_STATS).filter(h => h.userId === userId);
}
export function saveHabitStat(stat: HabitStat): void {
    const all = get<HabitStat>(KEYS.HABIT_STATS).filter(
        h => !(h.routineId === stat.routineId && h.userId === stat.userId)
    );
    set(KEYS.HABIT_STATS, [...all, stat]);
}
export function getHabitStat(userId: string, routineId: string): HabitStat {
    return getHabitStats(userId).find(h => h.routineId === routineId) ?? {
        routineId, userId, currentStreak: 0, longestStreak: 0,
        totalCompleted: 0, totalScheduled: 0,
    };
}

// ── DAILY SCORES ───────────────────────────────────────────────────────────
export function getDailyScores(userId: string): DailyScore[] {
    return get<DailyScore>(KEYS.DAILY_SCORES).filter(d => d.userId === userId);
}
export function saveDailyScore(score: DailyScore): void {
    const all = get<DailyScore>(KEYS.DAILY_SCORES).filter(
        d => !(d.date === score.date && d.userId === score.userId)
    );
    set(KEYS.DAILY_SCORES, [...all, score]);
}
export function getDailyScore(userId: string, date: string): DailyScore | undefined {
    return getDailyScores(userId).find(d => d.date === date);
}

// ── BADGES ─────────────────────────────────────────────────────────────────
export function getBadges(userId: string): Badge[] {
    const stored = get<{ userId: string; badges: Badge[] }>(KEYS.BADGES)
        .find(b => b.userId === userId);
    return stored?.badges ?? DEFAULT_BADGES.map(b => ({ ...b }));
}
export function saveBadges(userId: string, badges: Badge[]): void {
    const all = get<{ userId: string; badges: Badge[] }>(KEYS.BADGES)
        .filter(b => b.userId !== userId);
    set(KEYS.BADGES, [...all, { userId, badges }]);
}

// ── UTILS ──────────────────────────────────────────────────────────────────
export function getTodayString(): string {
    return new Date().toISOString().slice(0, 10);
}
export function formatTime(hhmm: string): string {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}
export function isRoutineScheduledToday(routine: Routine): boolean {
    const day = new Date().getDay();
    switch (routine.repeatPattern) {
        case 'Daily': return true;
        case 'Weekdays': return day >= 1 && day <= 5;
        case 'Weekends': return day === 0 || day === 6;
        case 'Custom': return routine.customDays?.includes(day) ?? false;
        default: return true;
    }
}
