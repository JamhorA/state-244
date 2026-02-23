'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { Alliance, RecruitmentStatus } from '@/types';

export default function AllianceSettingsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, canEditAlliance, loading: roleLoading } = useRole();
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const dataFetchedRef = useRef(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    recruitment_status: 'open' as RecruitmentStatus,
    contact_info: '',
  });

  useEffect(() => {
    if (!authLoading && !roleLoading && !dataFetchedRef.current) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/alliance/settings');
      } else if (!canEditAlliance()) {
        router.replace('/dashboard');
      } else if (profile?.alliance_id) {
        dataFetchedRef.current = true;
        fetchAlliance();
      } else {
        setLoading(false);
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, profile, router]);

  async function fetchAlliance() {
    if (!profile?.alliance_id) return;

    try {
      const { data } = await supabase
        .from('alliances')
        .select('*')
        .eq('id', profile.alliance_id)
        .single();

      if (data) {
        setAlliance(data);
        setFormData({
          name: data.name,
          description: data.description,
          recruitment_status: data.recruitment_status,
          contact_info: data.contact_info || '',
        });
      }
    } catch (error) {
      console.error('Error fetching alliance:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!alliance) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('alliances')
        .update({
          name: formData.name,
          description: formData.description,
          recruitment_status: formData.recruitment_status,
          contact_info: formData.contact_info || null,
        })
        .eq('id', alliance.id);

      if (updateError) throw updateError;

      setAlliance({
        ...alliance,
        name: formData.name,
        description: formData.description,
        recruitment_status: formData.recruitment_status,
        contact_info: formData.contact_info || null,
      });
      setSuccess('Alliance settings updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || roleLoading || loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile?.alliance_id || !alliance) {
    return (
      <div className="py-8">
        <div className="glass-card rounded-xl border border-slate-800/80 p-12 text-center">
          <p className="text-slate-400">You are not assigned to an alliance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <Link href="/alliance" className="text-slate-400 hover:text-white mb-4 inline-flex items-center gap-2 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Alliance
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Alliance Settings</h1>
        <p className="text-slate-400">Manage your alliance information</p>
      </div>

      <div className="max-w-3xl">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <p className="text-emerald-400">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-card rounded-xl border border-slate-800/80 p-8 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Alliance Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              maxLength={50}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              maxLength={5000}
              rows={8}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 resize-none"
              disabled={saving}
            />
            <p className="mt-1 text-xs text-slate-500">{formData.description.length} / 5000 characters</p>
          </div>

          <div>
            <label htmlFor="recruitment_status" className="block text-sm font-medium text-slate-300 mb-2">
              Recruitment Status
            </label>
            <select
              id="recruitment_status"
              value={formData.recruitment_status}
              onChange={(e) => setFormData({ ...formData, recruitment_status: e.target.value as RecruitmentStatus })}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
              disabled={saving}
            >
              <option value="open">Open - Accepting applications</option>
              <option value="invite_only">Invite Only - Contact required</option>
              <option value="closed">Closed - Not recruiting</option>
            </select>
          </div>

          <div>
            <label htmlFor="contact_info" className="block text-sm font-medium text-slate-300 mb-2">
              Contact Information <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="contact_info"
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 resize-none"
              placeholder="How potential members can contact you..."
              disabled={saving}
            />
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex justify-end gap-4">
            <Link
              href="/alliance"
              className="px-6 py-3 text-slate-400 font-medium hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  Save Changes
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <p className="text-amber-400 text-sm flex items-start gap-2">
            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Changes here affect the public-facing alliance profile page. Make sure your description accurately represents your alliance.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
