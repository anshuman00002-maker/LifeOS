'use client';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { ARCHITECT_GOALS } from '@/lib/engine';
import { getRoutines, saveRoutine } from '@/lib/storage';
import { Routine } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { Compass, Check, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ArchitectPage() {
    const { user, updateUser } = useAuth();
    const [selected, setSelected] = useState<string | null>(null);
    const [adopted, setAdopted] = useState<string | null>(null);
    const goal = ARCHITECT_GOALS.find(g => g.id === selected);

    const adopt = () => {
        if (!user || !goal) return;
        const existing = getRoutines(user.id);
        const base = existing.length;
        goal.suggestedRoutines.forEach((r, i) => {
            const routine: Routine = {
                ...r,
                id: uuidv4(),
                userId: user.id,
                createdAt: new Date().toISOString(),
                order: base + i,
            };
            saveRoutine(routine);
        });
        // Grant badge
        updateUser({ totalXP: (user.totalXP ?? 0) + 100 });
        setAdopted(goal.id);
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <h1 className="page-title">Life Architect</h1>
                <p className="page-subtitle">Answer one question. Get a complete life routine built for you.</p>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(37,99,235,0.08))', border: '1px solid rgba(124,58,237,0.25)' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.5rem' }}>🏗️ What type of person do you want to become?</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select a goal and we'll generate a complete daily routine tailored for you.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {ARCHITECT_GOALS.map(g => (
                    <button
                        key={g.id}
                        onClick={() => { setSelected(g.id); setAdopted(null); }}
                        style={{
                            padding: '1.5rem', borderRadius: 'var(--radius)', border: '1px solid',
                            borderColor: selected === g.id ? 'var(--accent)' : 'var(--border)',
                            background: selected === g.id ? 'rgba(124,58,237,0.12)' : 'var(--bg-card)',
                            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                            transition: 'all 0.2s', transform: selected === g.id ? 'translateY(-2px)' : 'none',
                            boxShadow: selected === g.id ? '0 0 20px var(--accent-glow)' : 'none',
                        }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{g.icon}</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: selected === g.id ? 'var(--accent-light)' : 'var(--text-primary)', marginBottom: '0.3rem' }}>{g.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{g.description}</div>
                    </button>
                ))}
            </div>

            {goal && (
                <div className="card animate-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{goal.icon} {goal.title} Routine Plan</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Your personalized schedule — ready to adopt in one click</p>
                        </div>
                        {adopted === goal.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)', fontWeight: 700, fontSize: '0.9rem' }}>
                                <Check size={18} /> Adopted!
                            </div>
                        ) : (
                            <button className="btn btn-primary" onClick={adopt}>
                                <Plus size={15} /> Adopt All Routines
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {goal.suggestedRoutines.map((r, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.9rem 1rem', borderRadius: 10, background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
                                <div style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--accent-light)', fontWeight: 800, fontSize: '0.75rem', padding: '0.4rem 0.7rem', borderRadius: 7, minWidth: 55, textAlign: 'center' }}>{r.startTime}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{r.title}</div>
                                    <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>{r.duration} min · {r.category} · {r.repeatPattern}</div>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-light)' }}>+{r.points}pts</span>
                            </div>
                        ))}
                    </div>

                    {adopted === goal.id && (
                        <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.88rem' }}>✅ Routines added! +100 XP bonus earned!</span>
                            <Link href="/routines" className="btn btn-sm btn-ghost">View Routines <ChevronRight size={13} /></Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
