'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getRoutines, getCompletions, getBadges, saveBadges } from '@/lib/storage';
import { calculateDayScore, getDisciplineScore, getLevel, getLevelProgress } from '@/lib/engine';
import { Badge, LEVEL_NAMES, XP_PER_LEVEL } from '@/lib/types';
import { Trophy, Zap, Star, Shield } from 'lucide-react';

export default function GamificationPage() {
    const { user } = useAuth();
    const [badges, setBadges] = useState<Badge[]>([]);
    const [todayScore, setTodayScore] = useState(0);

    useEffect(() => {
        if (!user) return;
        const b = getBadges(user.id);

        // Auto-unlock badges
        const routines = getRoutines(user.id);
        const completions = getCompletions(user.id);
        const today = new Date().toISOString().slice(0, 10);
        const todayComps = completions.filter(c => c.date === today);
        const { score, maxScore, completed, total } = calculateDayScore(todayComps, routines);
        setTodayScore(getDisciplineScore(score, maxScore));

        const healthDone = completions.filter(c => {
            const r = routines.find(x => x.id === c.routineId);
            return r?.category === 'Health' && c.status === 'completed';
        }).length;
        const studyDone = completions.filter(c => {
            const r = routines.find(x => x.id === c.routineId);
            return r?.category === 'Study' && c.status === 'completed';
        }).length;

        const updated = b.map(badge => {
            if (badge.unlockedAt) return badge;
            let unlock = false;
            if (badge.condition === 'streak7' && (user.currentStreak ?? 0) >= 7) unlock = true;
            if (badge.condition === 'streak30' && (user.currentStreak ?? 0) >= 30) unlock = true;
            if (badge.condition === 'first_routine' && routines.length >= 1) unlock = true;
            if (badge.condition === 'fitness_champ' && healthDone >= 20) unlock = true;
            if (badge.condition === 'study_warrior' && studyDone >= 20) unlock = true;
            if (badge.condition === 'perfect_day' && total > 0 && completed === total) unlock = true;
            if (unlock) return { ...badge, unlockedAt: new Date().toISOString() };
            return badge;
        });
        setBadges(updated);
        saveBadges(user.id, updated);
    }, [user]);

    const level = getLevel(user?.totalXP ?? 0);
    const levelName = LEVEL_NAMES[level];
    const progress = getLevelProgress(user?.totalXP ?? 0);
    const xpCurr = user?.totalXP ?? 0;
    const xpNext = XP_PER_LEVEL[Math.min(level + 1, 5)];
    const unlockedCount = badges.filter(b => b.unlockedAt).length;

    const LEVEL_ICONS = ['🥚', '📖', '🎯', '⚡', '👑'];

    return (
        <div className="animate-in">
            <div className="page-header">
                <h1 className="page-title">Life Score</h1>
                <p className="page-subtitle">Your gamified productivity journey</p>
            </div>

            {/* Score cards */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(37,99,235,0.1))' }}>
                    <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.2)' }}><Trophy size={20} style={{ color: 'var(--accent-light)' }} /></div>
                    <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{todayScore}</div>
                    <div className="stat-label">Today's Score</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><Star size={20} style={{ color: 'var(--yellow)' }} /></div>
                    <div className="stat-value" style={{ color: 'var(--yellow)' }}>{xpCurr}</div>
                    <div className="stat-label">Total XP</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}><Shield size={20} style={{ color: 'var(--green)' }} /></div>
                    <div className="stat-value" style={{ color: 'var(--green)' }}>{unlockedCount}/{badges.length}</div>
                    <div className="stat-label">Badges Earned</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}><Zap size={20} style={{ color: 'var(--blue)' }} /></div>
                    <div className="stat-value" style={{ color: 'var(--blue)' }}>{user?.currentStreak ?? 0}</div>
                    <div className="stat-label">Current Streak</div>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
                {/* Level card */}
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(37,99,235,0.08))', border: '1px solid rgba(124,58,237,0.3)' }}>
                    <div className="section-title"><Trophy size={16} style={{ color: 'var(--accent-light)' }} /> Current Level</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '3.5rem' }}>{LEVEL_ICONS[level - 1]}</div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-light)' }}>Level {level}</div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{levelName}</div>
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Progress to Level {Math.min(level + 1, 5)}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent-light)', fontWeight: 700 }}>{xpCurr} / {xpNext || '∞'} XP</span>
                        </div>
                        <div className="progress-bar" style={{ height: 10 }}>
                            <div className="progress-fill" style={{ width: `${level >= 5 ? 100 : progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', boxShadow: '0 0 10px var(--accent-glow)' }} />
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', filter: i + 1 <= level ? 'none' : 'grayscale(1)', opacity: i + 1 <= level ? 1 : 0.3 }}>{LEVEL_ICONS[i]}</div>
                                <div style={{ fontSize: '0.62rem', color: i + 1 <= level ? 'var(--accent-light)' : 'var(--text-muted)', fontWeight: 600 }}>Lv.{i + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Score breakdown */}
                <div className="card">
                    <div className="section-title"><Zap size={16} style={{ color: 'var(--yellow)' }} /> Points System</div>
                    {[
                        { action: 'Wake up on time', pts: '+10', color: 'var(--yellow)' },
                        { action: 'Complete Health routine', pts: '+20', color: 'var(--green)' },
                        { action: 'Complete Study routine', pts: '+15', color: 'var(--blue)' },
                        { action: 'Complete Work routine', pts: '+15', color: 'var(--yellow)' },
                        { action: 'Complete Personal routine', pts: '+10', color: 'var(--purple)' },
                        { action: 'Skip a task', pts: '−5', color: 'var(--red)' },
                        { action: '7-day streak bonus', pts: '+50', color: 'var(--accent-light)' },
                    ].map(({ action, pts, color }) => (
                        <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{action}</span>
                            <span style={{ fontWeight: 700, color, fontSize: '0.9rem' }}>{pts}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Badges */}
            <div className="card">
                <div className="section-title"><Shield size={16} style={{ color: 'var(--yellow)' }} /> Achievement Badges</div>
                <div className="badge-grid">
                    {badges.map(badge => (
                        <div key={badge.id} className={`badge-item ${badge.unlockedAt ? 'unlocked' : 'locked'}`}>
                            <span className="badge-icon">{badge.icon}</span>
                            <div className="badge-name">{badge.name}</div>
                            <div className="badge-desc">{badge.description}</div>
                            {badge.unlockedAt && <div style={{ fontSize: '0.65rem', color: 'var(--green)', marginTop: '0.35rem', fontWeight: 600 }}>✓ Earned</div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
