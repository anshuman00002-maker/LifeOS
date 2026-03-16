'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { getRoutines, getCompletionsByDate, getTodayString, upsertCompletion } from '@/lib/storage';
import { Routine, DayCompletion, CATEGORY_COLORS } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { X, Play, Pause, SkipForward, Zap, Coffee } from 'lucide-react';

const POMODORO_WORK = 25 * 60; // 25 min
const POMODORO_BREAK = 5 * 60; // 5 min

export default function FocusPage() {
    const { user, updateUser } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [selected, setSelected] = useState<Routine | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [timeLeft, setTimeLeft] = useState(POMODORO_WORK);
    const [pomodoros, setPomodoros] = useState(0);
    const [usePomodoro, setUsePomodoro] = useState(true);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!user) return;
        const r = getRoutines(user.id);
        setRoutines(r);
        if (r.length > 0 && !selected) setSelected(r[0]);
    }, [user]);

    useEffect(() => {
        if (selected && !usePomodoro) setTimeLeft(selected.duration * 60);
        else if (usePomodoro && !isBreak) setTimeLeft(POMODORO_WORK);
        else if (usePomodoro && isBreak) setTimeLeft(POMODORO_BREAK);
    }, [selected, usePomodoro, isBreak]);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(t => {
                    if (t <= 1) {
                        clearInterval(intervalRef.current!);
                        setIsRunning(false);
                        if (usePomodoro) {
                            if (!isBreak) {
                                setPomodoros(p => p + 1);
                                setIsBreak(true);
                                setTimeLeft(POMODORO_BREAK);
                            } else {
                                setIsBreak(false);
                                setTimeLeft(POMODORO_WORK);
                            }
                        }
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isRunning, usePomodoro, isBreak]);

    const markDone = () => {
        if (!user || !selected) return;
        const today = getTodayString();
        const comp: DayCompletion = {
            id: uuidv4(), routineId: selected.id, userId: user.id,
            date: today, status: 'completed', scheduledTime: selected.startTime,
            completedAt: new Date().toISOString(),
        };
        upsertCompletion(comp);
        updateUser({ totalXP: (user.totalXP ?? 0) + selected.points });
        setIsRunning(false);
        setTimeLeft(usePomodoro ? POMODORO_WORK : (selected?.duration ?? 25) * 60);
        setIsBreak(false);
    };

    const totalSec = usePomodoro ? (isBreak ? POMODORO_BREAK : POMODORO_WORK) : (selected?.duration ?? 25) * 60;
    const pct = ((totalSec - timeLeft) / totalSec) * 100;
    const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
    const secs = String(timeLeft % 60).padStart(2, '0');

    const size = 220;
    const r = (size - 16) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const ringColor = isBreak ? 'var(--green)' : 'var(--accent)';

    if (!selected) {
        return (
            <div className="animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                    <p>No routines found. <a href="/routines" style={{ color: 'var(--accent-light)' }}>Add routines first.</a></p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Focus Mode</h1>
                    <p className="page-subtitle">Deep work with zero distractions</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        className={`btn btn-sm ${usePomodoro ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => { setUsePomodoro(true); setIsRunning(false); setIsBreak(false); setTimeLeft(POMODORO_WORK); }}>
                        🍅 Pomodoro
                    </button>
                    <button
                        className={`btn btn-sm ${!usePomodoro ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => { setUsePomodoro(false); setIsRunning(false); setTimeLeft((selected?.duration ?? 25) * 60); }}>
                        ⏱ Task Timer
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
                {/* Timer section */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 2rem' }}>
                    {isBreak && (
                        <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '0.5rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600 }}>
                            <Coffee size={15} /> Break Time! Rest and recharge.
                        </div>
                    )}

                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '50%', padding: '0.75rem', marginBottom: '1.5rem', position: 'relative' }}>
                        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
                            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ringColor} strokeWidth={10} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 10px ${isBreak ? 'rgba(34,197,94,0.5)' : 'rgba(124,58,237,0.5)'})` }} />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: isBreak ? 'var(--green)' : 'var(--text-primary)' }}>{mins}:{secs}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{isBreak ? 'Break' : usePomodoro ? 'Focus' : 'Working'}</span>
                        </div>
                    </div>

                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem', color: isBreak ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                        {isBreak ? '🌿 Take a breather' : selected.title}
                    </h2>
                    {!isBreak && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{selected.category} · {selected.duration} min scheduled</p>}
                    {isBreak && <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Pomodoro #{pomodoros} complete!</p>}

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '1rem' }} onClick={() => setIsRunning(!isRunning)}>
                            {isRunning ? <><Pause size={18} /> Pause</> : <><Play size={18} /> {timeLeft === totalSec ? 'Start' : 'Resume'}</>}
                        </button>
                        <button className="btn btn-ghost" onClick={() => { setIsRunning(false); setTimeLeft(usePomodoro ? (isBreak ? POMODORO_BREAK : POMODORO_WORK) : (selected?.duration ?? 25) * 60); }}>
                            Reset
                        </button>
                        {!isBreak && (
                            <button className="btn btn-success" onClick={markDone}>
                                <Zap size={15} /> Mark Done
                            </button>
                        )}
                    </div>

                    {usePomodoro && (
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.4rem' }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: i < pomodoros % 4 ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }} />
                            ))}
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem' }}>{pomodoros} pomodoros</span>
                        </div>
                    )}
                </div>

                {/* Task selector */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-secondary)' }}>SELECT TASK</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {routines.map(r => (
                            <button
                                key={r.id}
                                onClick={() => { setSelected(r); setIsRunning(false); setTimeLeft(usePomodoro ? POMODORO_WORK : r.duration * 60); setIsBreak(false); }}
                                style={{ padding: '0.7rem 0.9rem', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.15s', borderColor: selected?.id === r.id ? 'var(--accent)' : 'var(--border)', background: selected?.id === r.id ? 'rgba(124,58,237,0.12)' : 'var(--bg-glass)', color: selected?.id === r.id ? 'var(--accent-light)' : 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: CATEGORY_COLORS[r.category], flexShrink: 0 }} />
                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', marginLeft: '1.25rem' }}>{r.duration} min · {r.category}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
