import { getSupabaseClient, getSupabaseServerClient } from '../supabase/client'
import type { User } from '@supabase/supabase-js'

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await getSupabaseClient().auth.getUser()
  
  if (error) {
    console.error('Error getting current user:', error.message)
    return null
  }
  
  return user
}

export async function getSession() {
  const { data, error } = await getSupabaseClient().auth.getSession()
  
  if (error) {
    console.error('Error getting session:', error.message)
    return { session: null }
  }
  
  return data
}

export async function requireSession() {
  const { session } = await getSession()
  
  if (!session) {
    throw new Error('Unauthorized: No active session')
  }
  
  return session
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

export async function signOut() {
  const { error } = await getSupabaseClient().auth.signOut()
  
  if (error) {
    throw new Error(error.message)
  }
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email,
    password,
  })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}
