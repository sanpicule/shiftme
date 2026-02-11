import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface GoogleCalendarStatus {
  isConnected: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useGoogleCalendarStatus(): GoogleCalendarStatus {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setIsConnected(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('google-calendar-status', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (error) {
        throw error;
      }
      setIsConnected(Boolean(data?.connected));
    } catch (error) {
      console.error('Error checking Google Calendar status:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { isConnected, loading, refresh };
}
