import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useChatMessages } from '@/hooks/use-chat-messages';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

export function ChatRoom() {
  const { user } = useAuth();
  const { messages, loading, error, connected, sendMessage, uploadImage } =
    useChatMessages({ initialLoad: true, realtime: true });
  const [senderNames, setSenderNames] = useState<Record<string, string>>({});

  // Fetch sender names for messages
  useEffect(() => {
    const fetchSenderNames = async () => {
      const userIds = Array.from(new Set(messages.map((m) => m.sender_id)));
      if (userIds.length === 0) return;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      if (profiles) {
        const namesMap = profiles.reduce((acc, profile) => {
          if (profile.id) {
            acc[profile.id] = profile.display_name || 'Unknown';
          }
          return acc;
        }, {} as Record<string, string>);

        setSenderNames(namesMap);
      }
    };

    fetchSenderNames();
  }, [messages]);

  const handleSend = async (content: string, image?: File) => {
    let imageUrl: string | undefined;

    if (image) {
      try {
        imageUrl = await uploadImage(image);
      } catch (err) {
        console.error('Failed to upload image:', err);
        alert('Failed to upload image. Please try again.');
        return;
      }
    }

    try {
      await sendMessage(content, imageUrl);
    } catch (err) {
      console.error('Failed to send message:', err);
      alert('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              State 244 Diplomacy
            </h1>
            <p className="text-sm text-gray-600">
              {connected ? (
                <span className="flex items-center text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center text-yellow-600">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
                  Connecting...
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Messages List */}
      <MessageList
        messages={messages}
        loading={loading}
        currentUserId={user?.id}
        senderNames={senderNames}
      />

      {/* Message Input */}
      <MessageInput onSend={handleSend} disabled={!user} />
    </div>
  );
}
