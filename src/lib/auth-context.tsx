'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getProfile, getSupplierByUserId, updateProfile, createSupplier } from '@/lib/db';
import type { UserProfile, Supplier } from '@/lib/types';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  supplier: Supplier | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, displayName: string, role: string, username: string, supplierProfile?: UserProfile['supplierProfile']) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const foundProfile = await getProfile(userId);
    setProfile(foundProfile);

    if (foundProfile && foundProfile.role === 'supplier') {
      const foundSupplier = await getSupplierByUserId(foundProfile.id);
      setSupplier(foundSupplier);
    } else {
      setSupplier(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentUser = user;
    if (currentUser?.id) {
      await loadProfile(currentUser.id);
    }
  }, [user, loadProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        loadProfile(initialSession.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setSupplier(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message === 'Invalid login credentials'
        ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
        : error.message };
    }
    return { error: null };
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: string,
    username: string,
    supplierProfile?: UserProfile['supplierProfile']
  ): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          username,
          role: role,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'هذا البريد الإلكتروني مسجل بالفعل' };
      }
      return { error: error.message };
    }

    // Profile will be auto-created by the trigger, but we need to update additional fields
    if (data.user) {
      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile with additional data
      if (role === 'supplier' && supplierProfile) {
        await updateProfile(data.user.id, {
          displayName,
          username,
          role: role as 'supplier',
          supplierStatus: 'pending',
          supplierProfile,
        });

        // Create supplier entry
        await createSupplier({
          userId: data.user.id,
          name: supplierProfile.name,
          nameEn: supplierProfile.nameEn,
          description: supplierProfile.description,
          descriptionEn: supplierProfile.descriptionEn,
          category: supplierProfile.category,
          logoUrl: supplierProfile.logoUrl,
          coverUrl: supplierProfile.coverUrl,
          address: supplierProfile.address,
          addressEn: supplierProfile.addressEn,
          contact: supplierProfile.contact,
          badge: 'none',
          status: 'pending',
          isVerified: false,
          joinedDate: new Date().toISOString(),
        });
      } else {
        await updateProfile(data.user.id, {
          displayName,
          username,
          role: role as 'user',
        });
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSupplier(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, supplier, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
