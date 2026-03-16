'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Clock } from 'lucide-react';

export default function RegisterPage() {
    const { register } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '', wakeTime: '07:00', sleepTime: '23:00' });
    const [show, setShow] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
        setError(''); setLoading(true);
        const result = await register(form);
        if (!result.success) setError(result.error ?? 'Registration failed');
        setLoading(false);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'radial-gradient(ellipse at 40% 80%, rgba(37,99,235,0.1) 0%, transparent 70%), var(--bg-primary)' }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.5rem', boxShadow: '0 0 30px var(--accent-glow)' }}>⚡</div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.3rem' }}>Design your life</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Create your LifeOS account to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="input" style={{ paddingLeft: '2.2rem' }} placeholder="John Doe" value={form.name} onChange={set('name')} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="input" style={{ paddingLeft: '2.2rem' }} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="input" style={{ paddingLeft: '2.2rem', paddingRight: '2.8rem' }} type={show ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={set('password')} required />
                            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                {show ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group">
                            <label className="form-label">Wake Time</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input className="input" style={{ paddingLeft: '2rem' }} type="time" value={form.wakeTime} onChange={set('wakeTime')} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Sleep Time</label>
                            <div style={{ position: 'relative' }}>
                                <Clock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input className="input" style={{ paddingLeft: '2rem' }} type="time" value={form.sleepTime} onChange={set('sleepTime')} />
                            </div>
                        </div>
                    </div>

                    {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.65rem 0.9rem', color: 'var(--red)', fontSize: '0.85rem' }}>{error}</div>}

                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', fontSize: '0.95rem' }}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>

                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.87rem' }}>
                        Already have an account? <Link href="/login" style={{ color: 'var(--accent-light)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
