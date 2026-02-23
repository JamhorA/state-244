'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import type { PresentationTone } from '@/types';
import { AITextForm } from '@/components/ai/AITextForm';

export default function AITextPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, role: userRole, loading: roleLoading } = useRole();

  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Check if user is R4 or R5
  const isOfficer = userRole === 'r4' || userRole === 'r5';

  if (!isOfficer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md bg-white border border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            Only alliance officers (R4) and leaders (R5) can generate AI presentations.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const handleGenerate = async (bulletPoints: string[], tone: PresentationTone) => {
    setLoading(true);
    setError(null);
    setGeneratedContent('');

    try {
      const response = await fetch('/api/ai/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulletPoints, tone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate presentation');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate presentation');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (bulletPoints: string[], tone: PresentationTone, content: string) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/alliance/presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulletPoints, tone, content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save presentation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save presentation');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (content: string) => {
    setPublishing(true);
    setError(null);

    try {
      const response = await fetch('/api/alliance/presentation', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presentationId: crypto.randomUUID(), // This would be set when saving a draft first
          content,
          isPublished: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to publish presentation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish presentation');
      throw err;
    } finally {
      setPublishing(false);
    }
  };

  const canPublish = userRole === 'r5';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Presentation Generator
          </h1>
          <p className="text-gray-600 mt-2">
            Generate compelling alliance presentation text using AI. Provide bullet points and select a tone, then edit and publish.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This feature uses OpenAI GPT-4 to generate presentations.
                Generated content should be reviewed and edited before publishing.
                Only R5 leaders can publish to the alliance profile.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <AITextForm
            onGenerate={handleGenerate}
            onSave={handleSave}
            onPublish={handlePublish}
            loading={loading}
            saving={saving}
            publishing={publishing}
            canPublish={canPublish}
            generatedContent={generatedContent}
          />
        </div>

        {/* Alliance Name (if applicable) */}
        {profile?.alliance_id && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Presentation will be created for your alliance.
          </div>
        )}
      </div>
    </div>
  );
}
