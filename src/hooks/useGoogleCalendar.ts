import { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, fetchGoogleCalendarEvents } from '../lib/googleCalendar';

/**
 * Hook to manage Google Calendar events
 * Only fetches when the user has connected Google Calendar.
 */
export function useGoogleCalendar(currentDate: Date, isEnabled: boolean) {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCalendarEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range for the current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

      // Fetch calendar events only when the user is connected
      const events = await fetchGoogleCalendarEvents(startOfMonth, endOfMonth);
      setCalendarEvents(events);
    } catch (err) {
      console.error('Error loading calendar events:', err);
      setError('カレンダーイベントの読み込みに失敗しました');
      setCalendarEvents([]);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    if (!isEnabled) {
      setCalendarEvents([]);
      setLoading(false);
      setError(null);
      return;
    }

    loadCalendarEvents();
  }, [isEnabled, loadCalendarEvents]);

  return {
    calendarEvents,
    loading,
    error,
  };
}
