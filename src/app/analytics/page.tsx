'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getCompletions, getRoutines } from '@/lib/storage';
import { getWeeklyStats, getMonthlyStats, getYearlyHeatmap, calculateDayScore, getDisciplineScore } from '@/lib/engine';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { BarChart2, TrendingUp, Calendar, AlertTriangle } from 'lucide-react';

const Tip = ({ active, payload, label }: any) => active && payload?.length ? (
    <div className="custom-tooltip" style={{ padding: '8px 12px' }}>
        <strong>{label}</strong>
        {payload.map((p: any) => <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}{p.name === 'score' || p.name === 'rate' ? '%' : ''}</p>)}
    </div>
) : null;

export default function AnalyticsPage() {
    const { user } = useAuth();
    const [weekly, setWeekly] = useState<any[]>([]);
    const [monthly, setMonthly] = useState<any[]>([]);
    const [heatmap, setHeatmap] = useState<{ date: string; score: number }[]>([]);
    const [skipped, setSkipped] = useState<{ title: string; count: number }[]>([]);

    useEffect(() => {
        if (!user) return;
        setWeekly(getWeeklyStats(user.id));
        setMonthly(getMonthlyStats(user.id));
        setHeatmap(getYearlyHeatmap(user.id));

        const completions = getCompletions(user.id);
        const routines = getRoutines(user.id);
        const counts: Record<string, number> = {};
        completions.filter(c => c.status === 'skipped').forEach(c => {
            const r = routines.find(x => x.id === c.routineId);
            if (r) counts[r.title] = (counts[r.title] ?? 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([title, count]) => ({ title, count }));
        setSkipped(sorted);
    }, [user]);

    const heatColor = (score: number) => {
        if (score === 0) return 'rgba(255,255,255,0.05)';
        if (score >= 70) return 'rgba(34,197,94,0.8)';
        if (score >= 40) return 'rgba(245,158,11,0.7)';
        return 'rgba(239,68,68,0.6)';
    };

    const avgScore = weekly.length ? Math.round(weekly.reduce((s, d) => s + d.score, 0) / weekly.length) : 0;

    return (
        <div className="animate-in">
            <div className="page-header">
                <h1 className="page-title">Analytics Dashboard</h1>
                <p className="page-subtitle">Deep insights into your productivity patterns</p>
            </div>

            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.15)' }}><BarChart2 size={20} style={{ color: 'var(--accent-light)' }} /></div>
                    <div className="stat-value">{avgScore}%</div>
                    <div className="stat-label">Avg Weekly Score</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}><TrendingUp size={20} style={{ color: 'var(--green)' }} /></div>
                    <div className="stat-value">{weekly.reduce((s, d) => s + d.completed, 0)}</div>
                    <div className="stat-label">Tasks This Week</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><Calendar size={20} style={{ color: 'var(--yellow)' }} /></div>
                    <div className="stat-value">{monthly[monthly.length - 1]?.rate ?? 0}%</div>
                    <div className="stat-label">This Week Rate</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><AlertTriangle size={20} style={{ color: 'var(--red)' }} /></div>
                    <div className="stat-value">{skipped[0]?.count ?? 0}</div>
                    <div className="stat-label">Most Skips</div>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                {/* Weekly bar chart */}
                <div className="card">
                    <div className="section-title"><BarChart2 size={16} style={{ color: 'var(--accent-light)' }} /> Weekly Productivity</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weekly} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                            <Tooltip content={<Tip />} />
                            <Bar dataKey="score" name="score" radius={[5, 5, 0, 0]}>
                                {weekly.map((e, i) => <Cell key={i} fill={e.score >= 70 ? '#22c55e' : e.score >= 40 ? '#f59e0b' : 'rgba(124,58,237,0.7)'} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Monthly line chart */}
                <div className="card">
                    <div className="section-title"><TrendingUp size={16} style={{ color: 'var(--blue)' }} /> Monthly Trend</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={monthly} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                            <Tooltip content={<Tip />} />
                            <Line dataKey="rate" name="rate" stroke="var(--blue)" strokeWidth={2.5} dot={{ fill: 'var(--blue)', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Most skipped */}
            {skipped.length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <div className="section-title"><AlertTriangle size={16} style={{ color: 'var(--red)' }} /> Most Skipped Routines</div>
                    {skipped.map(({ title, count }) => (
                        <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 600 }}>{title}</span>
                            <div className="progress-bar" style={{ width: 120 }}>
                                <div className="progress-fill" style={{ width: `${Math.min((count / (skipped[0]?.count || 1)) * 100, 100)}%`, background: 'var(--red)' }} />
                            </div>
                            <span style={{ fontSize: '0.82rem', color: 'var(--red)', fontWeight: 700, width: 40, textAlign: 'right' }}>{count}×</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Yearly heatmap */}
            <div className="card">
                <div className="section-title"><Calendar size={16} style={{ color: 'var(--green)' }} /> Yearly Activity Heatmap</div>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
                    {[['var(--green)', '≥70% (Productive)'], ['var(--yellow)', '40-69% (Average)'], ['var(--red)', '<40% (Unproductive)'], ['rgba(255,255,255,0.05)', 'No data']].map(([c, l]) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l}</span>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '100%' }}>
                    {heatmap.map(({ date, score }) => (
                        <div
                            key={date}
                            title={`${date}: ${score}%`}
                            className="heatmap-cell"
                            style={{ background: heatColor(score) }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
