'use client';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_ROUTES = ['/login', '/register'];

export default function AppShell({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const isPublic = PUBLIC_ROUTES.includes(pathname);

    useEffect(() => {
        if (!loading && !user && !isPublic) router.push('/login');
        if (!loading && user && isPublic) router.push('/');
    }, [user, loading, isPublic, router]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
                    <p style={{ color: 'var(--text-secondary)' }}>Loading LifeOS...</p>
                </div>
            </div>
        );
    }

    if (isPublic) return <>{children}</>;
    if (!user) return null;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content animate-in">{children}</main>
        </div>
    );
}
