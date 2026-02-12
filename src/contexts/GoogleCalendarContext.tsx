import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface GoogleCalendarContextType {
  isConnected: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const GoogleCalendarContext = createContext<GoogleCalendarContextType | undefined>(undefined);

export function useGoogleCalendarContext() {
  const context = useContext(GoogleCalendarContext);
  if (context === undefined) {
    throw new Error('useGoogleCalendarContext must be used within a GoogleCalendarProvider');
  }
  return context;
}

interface GoogleCalendarProviderProps {
  children: React.ReactNode;
}

export function GoogleCalendarProvider({ children }: GoogleCalendarProviderProps) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    if (!user) {
      setIsConnected(false);
      setLoading(false);
      return;
    }

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
  }, [user]);

  const refresh = useCallback(async () => {
    await checkStatus();
  }, [checkStatus]);

  // Check status once on mount when user is available
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const value = {
    isConnected,
    loading,
    refresh,
  };

  return <GoogleCalendarContext.Provider value={value}>{children}</GoogleCalendarContext.Provider>;
}
