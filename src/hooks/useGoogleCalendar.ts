import { useState, useEffect, useCallback } from 'react'
import { CalendarEvent, fetchGoogleCalendarEvents } from '../lib/googleCalendar'

/**
 * Hook to manage Google Calendar events
 * Automatically falls back to mock data when Google OAuth is not configured
 */
export function useGoogleCalendar(currentDate: Date) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCalendarEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Calculate date range for the current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

      // Fetch calendar events (includes automatic fallback to mock data)
      const events = await fetchGoogleCalendarEvents(startOfMonth, endOfMonth)
      setCalendarEvents(events)
    } catch (err) {
      console.error('Error loading calendar events:', err)
      setError('カレンダーイベントの読み込みに失敗しました')
      setCalendarEvents([])
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    loadCalendarEvents()
  }, [loadCalendarEvents])

  const refreshEvents = () => {
    loadCalendarEvents()
  }

  return {
    calendarEvents,
    loading,
    error,
    refreshEvents
  }
}
