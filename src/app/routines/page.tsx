'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getRoutines, saveRoutine, deleteRoutine, formatTime } from '@/lib/storage';
import { Routine, Category, RepeatPattern, Priority, CATEGORY_COLORS, CATEGORY_BG } from '@/lib/types';
import { getCategoryPoints } from '@/lib/engine';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit2, Trash2, X, GripVertical, Clock, AlignLeft } from 'lucide-react';

const CATEGORIES: Category[] = ['Health', 'Study', 'Work', 'Personal', 'Social'];
const REPEAT_PATTERNS: RepeatPattern[] = ['Daily', 'Weekdays', 'Weekends', 'Custom'];
const PRIORITIES: Priority[] = ['Low', 'Medium', 'High'];
const PRIORITY_COLORS: Record<Priority, string> = { Low: 'var(--green)', Medium: 'var(--yellow)', High: 'var(--red)' };
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const defaultForm = (): Omit<Routine, 'id' | 'userId' | 'createdAt' | 'order'> => ({
    title: '', category: 'Personal', startTime: '08:00', duration: 30,
    repeatPattern: 'Daily', reminderMinutes: 10, priority: 'Medium',
    notes: '', points: 10, customDays: [],
});

export default function RoutinesPage() {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState<Routine | null>(null);
    const [form, setForm] = useState(defaultForm());
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    useEffect(() => { if (user) reload(); }, [user]);

    const reload = () => { if (user) setRoutines(getRoutines(user.id)); };

    const openAdd = () => { setEditing(null); setForm(defaultForm()); setShowModal(true); };
    const openEdit = (r: Routine) => {
        setEditing(r);
        setForm({ title: r.title, category: r.category, startTime: r.startTime, duration: r.duration, repeatPattern: r.repeatPattern, reminderMinutes: r.reminderMinutes, priority: r.priority, notes: r.notes ?? '', points: r.points, customDays: r.customDays ?? [] });
        setShowModal(true);
    };

    const handleDelete = (id: string) => { deleteRoutine(id); reload(); };

    const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = () => {
        if (!user || !form.title.trim()) return;
        const points = getCategoryPoints(form.category);
        if (editing) {
            saveRoutine({ ...editing, ...form, points });
        } else {
            saveRoutine({ ...form, id: uuidv4(), userId: user.id, createdAt: new Date().toISOString(), order: routines.length, points });
        }
        setShowModal(false);
        reload();
    };

    const toggleCustomDay = (day: number) => {
        const days = form.customDays ?? [];
        setField('customDays', days.includes(day) ? days.filter(d => d !== day) : [...days, day]);
    };

    // Simple drag reorder
    const handleDragStart = (i: number) => setDragIndex(i);
    const handleDragOver = (e: React.DragEvent, i: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === i) return;
        const reordered = [...routines];
        const [item] = reordered.splice(dragIndex, 1);
        reordered.splice(i, 0, item);
        const withOrder = reordered.map((r, idx) => ({ ...r, order: idx }));
        withOrder.forEach(saveRoutine);
        setRoutines(withOrder);
        setDragIndex(i);
    };

    return (
        <div className="animate-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Routine Builder</h1>
                    <p className="page-subtitle">Design and manage your daily life routines</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Routine</button>
            </div>

            {routines.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No routines yet</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>Start building your ideal daily schedule</p>
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add your first routine</button>
                </div>
            ) : (
                <div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>Drag to reorder · {routines.length} routines</p>
                    {routines.map((r, i) => (
                        <div
                            key={r.id}
                            draggable
                            onDragStart={() => handleDragStart(i)}
                            onDragOver={e => handleDragOver(e, i)}
                            onDragEnd={() => setDragIndex(null)}
                            className="checklist-item"
                            style={{ borderLeftColor: CATEGORY_COLORS[r.category], background: CATEGORY_BG[r.category], cursor: 'default', marginBottom: '0.5rem' }}
                        >
                            <GripVertical size={16} style={{ color: 'var(--text-muted)', cursor: 'grab', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.title}</span>
                                    <span style={{ fontSize: '0.7rem', background: `${CATEGORY_COLORS[r.category]}22`, color: CATEGORY_COLORS[r.category], padding: '2px 8px', borderRadius: 99, fontWeight: 600, border: `1px solid ${CATEGORY_COLORS[r.category]}44` }}>{r.category}</span>
                                    <span style={{ fontSize: '0.7rem', color: PRIORITY_COLORS[r.priority], fontWeight: 600 }}>● {r.priority}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    <span><Clock size={11} style={{ display: 'inline', marginRight: 3 }} />{formatTime(r.startTime)}</span>
                                    <span>⏱ {r.duration} min</span>
                                    <span>🔄 {r.repeatPattern}</span>
                                    <span>⚡ {r.points} pts</span>
                                </div>
                                {r.notes && <p style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{r.notes}</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(r)}><Edit2 size={14} /></button>
                                <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(r.id)}><Trash2 size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="modal">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className="modal-title" style={{ margin: 0 }}>{editing ? 'Edit Routine' : 'New Routine'}</h2>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Routine Title *</label>
                                <input className="input" placeholder="e.g. Morning Workout" value={form.title} onChange={e => setField('title', e.target.value)} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select className="input" value={form.category} onChange={e => setField('category', e.target.value)}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Priority</label>
                                    <select className="input" value={form.priority} onChange={e => setField('priority', e.target.value)}>
                                        {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Start Time</label>
                                    <input className="input" type="time" value={form.startTime} onChange={e => setField('startTime', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Duration (min)</label>
                                    <input className="input" type="number" min={5} max={480} value={form.duration} onChange={e => setField('duration', Number(e.target.value))} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Repeat</label>
                                    <select className="input" value={form.repeatPattern} onChange={e => setField('repeatPattern', e.target.value)}>
                                        {REPEAT_PATTERNS.map(p => <option key={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Remind (min before)</label>
                                    <select className="input" value={form.reminderMinutes} onChange={e => setField('reminderMinutes', Number(e.target.value))}>
                                        {[0, 5, 10, 15, 30].map(m => <option key={m} value={m}>{m === 0 ? 'No reminder' : `${m} minutes`}</option>)}
                                    </select>
                                </div>
                            </div>

                            {form.repeatPattern === 'Custom' && (
                                <div className="form-group">
                                    <label className="form-label">Select Days</label>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        {DAY_NAMES.map((d, i) => (
                                            <button key={i} type="button" onClick={() => toggleCustomDay(i)}
                                                style={{ padding: '0.35rem 0.6rem', borderRadius: 6, border: '1px solid', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: form.customDays?.includes(i) ? 'var(--accent)' : 'var(--bg-glass)', borderColor: form.customDays?.includes(i) ? 'var(--accent)' : 'var(--border)', color: form.customDays?.includes(i) ? 'white' : 'var(--text-secondary)', transition: 'all 0.15s' }}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Notes (optional)</label>
                                <input className="input" placeholder="Any notes..." value={form.notes} onChange={e => setField('notes', e.target.value)} />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!form.title.trim()}>{editing ? 'Save Changes' : 'Add Routine'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
