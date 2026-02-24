'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { Alliance, RecruitmentStatus } from '@/types';

export default function AdminAllianceEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isSuperadmin, loading: roleLoading } = useRole();
  const isSuperadminUser = isSuperadmin();
  const allianceId = params?.id;

  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    recruitment_status: 'open' as RecruitmentStatus,
    contact_info: '',
  });

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!isAuthenticated) {
        router.replace(`/login?redirect=/admin/alliances/${allianceId}`);
      } else if (!isSuperadminUser) {
        router.replace('/dashboard');
      } else if (allianceId) {
        fetchAlliance(allianceId);
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, isSuperadminUser, router, allianceId]);

  async function fetchAlliance(id: string) {
    try {
      const { data, error } = await supabase
        .from('alliances')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setAlliance(data);
        setFormData({
          name: data.name,
          description: data.description,
          recruitment_status: data.recruitment_status,
          contact_info: data.contact_info || '',
        });
      }
    } catch (err) {
      console.error('Error fetching alliance:', err);
      setError('Failed to load alliance data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!alliance) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

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
      setSuccess('Alliance updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alliance');
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

  if (!alliance) {
    return (
      <div className="py-8">
        <div className="glass-card rounded-xl border border-slate-800/80 p-8">
          <Link href="/admin/alliances" className="text-slate-400 hover:text-white inline-flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Alliances
          </Link>
          <p className="text-slate-400 mt-4">Alliance not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6 sm:mb-8">
        <Link href="/admin/alliances" className="text-slate-400 hover:text-white mb-4 inline-flex items-center gap-2 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Alliances
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Edit Alliance</h1>
        <p className="text-slate-400">
          Superadmin editing public-facing content for <span className="text-white font-medium">{alliance.name}</span>
        </p>
      </div>

      <div className="max-w-4xl">
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

        <form onSubmit={handleSubmit} className="glass-card rounded-xl border border-slate-800/80 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Alliance Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength={50}
                required
                disabled={saving}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20"
              />
            </div>

            <div>
              <label htmlFor="recruitment_status" className="block text-sm font-medium text-slate-300 mb-2">
                Recruitment Status
              </label>
              <select
                id="recruitment_status"
                value={formData.recruitment_status}
                onChange={(e) => setFormData({ ...formData, recruitment_status: e.target.value as RecruitmentStatus })}
                disabled={saving}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
              >
                <option value="open">Open - Accepting applications</option>
                <option value="invite_only">Invite Only - Contact required</option>
                <option value="closed">Closed - Not recruiting</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
              Public Story / Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              maxLength={5000}
              rows={14}
              required
              disabled={saving}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 resize-y"
            />
            <p className="mt-1 text-xs text-slate-500">{formData.description.length} / 5000 characters</p>
          </div>

          <div>
            <label htmlFor="contact_info" className="block text-sm font-medium text-slate-300 mb-2">
              Contact Information
            </label>
            <textarea
              id="contact_info"
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              maxLength={500}
              rows={3}
              disabled={saving}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 resize-none"
            />
          </div>

          <div className="pt-6 border-t border-slate-800/80 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <Link
              href={`/alliances/${alliance.id}`}
              className="w-full sm:w-auto text-center px-4 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
            >
              View Public Page
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full sm:w-auto justify-center px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
