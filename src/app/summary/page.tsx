'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getRoutines, getCompletionsByDate, getTodayString } from '@/lib/storage';
import { calculateDayScore, getDisciplineScore } from '@/lib/engine';
import { Routine, DayCompletion, CATEGORY_COLORS } from '@/lib/types';
import { FileText, CheckCircle, XCircle, Clock, Star } from 'lucide-react';

export default function SummaryPage() {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [completions, setCompletions] = useState<DayCompletion[]>([]);

    useEffect(() => {
        if (!user) return;
        const today = getTodayString();
        const r = getRoutines(user.id);
        const c = getCompletionsByDate(user.id, today);
        setRoutines(r);
        setCompletions(c);
    }, [user]);

    const { score, maxScore, completed, skipped, total } = calculateDayScore(completions, routines);
    const discipline = getDisciplineScore(score, maxScore);
    const pending = total - completed - skipped;
    const xpEarned = completions.filter(c => c.status === 'completed').reduce((s, c) => {
        const r = routines.find(x => x.id === c.routineId);
        return s + (r?.points ?? 0);
    }, 0);

    const getStatus = (routineId: string) => completions.find(c => c.routineId === routineId)?.status ?? 'pending';

    const grade = discipline >= 90 ? { label: 'Excellent', color: 'var(--green)', emoji: '🏆' }
        : discipline >= 70 ? { label: 'Good', color: 'var(--green)', emoji: '⭐' }
            : discipline >= 50 ? { label: 'Average', color: 'var(--yellow)', emoji: '📊' }
                : { label: 'Needs Work', color: 'var(--red)', emoji: '💪' };

    return (
        <div className="animate-in">
            <div className="page-header">
                <h1 className="page-title">Daily Summary</h1>
                <p className="page-subtitle">Your performance report for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Report card */}
            <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(37,99,235,0.08))', border: '1px solid rgba(124,58,237,0.3)', textAlign: 'center', padding: '2.5rem' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '0.75rem' }}>{grade.emoji}</div>
                <div style={{ fontSize: '3.5rem', fontWeight: 900, color: grade.color, marginBottom: '0.25rem' }}>{discipline}%</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: grade.color, marginBottom: '0.75rem' }}>{grade.label}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
                    Today you completed <strong style={{ color: 'var(--green)' }}>{completed}</strong> out of <strong>{routines.length}</strong> routines.
                    {skipped > 0 && <> You skipped <strong style={{ color: 'var(--red)' }}>{skipped}</strong> task{skipped > 1 ? 's' : ''}.</>}
                </p>
            </div>

            {/* Stats row */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}><CheckCircle size={20} style={{ color: 'var(--green)' }} /></div>
                    <div className="stat-value" style={{ color: 'var(--green)' }}>{completed}</div>
                    <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><XCircle size={20} style={{ color: 'var(--red)' }} /></div>
                    <div className="stat-value" style={{ color: 'var(--red)' }}>{skipped}</div>
                    <div className="stat-label">Skipped</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><Clock size={20} style={{ color: 'var(--yellow)' }} /></div>
                    <div className="stat-value" style={{ color: 'var(--yellow)' }}>{pending}</div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.15)' }}><Star size={20} style={{ color: 'var(--accent-light)' }} /></div>
                    <div className="stat-value" style={{ color: 'var(--accent-light)' }}>+{xpEarned}</div>
                    <div className="stat-label">XP Earned</div>
                </div>
            </div>

            {/* Detailed breakdown */}
            <div className="card">
                <div className="section-title"><FileText size={16} style={{ color: 'var(--accent-light)' }} /> Task Breakdown</div>
                {routines.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No routines scheduled.</p>
                ) : routines.map(r => {
                    const status = getStatus(r.id);
                    const statusColor = status === 'completed' ? 'var(--green)' : status === 'skipped' ? 'var(--red)' : 'var(--yellow)';
                    const statusLabel = status === 'completed' ? '✓ Done' : status === 'skipped' ? '✗ Skipped' : '⏳ Pending';
                    return (
                        <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[r.category], flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: 600, fontSize: '0.9rem', textDecoration: status === 'skipped' ? 'line-through' : 'none', opacity: status === 'skipped' ? 0.6 : 1 }}>{r.title}</span>
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.73rem', color: 'var(--text-muted)' }}>{r.category}</span>
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: statusColor }}>{statusLabel}</span>
                            {status === 'completed' && <span style={{ fontSize: '0.77rem', color: 'var(--accent-light)', fontWeight: 600 }}>+{r.points}pts</span>}
                        </div>
                    );
                })}
            </div>

            {/* Motivational message */}
            <div className="card" style={{ marginTop: '1.25rem', background: discipline >= 70 ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${discipline >= 70 ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`, textAlign: 'center', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {discipline >= 80 ? '🔥 Outstanding! You\'re building elite habits. Keep this momentum going!' :
                        discipline >= 60 ? '💪 Solid day! A little more consistency will take you to the next level.' :
                            '⚡ Every day is a chance to improve. Tomorrow, focus on just one more task than today.'}
                </p>
            </div>
        </div>
    );
}
