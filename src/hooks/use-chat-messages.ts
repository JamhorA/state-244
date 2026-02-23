'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/types';

interface UseChatMessagesOptions {
  initialLoad?: boolean;
  realtime?: boolean;
}

export function useChatMessages({
  initialLoad = true,
  realtime = true,
}: UseChatMessagesOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(initialLoad);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_name', 'state-244-diplomacy')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        throw error;
      }

      setMessages(data || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoad) {
      fetchMessages();
    }
  }, [initialLoad, fetchMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!realtime) return;

    const channel = supabase
      .channel('chat-messages-public')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: 'room_name=eq.state-244-diplomacy',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtime]);

  const sendMessage = useCallback(async (
    content: string,
    imageUrl?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        room_name: 'state-244-diplomacy',
        sender_id: user.id,
        content,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as ChatMessage;
  }, []);

  const uploadImage = useCallback(async (file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `chat/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('private')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Create signed URL
    const { data: urlData } = await supabase.storage
      .from('private')
      .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours

    if (urlData?.signedUrl) {
      return urlData.signedUrl;
    }

    throw new Error('Failed to create image URL');
  }, []);

  const refresh = useCallback(() => fetchMessages(), [fetchMessages]);

  return {
    messages,
    loading,
    error,
    connected,
    sendMessage,
    uploadImage,
    refresh,
  };
}
