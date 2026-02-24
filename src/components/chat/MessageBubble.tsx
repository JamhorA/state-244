import type { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  senderName?: string;
}

export function MessageBubble({ message, isOwnMessage, senderName }: MessageBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
        {/* Sender Name (not shown for own messages) */}
        {!isOwnMessage && senderName && (
          <p className="text-xs text-gray-500 mb-1 ml-2">
            {senderName}
          </p>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwnMessage
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }`}
        >
          {/* Text Content */}
          {message.content && (
            <p className="break-words whitespace-pre-wrap">{message.content}</p>
          )}

          {/* Image Attachment */}
          {message.image_url && (
            <img
              src={message.image_url}
              alt="Shared image"
              className="mt-2 rounded-lg max-w-full"
              loading="lazy"
            />
          )}

          {/* Timestamp */}
          <p
            suppressHydrationWarning
            className={`text-xs mt-1 ${
              isOwnMessage ? 'text-blue-200' : 'text-gray-500'
            }`}
          >
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}
