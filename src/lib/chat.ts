import { supabase } from './supabase';
import type { ChatMessage } from '@/types';

/**
 * Fetch chat message history for the global "State 244 Diplomacy" room
 */
export async function fetchChatMessages(limit = 50, offset = 0): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('room_name', 'state-244-diplomacy')
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching chat messages:', error);
    throw new Error('Failed to load messages');
  }

  return data || [];
}

/**
 * Send a new chat message to the global room
 */
export async function sendChatMessage(
  content: string,
  userId: string,
  imageUrl?: string
): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_name: 'state-244-diplomacy',
      sender_id: userId,
      content,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending chat message:', error);
    throw new Error('Failed to send message');
  }

  return data;
}

/**
 * Upload an image to private storage for chat
 */
export async function uploadChatImage(
  file: File,
  userId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `chat/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('private')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading chat image:', error);
    throw new Error('Failed to upload image');
  }

  // Get public URL (actually signed URL since it's private storage)
  const { data: urlData } = await supabase.storage
    .from('private')
    .createSignedUrl(filePath, 60 * 60 * 24); // 24 hours

  if (urlData?.signedUrl) {
    return urlData.signedUrl;
  }

  // Fallback: return the path (should work with RLS policies)
  return filePath;
}

/**
 * Subscribe to realtime chat messages for the global room
 */
export function subscribeToChatMessages(
  callback: (payload: any) => void
): () => void {
  const channel = supabase
    .channel('chat-messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: 'room_name=eq.state-244-diplomacy',
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
