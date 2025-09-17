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

  const updateState = useCallback((updates: Partial<typeof state>) => {
    setState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const handleAuthSuccess = useCallback((session: { user: User } | null) => {
    updateState({ user: session?.user ?? null, isLoading: false });
  }, [updateState]);

  const handleAuthError = useCallback((error: Error) => {
    console.error('Authentication error:', error);
    updateState({ user: null, isLoading: false });
    return { error };
  }, [updateState]);

  const checkUser = useCallback(async (): Promise<User | null> => {
    try {
      const currentUser = await getCurrentUser();
      updateState({ user: currentUser, isLoading: false });
      return currentUser;
    } catch (error) {
      updateState({ user: null, isLoading: false });
      return null;
    }
  }, [updateState]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { user } = await signInWithEmail(email, password);
      updateState({ user });
      return { error: null };
    } catch (error) {
      return handleAuthError(error as Error);
    }
  }, [handleAuthError, updateState]);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    try {
      const { user } = await signUpWithEmail(email, password, name);
      updateState({ user });
      return { error: null };
    } catch (error) {
      return handleAuthError(error as Error);
    }
  }, [handleAuthError, updateState]);

  const signOut = useCallback(async () => {
    try {
      await signOutService();
      updateState({ user: null });
      return { error: null };
    } catch (error) {
      return handleAuthError(error as Error);
    }
  }, [handleAuthError, updateState]);

  useEffect(() => {
    const initializeAuth = async () => {
      await checkUser();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_, session) => {
          if (session?.user) {
            handleAuthSuccess(session);
          } else {
            await checkUser();
          }
        }
      );

      return () => {
        subscription?.unsubscribe();
      };
    };

    initializeAuth().catch(handleAuthError);
  }, [checkUser, handleAuthError, handleAuthSuccess, supabase]);

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