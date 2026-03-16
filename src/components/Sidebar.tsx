'use client';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getLevel } from '@/lib/engine';
import { LEVEL_NAMES } from '@/lib/types';
import {
    LayoutDashboard, CalendarDays, CheckSquare, BarChart2,
    Target, Zap, Trophy, Map, Compass, User, LogOut, BrainCircuit, FileText
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
    { href: '/checklist', label: 'Daily Checklist', icon: CheckSquare, section: 'main' },
    { href: '/routines', label: 'Routine Builder', icon: CalendarDays, section: 'main' },
    { href: '/focus', label: 'Focus Mode', icon: Zap, section: 'main' },
    { href: '/habits', label: 'Habit Tracker', icon: Target, section: 'track' },
    { href: '/analytics', label: 'Analytics', icon: BarChart2, section: 'track' },
    { href: '/summary', label: 'Daily Summary', icon: FileText, section: 'track' },
    { href: '/gamification', label: 'Life Score', icon: Trophy, section: 'grow' },
    { href: '/timeline', label: 'Life Timeline', icon: Map, section: 'grow' },
    { href: '/architect', label: 'Life Architect', icon: Compass, section: 'grow' },
    { href: '/assistant', label: 'AI Assistant', icon: BrainCircuit, section: 'grow' },
    { href: '/profile', label: 'Profile', icon: User, section: 'account' },
];

const SECTIONS: Record<string, string> = {
    main: 'Core',
    track: 'Track',
    grow: 'Grow',
    account: 'Account',
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const level = user ? getLevel(user.totalXP) : 1;
    const levelName = LEVEL_NAMES[level];
    const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'U';

    const grouped = NAV_ITEMS.reduce((acc, item) => {
        if (!acc[item.section]) acc[item.section] = [];
        acc[item.section].push(item);
        return acc;
    }, {} as Record<string, typeof NAV_ITEMS>);

    return (
        <nav className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">⚡</div>
                <div>
                    <div className="sidebar-logo-text">LifeOS</div>
                    <div className="sidebar-logo-sub">Life Operating System</div>
                </div>
            </div>

            <div className="sidebar-nav">
                {Object.entries(grouped).map(([section, items]) => (
                    <div key={section}>
                        <div className="sidebar-section-label">{SECTIONS[section]}</div>
                        {items.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className={`nav-item ${pathname === href ? 'active' : ''}`}
                            >
                                <Icon className="nav-icon" size={16} />
                                {label}
                            </Link>
                        ))}
                    </div>
                ))}
            </div>

            <div className="sidebar-bottom">
                <div className="user-chip" style={{ marginBottom: '0.5rem' }}>
                    <div className="user-avatar">{initials}</div>
                    <div className="user-info">
                        <div className="user-name">{user?.name}</div>
                        <div className="user-level">Lv.{level} {levelName}</div>
                    </div>
                </div>
                <button
                    className="btn btn-ghost btn-sm"
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => { logout(); router.push('/login'); }}
                >
                    <LogOut size={14} /> Sign Out
                </button>
            </div>
        </nav>
    );
}
