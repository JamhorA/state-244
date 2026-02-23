'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { MigrationApplication } from '@/types';

interface UseRealtimeOptions<T> {
  table: string;
  filter?: string;
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  initialData?: T[];
}

export function useRealtime<T = any>({
  table,
  filter,
  event = '*',
  initialData = [],
}: UseRealtimeOptions<T>) {
  const [data, setData] = useState<T[]>(initialData);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Subscribe to table changes
    const channel: RealtimeChannel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: event,
          schema: 'public',
          table: table,
          filter: filter,
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              setData(prev => [...prev, payload.new as T]);
              break;
            case 'UPDATE':
              setData(prev =>
                prev.map(item =>
                  (item as any).id === payload.new.id ? (payload.new as T) : item
                )
              );
              break;
            case 'DELETE':
              setData(prev => prev.filter(item => (item as any).id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, event]);

  return {
    data,
    connected,
  };
}

// Hook for listening to application status changes specifically
export function useApplicationRealtime(allianceId: string) {
  const { data, connected } = useRealtime<MigrationApplication>({
    table: 'migration_applications',
    filter: `target_alliance_id=eq.${allianceId}`,
    event: 'UPDATE',
  });

  return {
    applications: data,
    connected,
  };
}
