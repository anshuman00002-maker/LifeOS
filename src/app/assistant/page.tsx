'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { generateAITips } from '@/lib/engine';
import { getCompletions, getRoutines } from '@/lib/storage';
import { AITip, CATEGORY_COLORS } from '@/lib/types';
import { BrainCircuit, RefreshCw, Lightbulb, AlertTriangle, Info, Star } from 'lucide-react';

const TIP_ICONS: Record<string, React.ReactNode> = {
    info: <Info size={18} style={{ color: 'var(--blue)' }} />,
    warning: <AlertTriangle size={18} style={{ color: 'var(--yellow)' }} />,
    suggestion: <Lightbulb size={18} style={{ color: 'var(--purple)' }} />,
    praise: <Star size={18} style={{ color: 'var(--green)' }} />,
};

export default function AssistantPage() {
    const { user } = useAuth();
    const [tips, setTips] = useState<AITip[]>([]);
    const [stats, setStats] = useState({ totalDone: 0, totalSkipped: 0, topCategory: '', peakHour: '' });

    const refresh = () => {
        if (!user) return;
        setTips(generateAITips(user.id));

        const completions = getCompletions(user.id);
        const routines = getRoutines(user.id);

        const done = completions.filter(c => c.status === 'completed').length;
        const skipped = completions.filter(c => c.status === 'skipped').length;

        // Top category
        const catCounts: Record<string, number> = {};
        completions.filter(c => c.status === 'completed').forEach(c => {
            const r = routines.find(x => x.id === c.routineId);
            if (r) catCounts[r.category] = (catCounts[r.category] ?? 0) + 1;
        });
        const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

        // Peak hour
        const hourCounts: Record<number, number> = {};
        completions.filter(c => c.status === 'completed' && c.completedAt).forEach(c => {
            const h = new Date(c.completedAt!).getHours();
            hourCounts[h] = (hourCounts[h] ?? 0) + 1;
        });
        const peakH = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0];
        const peakLabel = peakH !== undefined ? (Number(peakH) < 12 ? `${peakH} AM` : Number(peakH) === 12 ? '12 PM' : `${Number(peakH) - 12} PM`) : '—';

        setStats({ totalDone: done, totalSkipped: skipped, topCategory: topCat, peakHour: peakLabel });
    };

    useEffect(() => { refresh(); }, [user]);

    const generalInsights = [
        { label: 'Tasks Completed', value: stats.totalDone.toString(), color: 'var(--green)', icon: '✅' },
        { label: 'Tasks Skipped', value: stats.totalSkipped.toString(), color: 'var(--red)', icon: '❌' },
        { label: 'Strongest Category', value: stats.topCategory || '—', color: 'var(--accent-light)', icon: '🏆' },
        { label: 'Peak Hour', value: stats.peakHour, color: 'var(--yellow)', icon: '⏰' },
    ];

    return (
        <div className="animate-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">AI Assistant</h1>
                    <p className="page-subtitle">Behavioral analysis and personalized coaching</p>
                </div>
                <button className="btn btn-ghost" onClick={refresh}><RefreshCw size={15} /> Refresh</button>
            </div>

            {/* AI Avatar banner */}
            <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.08))', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0, boxShadow: '0 0 25px var(--accent-glow)', animation: 'pulse-glow 2s infinite' }}>
                    🧠
                </div>
                <div>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.3rem' }}>LifeOS AI Coach</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem' }}>
                        I analyze your behavioral patterns and generate personalized insights to help you optimize your routine. The more you track, the smarter I get.
                    </p>
                </div>
            </div>

            {/* Quick stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {generalInsights.map(({ label, value, color, icon }) => (
                    <div key={label} className="stat-card">
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
                        <div className="stat-value" style={{ color, fontSize: '1.4rem' }}>{value}</div>
                        <div className="stat-label">{label}</div>
                    </div>
                ))}
            </div>

            {/* Tips */}
            <div className="card">
                <div className="section-title"><BrainCircuit size={16} style={{ color: 'var(--accent-light)' }} /> Personalized Insights</div>
                {tips.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📊</div>
                        <p style={{ fontSize: '0.88rem' }}>No data yet. Complete some routines and I'll analyze your patterns!</p>
                    </div>
                ) : tips.map(tip => (
                    <div key={tip.id} className={`tip-card tip-${tip.type}`} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ flexShrink: 0, marginTop: 1 }}>{TIP_ICONS[tip.type]}</div>
                        <div>
                            <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>{tip.message}</p>
                            {tip.routineId && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Related to a routine in your schedule</p>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Coaching tips */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="section-title">💡 General Coaching Tips</div>
                {[
                    'Start with small, manageable routines. Consistency over intensity.',
                    'Block your calendar for deep work during your peak productivity hours.',
                    "Don't aim for perfection — 80% completion consistently beats 100% occasionally.",
                    'Habit stacking: pair a new habit with an existing one to make it stick.',
                    'Review and adjust your routines every Sunday to stay aligned with your goals.',
                ].map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--accent-light)', fontWeight: 700, flexShrink: 0 }}>0{i + 1}</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
