'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { getCurrentUser, signInWithEmail, signUpWithEmail, signOut as signOutService } from '@/lib/services/auth';
import { getSupabaseClient } from '@/lib/supabase/client';

type AuthErrorResponse = {
  error: AuthError | Error | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthErrorResponse>;
  signUp: (email: string, password: string, name: string) => Promise<AuthErrorResponse>;
  signOut: () => Promise<AuthErrorResponse>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<{
    user: User | null;
    isLoading: boolean;
  }>({ user: null, isLoading: true });

  const { user, isLoading } = state;
  const supabase = getSupabaseClient();

  // Update state helper
  const updateState = (updates: Partial<typeof state>) => {
    setState(prev => ({
      ...prev,
      ...updates,
    }));
  };

  // Authentication functions with useCallback
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { user } = await signInWithEmail(email, password);
      updateState({ user, isLoading: false });
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      updateState({ user: null, isLoading: false });
      return { error: error as Error };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    try {
      const { user } = await signUpWithEmail(email, password, name || '');
      updateState({ user, isLoading: false });
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      updateState({ user: null, isLoading: false });
      return { error: error as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutService();
      updateState({ user: null, isLoading: false });
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as Error };
    }
  }, []);

  // Check current user on mount
  useEffect(() => {
    let isMounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    const checkUser = async () => {
      if (!isMounted) return;
      
      try {
        const currentUser = await getCurrentUser();
        if (isMounted) {
          updateState({ user: currentUser, isLoading: false });
        }
      } catch (error) {
        if (isMounted) {
          updateState({ user: null, isLoading: false });
        }
      }
    };

    // Set up auth state listener
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(
        async (_, session) => {
          if (isMounted) {
            updateState({ 
              user: session?.user ?? null, 
              isLoading: false 
            });
          }
        }
      );
      // Store the subscription directly as it already has an unsubscribe method
      subscription = data as unknown as { unsubscribe: () => void };
    }

    // Initial check
    checkUser();

    // Cleanup
    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase, updateState]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [user, isLoading, signIn, signUp, signOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}