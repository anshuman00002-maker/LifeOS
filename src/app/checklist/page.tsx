'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useCallback } from 'react';
import { getRoutines, upsertCompletion, getCompletionsByDate, getTodayString, formatTime, saveUser } from '@/lib/storage';
import { isRoutineScheduledToday } from '@/lib/storage';
import { Routine, DayCompletion, CATEGORY_COLORS } from '@/lib/types';
import { calculateDayScore, getDisciplineScore, computeStreak, getLevel } from '@/lib/engine';
import { v4 as uuidv4 } from 'uuid';
import { Check, X, Clock4, Zap, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function ChecklistPage() {
    const { user, updateUser } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [completions, setCompletions] = useState<DayCompletion[]>([]);
    const today = getTodayString();

    const reload = useCallback(() => {
        if (!user) return;
        const all = getRoutines(user.id).filter(isRoutineScheduledToday);
        setRoutines(all);
        setCompletions(getCompletionsByDate(user.id, today));
    }, [user, today]);

    useEffect(() => { reload(); }, [reload]);

    const getStatus = (routineId: string): DayCompletion['status'] | null => {
        return completions.find(c => c.routineId === routineId)?.status ?? null;
    };

    const markStatus = (routine: Routine, status: DayCompletion['status']) => {
        if (!user) return;
        const existing = completions.find(c => c.routineId === routine.id);
        const comp: DayCompletion = {
            id: existing?.id ?? uuidv4(),
            routineId: routine.id,
            userId: user.id,
            date: today,
            status,
            scheduledTime: routine.startTime,
            completedAt: status === 'completed' ? new Date().toISOString() : undefined,
        };
        upsertCompletion(comp);

        // Grant XP on complete
        if (status === 'completed') {
            const xp = routine.points;
            const newXP = (user.totalXP ?? 0) + xp;
            const newLevel = getLevel(newXP);
            updateUser({ totalXP: newXP, currentLevel: newLevel });
        }
        reload();
    };

    const { score, maxScore, completed, skipped, total } = calculateDayScore(completions, routines.map(r => ({ ...r })) as Routine[]);
    const discipline = getDisciplineScore(score, maxScore);
    const progressPct = routines.length ? Math.round((completed / routines.length) * 100) : 0;

    const categorized = routines.reduce((acc, r) => {
        if (!acc[r.category]) acc[r.category] = [];
        acc[r.category].push(r);
        return acc;
    }, {} as Record<string, Routine[]>);

    return (
        <div className="animate-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Daily Checklist</h1>
                    <p className="page-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <Link href="/focus" className="btn btn-primary"><Zap size={15} /> Focus Mode</Link>
            </div>

            {/* Progress summary */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{completed}/{routines.length}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginLeft: '0.5rem' }}>tasks completed</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.84rem' }}>
                        <span style={{ color: 'var(--green)', fontWeight: 600 }}>✓ {completed} Done</span>
                        <span style={{ color: 'var(--red)', fontWeight: 600 }}>✗ {skipped} Skipped</span>
                        <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>⏳ {total - completed - skipped} Pending</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.3rem', color: discipline >= 70 ? 'var(--green)' : discipline >= 40 ? 'var(--yellow)' : 'var(--red)' }}>{discipline}%</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Discipline Score</div>
                    </div>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                    <div className="progress-fill" style={{ width: `${progressPct}%`, background: progressPct === 100 ? 'var(--green)' : 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} />
                </div>
            </div>

            {routines.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No routines scheduled for today.</p>
                    <Link href="/routines" className="btn btn-primary">+ Build Your Routine</Link>
                </div>
            ) : (
                Object.entries(categorized).map(([category, items]) => (
                    <div key={category} style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{category}</span>
                        </div>
                        {items.map(routine => {
                            const status = getStatus(routine.id);
                            return (
                                <div key={routine.id} className={`checklist-item ${status ?? 'pending'}`} style={{ borderLeftColor: CATEGORY_COLORS[routine.category as keyof typeof CATEGORY_COLORS], borderLeftWidth: 3 }}>
                                    {/* Status circle */}
                                    <div className={`check-circle ${status === 'completed' ? 'done' : ''}`}
                                        style={{ borderColor: status === 'completed' ? 'var(--green)' : status === 'skipped' ? 'var(--red)' : status === 'delayed' ? 'var(--blue)' : 'var(--border)' }}
                                        onClick={() => markStatus(routine, status === 'completed' ? 'pending' : 'completed')}>
                                        {status === 'completed' && <Check size={14} color="white" />}
                                        {status === 'skipped' && <X size={12} color="var(--red)" />}
                                        {status === 'delayed' && <Clock4 size={12} color="var(--blue)" />}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.92rem', textDecoration: status === 'skipped' ? 'line-through' : 'none', opacity: status === 'skipped' ? 0.6 : 1 }}>{routine.title}</span>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-light)', background: 'rgba(124,58,237,0.12)', padding: '1px 6px', borderRadius: 99 }}>+{routine.points}pts</span>
                                        </div>
                                        <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                            <Clock4 size={11} style={{ display: 'inline', marginRight: 3 }} />
                                            {formatTime(routine.startTime)} · {routine.duration}min
                                            {routine.notes && <span style={{ marginLeft: '0.75rem' }}>📝 {routine.notes}</span>}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                                        <button
                                            className="btn btn-sm"
                                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', background: status === 'completed' ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.08)', color: 'var(--green)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6 }}
                                            onClick={() => markStatus(routine, 'completed')}>
                                            Done
                                        </button>
                                        <button
                                            className="btn btn-sm"
                                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', background: 'rgba(245,158,11,0.08)', color: 'var(--yellow)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 6 }}
                                            onClick={() => markStatus(routine, 'delayed')}>
                                            Delay
                                        </button>
                                        <button
                                            className="btn btn-sm"
                                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', background: 'rgba(239,68,68,0.08)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6 }}
                                            onClick={() => markStatus(routine, 'skipped')}>
                                            Skip
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))
            )}
        </div>
    );
}
