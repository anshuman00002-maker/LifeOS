'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getYearlyHeatmap } from '@/lib/engine';
import { Map, TrendingUp, Star } from 'lucide-react';

export default function TimelinePage() {
    const { user } = useAuth();
    const [heatmap, setHeatmap] = useState<{ date: string; score: number }[]>([]);

    useEffect(() => {
        if (user) setHeatmap(getYearlyHeatmap(user.id));
    }, [user]);

    const heatColor = (score: number) => {
        if (score === 0) return 'rgba(255,255,255,0.05)';
        if (score >= 70) return '#22c55e';
        if (score >= 40) return '#f59e0b';
        return '#ef4444';
    };

    const productiveDays = heatmap.filter(d => d.score >= 70).length;
    const avgDays = heatmap.filter(d => d.score >= 40 && d.score < 70).length;
    const unproductiveDays = heatmap.filter(d => d.score > 0 && d.score < 40).length;
    const activeDays = heatmap.filter(d => d.score > 0).length;
    const avgScore = activeDays ? Math.round(heatmap.reduce((s, d) => s + d.score, 0) / activeDays) : 0;

    // Group heatmap by month (roughly)
    const months: { label: string; cells: typeof heatmap }[] = [];
    let curMonth = '';
    let curCells: typeof heatmap = [];
    heatmap.forEach(cell => {
        const m = new Date(cell.date).toLocaleDateString('en-US', { month: 'short' });
        if (m !== curMonth) {
            if (curCells.length) months.push({ label: curMonth, cells: curCells });
            curMonth = m; curCells = [cell];
        } else curCells.push(cell);
    });
    if (curCells.length) months.push({ label: curMonth, cells: curCells });

    return (
        <div className="animate-in">
            <div className="page-header">
                <h1 className="page-title">Life Timeline</h1>
                <p className="page-subtitle">Visualize your entire year of productivity</p>
            </div>

            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}><Star size={20} style={{ color: 'var(--green)' }} /></div>
                    <div className="stat-value" style={{ color: 'var(--green)' }}>{productiveDays}</div>
                    <div className="stat-label">Productive Days</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><TrendingUp size={20} style={{ color: 'var(--yellow)' }} /></div>
                    <div className="stat-value" style={{ color: 'var(--yellow)' }}>{avgDays}</div>
                    <div className="stat-label">Average Days</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}><Map size={20} style={{ color: 'var(--red)' }} /></div>
                    <div className="stat-value" style={{ color: 'var(--red)' }}>{unproductiveDays}</div>
                    <div className="stat-label">Low Days</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.15)' }}><Star size={20} style={{ color: 'var(--accent-light)' }} /></div>
                    <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{avgScore}%</div>
                    <div className="stat-label">Avg Score</div>
                </div>
            </div>

            <div className="card">
                <div className="section-title"><Map size={16} style={{ color: 'var(--green)' }} /> 365-Day Productivity Map</div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    {[['var(--green)', 'Productive (≥70%)'], ['var(--yellow)', 'Average (40-69%)'], ['var(--red)', 'Low (<40%)'], ['rgba(255,255,255,0.05)', 'No data']].map(([c, l]) => (
                        <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <div style={{ width: 12, height: 12, borderRadius: 2, background: c }} />
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{l}</span>
                        </div>
                    ))}
                </div>

                {/* Month-by-month heatmap */}
                <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', minWidth: 'max-content' }}>
                        {months.map(({ label, cells }) => (
                            <div key={label}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textAlign: 'center' }}>{label}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px' }}>
                                    {cells.map(({ date, score }) => (
                                        <div key={date} title={`${date}: ${score}%`}
                                            style={{ width: 12, height: 12, borderRadius: 2, background: heatColor(score), cursor: 'help', transition: 'transform 0.15s' }}
                                            onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.5)')}
                                            onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Monthly breakdown */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <div className="section-title">Monthly Performance</div>
                {months.slice(-3).reverse().map(({ label, cells }) => {
                    const active = cells.filter(c => c.score > 0);
                    const avg = active.length ? Math.round(active.reduce((s, c) => s + c.score, 0) / active.length) : 0;
                    const prod = cells.filter(c => c.score >= 70).length;
                    return (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontWeight: 700, width: 36, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{label}</span>
                            <div className="progress-bar" style={{ flex: 1 }}>
                                <div className="progress-fill" style={{ width: `${avg}%`, background: avg >= 70 ? '#22c55e' : avg >= 40 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, width: 45, color: avg >= 70 ? 'var(--green)' : avg >= 40 ? 'var(--yellow)' : 'var(--red)' }}>{avg}%</span>
                            <span style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>{prod} productive days</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
