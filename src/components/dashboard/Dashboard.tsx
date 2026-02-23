'use client';

import { ProfileDisplay } from './ProfileDisplay';
import { ProfileEdit } from './ProfileEdit';
import { SignOutButton } from '../ui/SignOutButton';
import type { Profile } from '@/types';
import { updateProfile } from '@/lib/profiles';

export function Dashboard({ profile }: { profile: Profile }) {
  const handleSaveProfile = async (
    updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'alliance_id'>>
  ) => {
    await updateProfile(profile.id, updates);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="surface rounded-2xl p-6 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Welcome back to State 244 Hub</p>
        </div>
        <SignOutButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ProfileDisplay profile={profile} />
          <ProfileEdit profile={profile} onSave={handleSaveProfile} />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Links</h2>
          <div className="surface rounded-2xl p-6 space-y-3">
            <a
              href="/chat"
              className="flex items-center p-4 border border-slate-200 rounded-md bg-white/70 hover:bg-white transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Diplomacy Chat</h3>
                <p className="text-sm text-slate-600">Join the global alliance chat</p>
              </div>
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">CH</span>
            </a>

            {(profile.role === 'r4' || profile.role === 'r5') && (
              <a
                href="/applications"
                className="flex items-center p-4 border border-slate-200 rounded-md bg-white/70 hover:bg-white transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Applications</h3>
                  <p className="text-sm text-slate-600">Review migration applications</p>
                </div>
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-slate-200 text-slate-800 text-xs font-semibold">AP</span>
              </a>
            )}

            {(profile.role === 'r4' || profile.role === 'r5') && (
              <a
                href="/ai/text"
                className="flex items-center p-4 border border-slate-200 rounded-md bg-white/70 hover:bg-white transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">AI Text Generator</h3>
                  <p className="text-sm text-slate-600">Create alliance presentations</p>
                </div>
                <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">AT</span>
              </a>
            )}

            <a
              href="/ai/image"
              className="flex items-center p-4 border border-slate-200 rounded-md bg-white/70 hover:bg-white transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">AI Image Generator</h3>
                <p className="text-sm text-slate-600">Generate alliance images</p>
              </div>
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">AI</span>
            </a>
          </div>
        </div>
      </div>

      {profile.role === 'r5' && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-2">Alliance Leader</h3>
          <p className="text-slate-700">
            As an R5, you can manage your alliance, review applications, and generate content.
            Visit the Alliance section to edit your alliance profile.
          </p>
        </div>
      )}

      {profile.role === 'r4' && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-2">Alliance Officer</h3>
          <p className="text-slate-700">
            As an R4, you can review migration applications and generate presentations.
          </p>
        </div>
      )}
    </div>
  );
}
