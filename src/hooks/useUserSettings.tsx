import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase, UserSettings } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface UserSettingsContextValue {
  userSettings: UserSettings | null
  loading: boolean
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<{ data?: UserSettings | null; error?: unknown | null }>
  refetch: () => Promise<void>
}

const UserSettingsContext = createContext<UserSettingsContextValue | undefined>(undefined)

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserSettings = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      // Check if data array has any items, use first item or null
      if (data && data.length > 0) {
        setUserSettings(data[0])
      } else {
        // Create default settings for new users
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            monthly_income: 0,
            setup_completed: false
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating default user settings:', createError)
          setUserSettings(null)
        } else {
          setUserSettings(newSettings)
        }
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
      setUserSettings(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      setLoading(true)
      fetchUserSettings()
      return
    }
    setUserSettings(null)
    setLoading(false)
  }, [user])

  const updateUserSettings = async (settings: Partial<UserSettings>) => {
    if (!user) return { error: 'User not authenticated' }

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) throw error

      // Immediately update the local state with the new data
      setUserSettings(data)
      
      return { data, error: null }
    } catch (error) {
      console.error('Error updating user settings:', error)
      return { data: null, error }
    }
  }

  const value = {
    userSettings,
    loading,
    updateUserSettings,
    refetch: fetchUserSettings,
  }

  return <UserSettingsContext.Provider value={value}>{children}</UserSettingsContext.Provider>
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider')
  }
  return context
}