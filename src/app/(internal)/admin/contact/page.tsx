'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';

type ContactStatus = 'new' | 'read' | 'replied' | 'archived';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  source_path: string;
  ip_address: string | null;
  user_agent: string | null;
  status: ContactStatus;
  created_at: string;
}

const STATUS_OPTIONS: ContactStatus[] = ['new', 'read', 'replied', 'archived'];

export default function AdminContactPage() {
  const router = useRouter();
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const { isSuperadmin, loading: roleLoading } = useRole();
  const isSuperadminUser = isSuperadmin();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | ContactStatus>('all');
  const [search, setSearch] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/admin/contact');
      } else if (!isSuperadminUser) {
        router.replace('/dashboard');
      }
    }
  }, [authLoading, roleLoading, isAuthenticated, isSuperadminUser, router]);

  useEffect(() => {
    if (authLoading || roleLoading || !isAuthenticated || !isSuperadminUser) return;
    void fetchMessages();
  }, [authLoading, roleLoading, isAuthenticated, isSuperadminUser, statusFilter, search]);

  const selectedMessage = useMemo(
    () => messages.find((m) => m.id === selectedId) ?? messages[0] ?? null,
    [messages, selectedId]
  );

  async function fetchMessages() {
    if (!session?.access_token) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('q', search.trim());
      params.set('limit', '100');

      const response = await fetch(`/api/admin/contact?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to load messages');

      const nextMessages = (data.messages || []) as ContactMessage[];
      setMessages(nextMessages);

      if (nextMessages.length === 0) {
        setSelectedId(null);
      } else if (!nextMessages.some((m) => m.id === selectedId)) {
        setSelectedId(nextMessages[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(messageId: string, status: ContactStatus) {
    if (!session?.access_token) return;
    setUpdatingId(messageId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/contact/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to update status');

      const updated = data.message as ContactMessage;
      setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  }

  function formatTopic(topic: string) {
    return topic
      .split('_')
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  }

  function statusBadgeClass(status: ContactStatus) {
    switch (status) {
      case 'new':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/30';
      case 'read':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'replied':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'archived':
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  }

  const counts = useMemo(() => {
    const base = { all: messages.length, new: 0, read: 0, replied: 0, archived: 0 };
    for (const msg of messages) base[msg.status] += 1;
    return base;
  }, [messages]);

  if (authLoading || roleLoading || !isAuthenticated || !isSuperadminUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">Contact Inbox</h1>
            <span className="px-3 py-1 rounded-full border border-slate-700 text-sm text-slate-300">
              {messages.length} loaded
            </span>
          </div>
          <p className="text-slate-400 mt-2">Review incoming messages and track response status</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="px-4 py-2.5 rounded-xl border border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            Back to Admin
          </Link>
          <button
            onClick={() => void fetchMessages()}
            className="btn-primary px-4 py-2.5 rounded-xl text-white font-semibold"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <section className="glass-card rounded-2xl border border-slate-800/80 overflow-hidden">
          <div className="p-4 border-b border-slate-800/80 space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['all', ...STATUS_OPTIONS] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg border text-sm whitespace-nowrap transition-colors ${
                    statusFilter === status
                      ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                      : 'border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {status === 'all' ? 'All' : status[0].toUpperCase() + status.slice(1)} ({counts[status] ?? 0})
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSearch(searchDraft);
                }}
                placeholder="Search name, email, message..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500/40"
              />
              <button
                onClick={() => setSearch(searchDraft)}
                className="px-4 py-2.5 rounded-xl border border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600"
              >
                Search
              </button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-slate-400">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-slate-500">No contact messages found.</div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedId(msg.id)}
                    className={`w-full text-left p-4 transition-colors ${
                      selectedMessage?.id === msg.id ? 'bg-slate-800/50' : 'hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{msg.name}</p>
                        <p className="text-sm text-slate-400 truncate">{msg.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-md border text-xs font-medium ${statusBadgeClass(msg.status)}`}>
                        {msg.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <span>{formatTopic(msg.topic)}</span>
                      <span>•</span>
                      <span>{new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300 line-clamp-2">
                      {msg.message}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="glass-card rounded-2xl border border-slate-800/80 min-h-[520px]">
          {!selectedMessage ? (
            <div className="p-8 text-slate-500">Select a message to view details.</div>
          ) : (
            <div className="p-6 lg:p-7">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedMessage.name}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <a
                      href={`mailto:${encodeURIComponent(selectedMessage.email)}?subject=${encodeURIComponent(`Re: ${formatTopic(selectedMessage.topic)} inquiry`)}`}
                      className="text-sky-300 hover:text-sky-200 underline underline-offset-2"
                    >
                      {selectedMessage.email}
                    </a>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{formatTopic(selectedMessage.topic)}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{new Date(selectedMessage.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <span className={`self-start px-3 py-1.5 rounded-lg border text-sm font-medium ${statusBadgeClass(selectedMessage.status)}`}>
                  {selectedMessage.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Source</p>
                  <p className="text-slate-300 text-sm break-all">{selectedMessage.source_path || '/contact'}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">IP Address</p>
                  <p className="text-slate-300 text-sm break-all">{selectedMessage.ip_address || 'Unknown'}</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5 mb-6">
                <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">Message</p>
                <pre className="whitespace-pre-wrap break-words text-slate-200 font-sans leading-relaxed">
                  {selectedMessage.message}
                </pre>
              </div>

              {selectedMessage.user_agent && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4 mb-6">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">User Agent</p>
                  <p className="text-xs text-slate-400 break-all">{selectedMessage.user_agent}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 pt-2">
                <a
                  href={`mailto:${encodeURIComponent(selectedMessage.email)}?subject=${encodeURIComponent(`Re: ${formatTopic(selectedMessage.topic)} inquiry`)}`}
                  onClick={() => {
                    if (selectedMessage.status !== 'replied') {
                      void updateStatus(selectedMessage.id, 'replied');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors text-center"
                >
                  Reply by Email (marks replied)
                </a>

                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => void updateStatus(selectedMessage.id, status)}
                    disabled={updatingId === selectedMessage.id || selectedMessage.status === status}
                    className={`px-4 py-2.5 rounded-xl border text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedMessage.status === status
                        ? statusBadgeClass(status)
                        : 'border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {updatingId === selectedMessage.id && selectedMessage.status !== status ? 'Updating...' : `Mark ${status}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
