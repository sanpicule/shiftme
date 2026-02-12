import { supabase } from './supabase';

// Google Calendar Event interface
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  status: string;
}

// Simplified calendar event for display
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  location?: string;
  date: string;
}

/**
 * Fetch Google Calendar events for a specific date range
 * This function attempts to fetch events from Google Calendar API via Supabase Edge Function.
 * If the user is not connected or the Edge Function is not available, it returns an empty list.
 *
 * @param startDate - Start date of the range to fetch events
 * @param endDate - End date of the range to fetch events
 * @returns Array of CalendarEvent objects
 *
 * Expected Supabase Edge Function response format:
 * {
 *   events: Array<GoogleCalendarEvent> // Array of Google Calendar API event objects
 * }
 */
export async function fetchGoogleCalendarEvents(
  startDate: Date,
  endDate: Date,
): Promise<CalendarEvent[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;

    if (!accessToken) {
      return [];
    }

    // Call Supabase Edge Function
    const response = await supabase.functions.invoke('sync-google-calendar', {
      body: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.error) {
      console.error('Error fetching calendar events:', response.error);
      return [];
    }

    return transformGoogleEvents(response.data?.events || []);
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    return [];
  }
}

/**
 * Transform Google Calendar events to our internal format
 */
function transformGoogleEvents(events: GoogleCalendarEvent[]): CalendarEvent[] {
  return events.map(event => {
    const isAllDay = !event.start.dateTime;
    const startTime = event.start.dateTime
      ? new Date(event.start.dateTime).toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : undefined;
    const endTime = event.end.dateTime
      ? new Date(event.end.dateTime).toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : undefined;
    const date = event.start.dateTime
      ? new Date(event.start.dateTime).toISOString().split('T')[0]
      : event.start.date || '';

    return {
      id: event.id,
      title: event.summary,
      description: event.description,
      startTime,
      endTime,
      isAllDay,
      location: event.location,
      date,
    };
  });
}

/**
 * Get calendar events for a specific date
 */
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dateStr = date.toISOString().split('T')[0];
  return events.filter(event => event.date === dateStr);
}
