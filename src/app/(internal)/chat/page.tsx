'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { useRouter } from 'next/navigation';
import { ChatRoom } from '@/components/chat/ChatRoom';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, loading: roleLoading } = useRole();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Only authenticated members can access chat
  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md bg-white border border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Required</h2>
          <p className="text-gray-600 mb-6">
            You need to complete your profile before accessing the chat.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Complete Profile
          </a>
        </div>
      </div>
    );
  }

  return <ChatRoom />;
}
