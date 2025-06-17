import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({ email, password })
      if (result.error) {
        console.error('Sign in error:', result.error)
      }
      return result
    } catch (error) {
      console.error('Sign in exception:', error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signUp({ email, password })
      if (result.error) {
        console.error('Sign up error:', result.error)
      }
      return result
    } catch (error) {
      console.error('Sign up exception:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Attempting to sign out...')
      
      // Clear local state immediately
      setUser(null)
      setSession(null)
      
      // Clear localStorage
      localStorage.clear()
      sessionStorage.clear()
      
      // Attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      
      if (error) {
        console.warn('Supabase signOut error (but continuing with local logout):', error)
      } else {
        console.log('Successfully signed out from Supabase')
      }
      
      // Force reload to ensure clean state
      window.location.reload()
    } catch (error) {
      console.error('Sign out exception:', error)
      // Even if there's an error, clear local state and reload
      setUser(null)
      setSession(null)
      localStorage.clear()
      sessionStorage.clear()
      window.location.reload()
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}