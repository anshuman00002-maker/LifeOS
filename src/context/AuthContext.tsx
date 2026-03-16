'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/lib/types';
import { getCurrentUser, setCurrentUser, getUsers, saveUser, getUserByEmail } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (data: Partial<User> & { password: string }) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Simple hash (for demo — in production use bcrypt on backend)
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'rma_salt_2024');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const u = getCurrentUser();
        setUser(u);
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const existing = getUserByEmail(email);
        if (!existing) return { success: false, error: 'No account found with this email.' };
        const hash = await hashPassword(password);
        if (hash !== existing.passwordHash) return { success: false, error: 'Incorrect password.' };
        setCurrentUser(existing.id);
        setUser(existing);
        return { success: true };
    };

    const register = async (data: Partial<User> & { password: string }) => {
        if (getUserByEmail(data.email!)) return { success: false, error: 'Email already registered.' };
        const hash = await hashPassword(data.password);
        const newUser: User = {
            id: uuidv4(),
            name: data.name ?? 'User',
            email: data.email!,
            passwordHash: hash,
            age: data.age,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            wakeTime: data.wakeTime ?? '07:00',
            sleepTime: data.sleepTime ?? '23:00',
            notifications: true,
            createdAt: new Date().toISOString(),
            currentLevel: 1,
            totalXP: 0,
            longestStreak: 0,
            currentStreak: 0,
        };
        saveUser(newUser);
        setCurrentUser(newUser.id);
        setUser(newUser);
        return { success: true };
    };

    const logout = () => {
        setCurrentUser(null);
        setUser(null);
    };

    const updateUser = (updates: Partial<User>) => {
        if (!user) return;
        const updated = { ...user, ...updates };
        saveUser(updated);
        setUser(updated);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
