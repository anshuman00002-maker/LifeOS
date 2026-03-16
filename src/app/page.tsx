'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getRoutines, getCompletionsByDate, getTodayString, formatTime, getDailyScores, getHabitStats } from '@/lib/storage';
import { calculateDayScore, getDisciplineScore, getLevel, getLevelProgress, getWeeklyStats, generateAITips } from '@/lib/engine';
import { Routine, DayCompletion, LEVEL_NAMES, AITip } from '@/lib/types';
import { Zap, Flame, Trophy, Target, ChevronRight, TrendingUp, Brain } from 'lucide-react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="score-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={8} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease', filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div className="score-ring-text">
        <span className="score-ring-value" style={{ color }}>{score}</span>
        <span className="score-ring-label">Score</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return <div className="custom-tooltip" style={{ padding: '8px 12px' }}><p style={{ marginBottom: 4 }}><strong>{label}</strong></p><p style={{ color: '#22c55e' }}>Score: {payload[0]?.value}%</p></div>;
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [completions, setCompletions] = useState<DayCompletion[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [tips, setTips] = useState<AITip[]>([]);
  const today = getTodayString();

  useEffect(() => {
    if (!user) return;
    const r = getRoutines(user.id);
    const c = getCompletionsByDate(user.id, today);
    setRoutines(r);
    setCompletions(c);
    setWeeklyData(getWeeklyStats(user.id));
    setTips(generateAITips(user.id));
  }, [user]);

  const { score, maxScore, completed, skipped, total } = calculateDayScore(completions, routines);
  const disciplineScore = getDisciplineScore(score, maxScore);
  const level = getLevel(user?.totalXP ?? 0);
  const progress = getLevelProgress(user?.totalXP ?? 0);
  const levelName = LEVEL_NAMES[level];

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const upcoming = routines
    .filter(r => !completions.find(c => c.routineId === r.id && c.status === 'completed'))
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 4);

  const tipColors: Record<string, string> = { info: 'var(--blue)', warning: 'var(--yellow)', suggestion: 'var(--purple)', praise: 'var(--green)' };

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">{now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <Link href="/checklist" className="btn btn-primary">
          <Zap size={16} /> Today's Tasks <ChevronRight size={14} />
        </Link>
      </div>

      {/* Top stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.15)' }}><Trophy size={20} style={{ color: 'var(--accent-light)' }} /></div>
          <div className="stat-value">{disciplineScore}%</div>
          <div className="stat-label">Today's Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}><Target size={20} style={{ color: 'var(--green)' }} /></div>
          <div className="stat-value">{completed}/{routines.length}</div>
          <div className="stat-label">Tasks Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}><Flame size={20} style={{ color: 'var(--yellow)' }} /></div>
          <div className="stat-value">{user?.currentStreak ?? 0}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}><TrendingUp size={20} style={{ color: 'var(--blue)' }} /></div>
          <div className="stat-value">{user?.totalXP ?? 0}</div>
          <div className="stat-label">Total XP</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Score + Level */}
        <div className="card">
          <div className="section-title"><Trophy size={16} style={{ color: 'var(--accent-light)' }} /> Today's Discipline</div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <ScoreRing score={disciplineScore} size={110} />
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Level {level} — {levelName}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--accent-light)' }}>{progress}%</span>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: 'var(--green)' }}>{completed}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Done</div>
                </div>
                <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: 'var(--red)' }}>{skipped}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Skipped</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly chart */}
        <div className="card">
          <div className="section-title"><TrendingUp size={16} style={{ color: 'var(--blue)' }} /> Weekly Productivity</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weeklyData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {weeklyData.map((entry, i) => (
                  <Cell key={i} fill={entry.score >= 70 ? '#22c55e' : entry.score >= 40 ? '#f59e0b' : 'rgba(124,58,237,0.6)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: '1.25rem' }}>
        {/* Upcoming tasks */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: '0.75rem' }}>
            <Zap size={16} style={{ color: 'var(--yellow)' }} /> Upcoming Tasks
            <Link href="/checklist" style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--accent-light)', textDecoration: 'none', fontWeight: 500 }}>View all →</Link>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎉</div>
              <p style={{ fontSize: '0.85rem' }}>All tasks completed for today!</p>
            </div>
          ) : upcoming.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{r.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatTime(r.startTime)} · {r.duration}min</div>
              </div>
              <span style={{ fontSize: '0.72rem', background: 'rgba(124,58,237,0.15)', color: 'var(--accent-light)', padding: '2px 8px', borderRadius: 99, fontWeight: 600 }}>{r.category}</span>
            </div>
          ))}
          {routines.length === 0 && (
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>No routines yet.</p>
              <Link href="/routines" className="btn btn-primary btn-sm">+ Add Routine</Link>
            </div>
          )}
        </div>

        {/* AI Tips */}
        <div className="card">
          <div className="section-title"><Brain size={16} style={{ color: 'var(--purple)' }} /> AI Coach Insights</div>
          {tips.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Add and complete routines to get personalized insights.</p>
          ) : tips.map(tip => (
            <div key={tip.id} className={`tip-card tip-${tip.type}`}>
              <div style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                {tip.type === 'praise' ? '🎉' : tip.type === 'warning' ? '⚠️' : tip.type === 'suggestion' ? '💡' : 'ℹ️'}
              </div>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip.message}</p>
            </div>
          ))}
          <Link href="/assistant" style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--accent-light)', textDecoration: 'none', textAlign: 'center' }}>See full AI analysis →</Link>
        </div>
      </div>
    </div>
  );
}
