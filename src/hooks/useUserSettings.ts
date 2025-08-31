import { useState, useEffect } from 'react'
import { supabase, UserSettings } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useUserSettings() {
  const { user } = useAuth()
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserSettings()
    } else {
      setUserSettings(null)
      setLoading(false)
    }
  }, [user])

  // Reset loading state when user changes
  useEffect(() => {
    if (!user) {
      setLoading(false)
    }
  }, [user])

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
      setUserSettings(data && data.length > 0 ? data[0] : null)
    } catch (error) {
      console.error('Error fetching user settings:', error)
    } finally {
      setLoading(false)
    }
  }

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

      setUserSettings(data)
      
      // Force a refetch to ensure the UI updates immediately
      setTimeout(() => {
        fetchUserSettings()
      }, 100)
      
      return { data, error: null }
    } catch (error) {
      console.error('Error updating user settings:', error)
      return { data: null, error }
    }
  }

  return {
    userSettings,
    loading,
    updateUserSettings,
    refetch: fetchUserSettings,
  }
}