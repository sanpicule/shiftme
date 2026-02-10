import { supabase } from './supabase'

// Google Calendar Event interface
export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
  }
  end: {
    dateTime?: string
    date?: string
  }
  location?: string
  status: string
}

// Simplified calendar event for display
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime?: string
  endTime?: string
  isAllDay: boolean
  location?: string
  date: string
}

/**
 * Fetch Google Calendar events for a specific date range
 * This function will call the Supabase Edge Function to fetch Google Calendar events
 */
export async function fetchGoogleCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.provider_token) {
      console.log('No Google provider token available - using mock data for development')
      // Return mock data for development/testing when OAuth is not configured
      return getMockGoogleCalendarEvents()
    }

    // Call Supabase Edge Function (to be implemented)
    const response = await supabase.functions.invoke('sync-google-calendar', {
      body: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        accessToken: session.provider_token
      }
    })

    if (response.error) {
      console.error('Error fetching calendar events:', response.error)
      // Return mock data as fallback
      return getMockGoogleCalendarEvents()
    }

    return transformGoogleEvents(response.data?.events || [])
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error)
    // Return mock data as fallback
    return getMockGoogleCalendarEvents()
  }
}

/**
 * Transform Google Calendar events to our internal format
 */
function transformGoogleEvents(events: GoogleCalendarEvent[]): CalendarEvent[] {
  return events.map(event => {
    const isAllDay = !event.start.dateTime
    const startTime = event.start.dateTime 
      ? new Date(event.start.dateTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      : undefined
    const endTime = event.end.dateTime
      ? new Date(event.end.dateTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
      : undefined
    const date = event.start.dateTime 
      ? new Date(event.start.dateTime).toISOString().split('T')[0]
      : event.start.date || ''

    return {
      id: event.id,
      title: event.summary,
      description: event.description,
      startTime,
      endTime,
      isAllDay,
      location: event.location,
      date
    }
  })
}

/**
 * Get calendar events for a specific date
 */
export function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dateStr = date.toISOString().split('T')[0]
  return events.filter(event => event.date === dateStr)
}

/**
 * Mock function to generate sample Google Calendar events for development/testing
 * This should be removed once real Google Calendar integration is complete
 */
export function getMockGoogleCalendarEvents(): CalendarEvent[] {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date(today)
  dayAfter.setDate(dayAfter.getDate() + 2)

  return [
    {
      id: 'mock-1',
      title: 'チームミーティング',
      description: 'プロジェクトの進捗確認',
      startTime: '10:00',
      endTime: '11:00',
      isAllDay: false,
      location: 'オフィス会議室A',
      date: today.toISOString().split('T')[0]
    },
    {
      id: 'mock-2',
      title: 'ランチミーティング',
      startTime: '12:30',
      endTime: '13:30',
      isAllDay: false,
      date: today.toISOString().split('T')[0]
    },
    {
      id: 'mock-3',
      title: '定期健康診断',
      description: '年次健康診断',
      isAllDay: true,
      date: tomorrow.toISOString().split('T')[0]
    },
    {
      id: 'mock-4',
      title: 'クライアントプレゼンテーション',
      description: '新規プロジェクト提案',
      startTime: '15:00',
      endTime: '16:30',
      isAllDay: false,
      location: 'クライアントオフィス',
      date: dayAfter.toISOString().split('T')[0]
    }
  ]
}
