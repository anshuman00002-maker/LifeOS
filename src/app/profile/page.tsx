'use client';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { User } from 'lucide-react';

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({
        name: user?.name ?? '',
        age: user?.age?.toString() ?? '',
        wakeTime: user?.wakeTime ?? '07:00',
        sleepTime: user?.sleepTime ?? '23:00',
        notifications: user?.notifications ?? true,
    });
    const [saved, setSaved] = useState(false);

    const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

    const handleSave = () => {
        updateUser({
            name: form.name,
            age: form.age ? Number(form.age) : undefined,
            wakeTime: form.wakeTime,
            sleepTime: form.sleepTime,
            notifications: form.notifications,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'U';

    return (
        <div className="animate-in">
            <div className="page-header">
                <h1 className="page-title">Profile</h1>
                <p className="page-subtitle">Manage your account and preferences</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem' }}>
                {/* Avatar card */}
                <div className="card" style={{ textAlign: 'center', height: 'fit-content' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--pink))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.8rem', fontWeight: 800, color: 'white', boxShadow: '0 0 25px var(--accent-glow)' }}>
                        {initials}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.2rem' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{user?.email}</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                            { label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—' },
                            { label: 'Total XP', value: `${user?.totalXP ?? 0} XP` },
                            { label: 'Best streak', value: `${user?.longestStreak ?? 0} days` },
                            { label: 'Timezone', value: user?.timezone?.split('/')[1]?.replace('_', ' ') ?? '—' },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.35rem 0', borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Edit form */}
                <div className="card">
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Edit Profile</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input className="input" value={form.name} onChange={e => setField('name', e.target.value)} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Age</label>
                            <input className="input" type="number" min={10} max={120} placeholder="Optional" value={form.age} onChange={e => setField('age', e.target.value)} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="form-group">
                                <label className="form-label">Wake Time</label>
                                <input className="input" type="time" value={form.wakeTime} onChange={e => setField('wakeTime', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Sleep Time</label>
                                <input className="input" type="time" value={form.sleepTime} onChange={e => setField('sleepTime', e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Notifications</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.9rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 8 }}>
                                <input type="checkbox" id="notif" checked={form.notifications} onChange={e => setField('notifications', e.target.checked)}
                                    style={{ width: 16, height: 16, accentColor: 'var(--accent)', cursor: 'pointer' }} />
                                <label htmlFor="notif" style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    Enable browser push notifications for reminders
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <button className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                            {saved && <span style={{ color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600, animation: 'fade-in 0.3s ease' }}>✓ Saved successfully!</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Account info */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Info</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200, padding: '1rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Email</div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{user?.email}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200, padding: '1rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Account Type</div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Personal Free</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200, padding: '1rem', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 10 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Data Storage</div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Local (Browser)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
