'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getRoutines, getCompletions, getHabitStats, getHabitStat, getTodayString } from '@/lib/storage';
import { Routine, HabitStat, CATEGORY_COLORS } from '@/lib/types';
import { computeStreak } from '@/lib/engine';
import { Flame, Target, TrendingUp, Award } from 'lucide-react';

const DAYS_BACK = 21; // 3 weeks grid

export default function HabitsPage() {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [stats, setStats] = useState<Record<string, HabitStat>>({});
    const [dateGrid, setDateGrid] = useState<string[]>([]);

    useEffect(() => {
        if (!user) return;
        const r = getRoutines(user.id);
        setRoutines(r);
        const allCompletions = getCompletions(user.id);
        const statsMap: Record<string, HabitStat> = {};
        r.forEach(routine => {
            const routineComps = allCompletions.filter(c => c.routineId === routine.id);
            const streak = computeStreak(routine.id, routineComps);
            const completed = routineComps.filter(c => c.status === 'completed').length;
            const last = routineComps.filter(c => c.status === 'completed').sort((a, b) => b.date.localeCompare(a.date))[0];
            statsMap[routine.id] = {
                routineId: routine.id, userId: user.id,
                currentStreak: streak,
                longestStreak: Math.max(streak, getHabitStat(user.id, routine.id).longestStreak ?? 0),
                totalCompleted: completed,
                totalScheduled: routineComps.length,
                lastCompletedDate: last?.date,
            };
        });
        setStats(statsMap);

        const dates: string[] = [];
        for (let i = DAYS_BACK - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().slice(0, 10));
        }
        setDateGrid(dates);
    }, [user]);

    const getCompletionForDate = (routineId: string, date: string) => {
        return getCompletions(user?.id ?? '').find(c => c.routineId === routineId && c.date === date);
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <h1 className="page-title">Habit Tracker</h1>
                <p className="page-subtitle">Track your consistency and build lasting habits</p>
            </div>

            {routines.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
                    <p style={{ color: 'var(--text-secondary)' }}>Add routines to start tracking habits</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {routines.map(routine => {
                        const stat = stats[routine.id];
                        const rate = stat?.totalScheduled ? Math.round((stat.totalCompleted / stat.totalScheduled) * 100) : 0;
                        const color = CATEGORY_COLORS[routine.category];

                        return (
                            <div key={routine.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                                            <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{routine.title}</h3>
                                            <span style={{ fontSize: '0.72rem', background: `${color}22`, color, padding: '2px 8px', borderRadius: 99, border: `1px solid ${color}44`, fontWeight: 600 }}>{routine.category}</span>
                                        </div>
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Last: {stat?.lastCompletedDate ?? 'Never'}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center' }}>
                                                <Flame size={14} style={{ color: 'var(--yellow)' }} />
                                                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--yellow)' }}>{stat?.currentStreak ?? 0}</span>
                                            </div>
                                            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Streak</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{rate}%</div>
                                            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Rate</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-light)' }}>{stat?.totalCompleted ?? 0}</div>
                                            <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>Total</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Completion rate bar */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                        <span style={{ fontSize: '0.77rem', color: 'var(--text-secondary)' }}>Completion Rate</span>
                                        <span style={{ fontSize: '0.77rem', fontWeight: 600, color }}>{rate}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{ width: `${rate}%`, background: color }} />
                                    </div>
                                </div>

                                {/* 21-day grid */}
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Last 21 days</div>
                                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                                        {dateGrid.map(date => {
                                            const comp = getCompletionForDate(routine.id, date);
                                            let bg = 'rgba(255,255,255,0.06)';
                                            if (comp?.status === 'completed') bg = color;
                                            else if (comp?.status === 'skipped') bg = 'rgba(239,68,68,0.5)';
                                            else if (comp?.status === 'delayed') bg = 'rgba(59,130,246,0.4)';
                                            return (
                                                <div key={date} title={`${date}: ${comp?.status ?? 'no data'}`}
                                                    style={{ width: 16, height: 16, borderRadius: 3, background: bg, transition: 'transform 0.15s', cursor: 'help' }}
                                                    onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                                                    onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')} />
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
