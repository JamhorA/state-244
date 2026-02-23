'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { StateInfo } from '@/types';

export default function StateInfoPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isSuperadmin, loading: roleLoading } = useRole();
  const [sections, setSections] = useState<StateInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', content: '' });

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/admin/state-info');
      } else if (!isSuperadmin()) {
        router.replace('/dashboard');
      } else {
        fetchSections();
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, isSuperadmin, router]);

  async function fetchSections() {
    try {
      const { data } = await supabase
        .from('state_info')
        .select('*')
        .order('display_order');
      if (data) setSections(data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    } finally {
      setLoading(false);
    }
  }

  function startEditing(section: StateInfo) {
    setEditingSection(section.id);
    setEditForm({ title: section.title, content: section.content });
  }

  function cancelEditing() {
    setEditingSection(null);
    setEditForm({ title: '', content: '' });
  }

  async function saveSection(sectionId: string) {
    setSaving(sectionId);
    try {
      const { error } = await supabase
        .from('state_info')
        .update({
          title: editForm.title,
          content: editForm.content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sectionId);

      if (error) throw error;

      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, title: editForm.title, content: editForm.content }
          : s
      ));
      setEditingSection(null);
    } catch (error) {
      console.error('Error saving section:', error);
    } finally {
      setSaving(null);
    }
  }

  if (authLoading || roleLoading || loading || !isAuthenticated || !isSuperadmin()) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">State Info Editor</h1>
        <p className="text-slate-400">Edit the story, rules, and server information</p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="glass-card rounded-xl border border-slate-800/80 overflow-hidden"
          >
            <div className="px-6 py-4 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                <p className="text-sm text-slate-500">Key: {section.section_key}</p>
              </div>
              {editingSection !== section.id && (
                <button
                  onClick={() => startEditing(section)}
                  className="px-4 py-2 text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>

            {editingSection === section.id ? (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all"
                    disabled={saving === section.id}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 transition-all resize-none"
                    disabled={saving === section.id}
                  />
                </div>
                <div className="flex items-center justify-end gap-4">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-slate-400 font-medium hover:text-white transition-colors"
                    disabled={saving === section.id}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveSection(section.id)}
                    disabled={saving === section.id}
                    className="btn-primary px-6 py-2 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    {saving === section.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <pre className="whitespace-pre-wrap text-slate-300 text-sm font-mono bg-slate-900/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {section.content}
                </pre>
                <p className="mt-4 text-xs text-slate-500">
                  Last updated: {new Date(section.updated_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
