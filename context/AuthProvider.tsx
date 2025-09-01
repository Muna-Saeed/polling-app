'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { useSupabaseAuth, signInWithEmail, signUpWithEmail, signOut as supabaseSignOut } from '@/lib/supabaseAuth';

// Auth context type definition

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any | null }>;
  signOut: () => Promise<{ error: any | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  // Use the Supabase auth hook to manage authentication state
  const { user, isLoading } = useSupabaseAuth();

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await signInWithEmail(email, password);
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  // Sign up with email, password, and name
  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { error } = await signUpWithEmail(email, password, { full_name: name });
      return { error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabaseSignOut();
      return { error };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}