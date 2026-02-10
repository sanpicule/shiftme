import { useState, useEffect, useCallback } from 'react'
import { CalendarEvent, fetchGoogleCalendarEvents, getMockGoogleCalendarEvents } from '../lib/googleCalendar'

/**
 * Hook to manage Google Calendar events
 * For now, uses mock data until Google OAuth is fully configured
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

      // Try to fetch real Google Calendar events
      const events = await fetchGoogleCalendarEvents(startOfMonth, endOfMonth)
      
      // If no events were fetched (no OAuth token or edge function not setup),
      // use mock data for development
      if (events.length === 0) {
        const mockEvents = getMockGoogleCalendarEvents()
        setCalendarEvents(mockEvents)
      } else {
        setCalendarEvents(events)
      }
    } catch (err) {
      console.error('Error loading calendar events:', err)
      setError('カレンダーイベントの読み込みに失敗しました')
      // Use mock data as fallback
      setCalendarEvents(getMockGoogleCalendarEvents())
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
