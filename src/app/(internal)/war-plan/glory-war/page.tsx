'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';
import { supabase } from '@/lib/supabase';
import type { WarPlan, WarPlanAssignment, WarRosterPlayer } from '@/types';

type TeamKey = 'pool' | 'attacker' | 'defender';

interface GloryWarLoadResponse {
  roster: WarRosterPlayer[];
  plan: WarPlan | null;
  assignments: WarPlanAssignment[];
}

interface RosterFormState {
  player_name: string;
  notes: string;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function reorderList<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export default function GloryWarPlanPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { profile, isOfficer, loading: roleLoading } = useRole();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rosterSaving, setRosterSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [planTitle, setPlanTitle] = useState('Glory War Plan');
  const [roster, setRoster] = useState<WarRosterPlayer[]>([]);
  const [attackerIds, setAttackerIds] = useState<string[]>([]);
  const [defenderIds, setDefenderIds] = useState<string[]>([]);
  const [draggingPlayerId, setDraggingPlayerId] = useState<string | null>(null);
  const [attackerSearch, setAttackerSearch] = useState('');
  const [defenderSearch, setDefenderSearch] = useState('');
  const [rosterForm, setRosterForm] = useState<RosterFormState>({ player_name: '', notes: '' });
  const [editingRosterId, setEditingRosterId] = useState<string | null>(null);
  const [editingRosterForm, setEditingRosterForm] = useState<RosterFormState>({ player_name: '', notes: '' });

  const isOfficerUser = isOfficer();
  const allianceId = profile?.alliance_id ?? null;

  const rosterMap = useMemo(() => {
    const map = new Map<string, WarRosterPlayer>();
    roster.forEach((player) => map.set(player.id, player));
    return map;
  }, [roster]);

  const assignedIds = useMemo(() => new Set([...attackerIds, ...defenderIds]), [attackerIds, defenderIds]);

  const poolPlayers = useMemo(
    () => roster.filter((player) => !assignedIds.has(player.id)),
    [roster, assignedIds],
  );

  const attackerPlayers = useMemo(
    () => attackerIds.map((id) => rosterMap.get(id)).filter(Boolean) as WarRosterPlayer[],
    [attackerIds, rosterMap],
  );

  const defenderPlayers = useMemo(
    () => defenderIds.map((id) => rosterMap.get(id)).filter(Boolean) as WarRosterPlayer[],
    [defenderIds, rosterMap],
  );

  const filteredAttackerPlayers = useMemo(() => {
    const query = attackerSearch.trim().toLowerCase();
    if (!query) return attackerPlayers;
    return attackerPlayers.filter((player) => {
      const haystack = `${player.player_name} ${player.notes ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [attackerPlayers, attackerSearch]);

  const filteredDefenderPlayers = useMemo(() => {
    const query = defenderSearch.trim().toLowerCase();
    if (!query) return defenderPlayers;
    return defenderPlayers.filter((player) => {
      const haystack = `${player.player_name} ${player.notes ?? ''}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [defenderPlayers, defenderSearch]);

  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!isAuthenticated) {
        router.replace('/login?redirect=/war-plan/glory-war');
      } else if (!isOfficerUser) {
        router.replace('/dashboard');
      } else if (!allianceId) {
        router.replace('/dashboard');
      } else {
        void loadData();
      }
    }
    // allianceId/profile can change after auth loads
  }, [authLoading, roleLoading, isAuthenticated, isOfficerUser, allianceId, router]);

  async function getAccessToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function loadData() {
    try {
      setError(null);
      setLoading(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/war-plan/glory-war', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json() as GloryWarLoadResponse & { error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load Glory War plan');
      }

      setRoster(data.roster ?? []);
      setPlanTitle(data.plan?.title || 'Glory War Plan');

      const nextAttackers = (data.assignments ?? [])
        .filter((a) => a.team === 'attacker')
        .sort((a, b) => a.position - b.position)
        .map((a) => a.roster_player_id);

      const nextDefenders = (data.assignments ?? [])
        .filter((a) => a.team === 'defender')
        .sort((a, b) => a.position - b.position)
        .map((a) => a.roster_player_id);

      setAttackerIds(nextAttackers);
      setDefenderIds(nextDefenders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function clearNotices() {
    setError(null);
    setSuccess(null);
  }

  async function handleAddRosterPlayer(e: React.FormEvent) {
    e.preventDefault();
    clearNotices();

    const name = rosterForm.player_name.trim();
    if (!name) {
      setError('Player name is required');
      return;
    }

    try {
      setRosterSaving(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/war-plan/roster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rosterForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add roster player');
      }

      setRoster((prev) => [...prev, data.player].sort((a, b) => a.player_name.localeCompare(b.player_name)));
      setRosterForm({ player_name: '', notes: '' });
      setSuccess(`Added "${data.player.player_name}" to roster`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add roster player');
    } finally {
      setRosterSaving(false);
    }
  }

  function startEditRosterPlayer(player: WarRosterPlayer) {
    setEditingRosterId(player.id);
    setEditingRosterForm({
      player_name: player.player_name,
      notes: player.notes || '',
    });
    clearNotices();
  }

  function cancelEditRosterPlayer() {
    setEditingRosterId(null);
    setEditingRosterForm({ player_name: '', notes: '' });
  }

  async function saveRosterPlayerEdit() {
    if (!editingRosterId) return;
    clearNotices();

    const name = editingRosterForm.player_name.trim();
    if (!name) {
      setError('Player name is required');
      return;
    }

    try {
      setRosterSaving(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/war-plan/roster/${editingRosterId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingRosterForm),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update roster player');
      }

      setRoster((prev) => prev.map((player) => (player.id === editingRosterId ? data.player : player)));
      setSuccess(`Updated "${data.player.player_name}"`);
      cancelEditRosterPlayer();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update roster player');
    } finally {
      setRosterSaving(false);
    }
  }

  async function handleDeleteRosterPlayer(player: WarRosterPlayer) {
    const confirmed = window.confirm(`Remove "${player.player_name}" from the war roster?`);
    if (!confirmed) return;

    clearNotices();
    try {
      setRosterSaving(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch(`/api/war-plan/roster/${player.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete roster player');
      }

      setRoster((prev) => prev.filter((p) => p.id !== player.id));
      setAttackerIds((prev) => prev.filter((id) => id !== player.id));
      setDefenderIds((prev) => prev.filter((id) => id !== player.id));
      setSuccess(`Removed "${player.player_name}" from roster`);
      if (editingRosterId === player.id) {
        cancelEditRosterPlayer();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete roster player');
    } finally {
      setRosterSaving(false);
    }
  }

  function removeFromAllTeams(playerId: string) {
    setAttackerIds((prev) => prev.filter((id) => id !== playerId));
    setDefenderIds((prev) => prev.filter((id) => id !== playerId));
  }

  function movePlayerToTeam(playerId: string, team: Exclude<TeamKey, 'pool'>, insertIndex?: number) {
    setAttackerIds((prev) => prev.filter((id) => id !== playerId));
    setDefenderIds((prev) => prev.filter((id) => id !== playerId));

    const setTarget = team === 'attacker' ? setAttackerIds : setDefenderIds;
    setTarget((prev) => {
      const without = prev.filter((id) => id !== playerId);
      const index = insertIndex === undefined ? without.length : Math.max(0, Math.min(insertIndex, without.length));
      const next = [...without];
      next.splice(index, 0, playerId);
      return next;
    });
  }

  function movePlayerToPool(playerId: string) {
    removeFromAllTeams(playerId);
  }

  function moveAllPlayersToTeam(team: Exclude<TeamKey, 'pool'>) {
    clearNotices();
    const allRosterIds = roster.map((player) => player.id);
    if (team === 'attacker') {
      setAttackerIds(allRosterIds);
      setDefenderIds([]);
    } else {
      setDefenderIds(allRosterIds);
      setAttackerIds([]);
    }
  }

  function moveWithinTeam(team: Exclude<TeamKey, 'pool'>, index: number, direction: -1 | 1) {
    const setTeam = team === 'attacker' ? setAttackerIds : setDefenderIds;
    setTeam((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      return reorderList(prev, index, nextIndex);
    });
  }

  function onDragStart(playerId: string) {
    setDraggingPlayerId(playerId);
  }

  function onDragEnd() {
    setDraggingPlayerId(null);
  }

  function handleDrop(team: TeamKey, insertIndex?: number) {
    if (!draggingPlayerId) return;
    clearNotices();
    if (team === 'pool') {
      movePlayerToPool(draggingPlayerId);
    } else {
      movePlayerToTeam(draggingPlayerId, team, insertIndex);
    }
    setDraggingPlayerId(null);
  }

  async function handleSavePlan() {
    clearNotices();
    try {
      setSaving(true);
      const token = await getAccessToken();
      if (!token) throw new Error('Authentication required');

      const response = await fetch('/api/war-plan/glory-war', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: planTitle,
          attackerIds,
          defenderIds,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save plan');
      }

      setSuccess(data.message || 'Plan saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan');
    } finally {
      setSaving(false);
    }
  }

  function exportExcel() {
    clearNotices();
    const workbook = XLSX.utils.book_new();

    const attackersRows = attackerPlayers.map((player, index) => ({
      Position: index + 1,
      Player: player.player_name,
      Notes: player.notes ?? '',
    }));

    const defendersRows = defenderPlayers.map((player, index) => ({
      Position: index + 1,
      Player: player.player_name,
      Notes: player.notes ?? '',
    }));

    const unassignedRows = poolPlayers.map((player) => ({
      Player: player.player_name,
      Notes: player.notes ?? '',
    }));

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(attackersRows.length ? attackersRows : [{ Position: '', Player: '', Notes: '' }]), 'Attackers');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(defendersRows.length ? defendersRows : [{ Position: '', Player: '', Notes: '' }]), 'Defenders');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(unassignedRows.length ? unassignedRows : [{ Player: '', Notes: '' }]), 'Unassigned');

    const now = new Date();
    const filename = `glory-war-plan_${now.toISOString().slice(0, 10)}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.xlsx`;
    XLSX.writeFile(workbook, filename);
    setSuccess('Excel export generated');
  }

  function exportImage() {
    clearNotices();

    const columnWidth = 420;
    const padding = 32;
    const lineHeight = 28;
    const headerHeight = 110;
    const footerHeight = 40;
    const rowCount = Math.max(attackerPlayers.length, defenderPlayers.length, 6);
    const canvasWidth = padding * 2 + columnWidth * 2 + 24;
    const canvasHeight = headerHeight + footerHeight + rowCount * lineHeight + 120;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Unable to generate image export');
      return;
    }

    // Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
    gradient.addColorStop(1, 'rgba(251, 191, 36, 0.08)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px Segoe UI';
    ctx.fillText(planTitle || 'Glory War Plan', padding, 42);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px Segoe UI';
    ctx.fillText(`Alliance: ${profile?.display_name || 'Officer'} | ${new Date().toLocaleString()}`, padding, 72);

    const columns = [
      { title: 'Attackers', color: '#f59e0b', x: padding, players: attackerPlayers },
      { title: 'Defenders', color: '#38bdf8', x: padding + columnWidth + 24, players: defenderPlayers },
    ];

    for (const column of columns) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(column.x, 92, columnWidth, canvasHeight - 140);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)';
      ctx.strokeRect(column.x, 92, columnWidth, canvasHeight - 140);

      ctx.fillStyle = column.color;
      ctx.font = 'bold 18px Segoe UI';
      ctx.fillText(column.title, column.x + 16, 122);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
      ctx.beginPath();
      ctx.moveTo(column.x + 16, 136);
      ctx.lineTo(column.x + columnWidth - 16, 136);
      ctx.stroke();

      ctx.font = '15px Segoe UI';
      column.players.forEach((player, index) => {
        const y = 168 + index * lineHeight;
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(`${index + 1}.`, column.x + 16, y);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(player.player_name, column.x + 48, y);
      });

      if (column.players.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.fillText('No players assigned', column.x + 16, 170);
      }
    }

    ctx.fillStyle = '#64748b';
    ctx.font = '13px Segoe UI';
    ctx.fillText(`Unassigned roster: ${poolPlayers.length}`, padding, canvasHeight - 22);

    canvas.toBlob((blob) => {
      if (!blob) {
        setError('Failed to create image export');
        return;
      }
      const now = new Date();
      const filename = `glory-war-plan_${now.toISOString().slice(0, 10)}.png`;
      downloadBlob(filename, blob);
      setSuccess('Image export generated');
    }, 'image/png');
  }

  function renderPlayerCard(
    player: WarRosterPlayer,
    options: {
      team: TeamKey;
      index?: number;
      compact?: boolean;
    },
  ) {
    const inAttackers = attackerIds.includes(player.id);
    const inDefenders = defenderIds.includes(player.id);

    return (
      <div
        key={`${options.team}-${player.id}`}
        draggable
        onDragStart={() => onDragStart(player.id)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleDrop(options.team, options.index);
        }}
        className="rounded-xl border border-slate-700/70 bg-slate-900/60 p-3 hover:border-slate-500/60 transition-colors cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-white truncate">{player.player_name}</p>
            {player.notes && <p className="text-xs text-slate-500 mt-1 truncate">{player.notes}</p>}
          </div>
          <button
            type="button"
            onClick={() => startEditRosterPlayer(player)}
            className="text-slate-400 hover:text-white p-1"
            title="Edit roster player"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L12 16H9v-3l9.6-9.4z" />
            </svg>
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {options.team !== 'attacker' && (
            <button
              type="button"
              onClick={() => movePlayerToTeam(player.id, 'attacker')}
              className={`px-2.5 py-1 text-xs rounded-lg border ${inAttackers ? 'border-amber-400/30 text-amber-300 bg-amber-500/10' : 'border-slate-700 text-slate-300 hover:border-amber-400/30'}`}
            >
              Attackers
            </button>
          )}
          {options.team !== 'defender' && (
            <button
              type="button"
              onClick={() => movePlayerToTeam(player.id, 'defender')}
              className={`px-2.5 py-1 text-xs rounded-lg border ${inDefenders ? 'border-sky-400/30 text-sky-300 bg-sky-500/10' : 'border-slate-700 text-slate-300 hover:border-sky-400/30'}`}
            >
              Defenders
            </button>
          )}
          {options.team !== 'pool' && (
            <button
              type="button"
              onClick={() => movePlayerToPool(player.id)}
              className="px-2.5 py-1 text-xs rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500"
            >
              Remove
            </button>
          )}
          {options.team !== 'pool' && typeof options.index === 'number' && (
            <>
              <button
                type="button"
                onClick={() => moveWithinTeam(options.team as 'attacker' | 'defender', options.index!, -1)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveWithinTeam(options.team as 'attacker' | 'defender', options.index!, 1)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-700 text-slate-300 hover:text-white"
                title="Move down"
              >
                ↓
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (authLoading || roleLoading || loading || !isAuthenticated || !isOfficerUser || !allianceId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-slate-500 mb-1">War Plan / Glory War</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Glory War Planner</h1>
          <p className="text-slate-400 mt-2">Build your attacker and defender teams from your alliance roster.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={exportImage}
            className="w-full sm:w-auto px-4 py-3 rounded-xl border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 transition-colors"
          >
            Export Image
          </button>
          <button
            type="button"
            onClick={exportExcel}
            className="w-full sm:w-auto px-4 py-3 rounded-xl border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 hover:border-emerald-400/40 transition-colors"
          >
            Export Excel
          </button>
          <button
            type="button"
            onClick={handleSavePlan}
            disabled={saving}
            className="w-full sm:w-auto btn-primary px-5 py-3 rounded-xl text-white font-bold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Plan'}
          </button>
        </div>
      </div>

      {(error || success) && (
        <div className={`rounded-xl border p-4 ${error ? 'border-red-500/20 bg-red-500/10' : 'border-emerald-500/20 bg-emerald-500/10'}`}>
          <p className={error ? 'text-red-400' : 'text-emerald-400'}>{error || success}</p>
        </div>
      )}

      <div className="glass-card rounded-xl border border-slate-800/80 p-4 sm:p-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">Plan Title</label>
        <input
          type="text"
          value={planTitle}
          onChange={(e) => setPlanTitle(e.target.value)}
          maxLength={100}
          className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
          placeholder="Glory War Plan"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
        <div className="space-y-6">
          <div className="glass-card rounded-xl border border-slate-800/80 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-white">Alliance Roster</h2>
              <span className="text-xs text-slate-500">{roster.length} players</span>
            </div>

            <form onSubmit={handleAddRosterPlayer} className="space-y-3 mb-5">
              <input
                type="text"
                value={rosterForm.player_name}
                onChange={(e) => setRosterForm((prev) => ({ ...prev, player_name: e.target.value }))}
                placeholder="Add player name"
                maxLength={50}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
              />
              <input
                type="text"
                value={rosterForm.notes}
                onChange={(e) => setRosterForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional note (e.g. tank, rally lead)"
                maxLength={250}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
              />
              <button
                type="submit"
                disabled={rosterSaving}
                className="w-full btn-primary px-4 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
              >
                {rosterSaving ? 'Saving...' : 'Add Roster Player'}
              </button>
            </form>

            {editingRosterId && (
              <div className="mb-5 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 space-y-3">
                <p className="text-sm font-medium text-sky-300">Edit Roster Player</p>
                <input
                  type="text"
                  value={editingRosterForm.player_name}
                  onChange={(e) => setEditingRosterForm((prev) => ({ ...prev, player_name: e.target.value }))}
                  maxLength={50}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                />
                <input
                  type="text"
                  value={editingRosterForm.notes}
                  onChange={(e) => setEditingRosterForm((prev) => ({ ...prev, notes: e.target.value }))}
                  maxLength={250}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-sky-500/50"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={saveRosterPlayerEdit}
                    disabled={rosterSaving}
                    className="w-full sm:flex-1 btn-primary px-4 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditRosterPlayer}
                    className="w-full sm:flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div
              className="space-y-3 max-h-[420px] overflow-y-auto pr-1"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop('pool');
              }}
            >
              {poolPlayers.length > 0 ? (
                poolPlayers.map((player) => renderPlayerCard(player, { team: 'pool' }))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-700/70 p-5 text-center text-slate-500 text-sm">
                  All roster players are assigned to teams.
                </div>
              )}
            </div>

            {roster.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Manage Roster</p>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {roster.map((player) => (
                    <div key={`manage-${player.id}`} className="flex items-center gap-2 rounded-lg border border-slate-800/70 bg-slate-900/30 p-2">
                      <span className="text-sm text-slate-200 truncate flex-1">{player.player_name}</span>
                      <button
                        type="button"
                        onClick={() => startEditRosterPlayer(player)}
                        className="px-2 py-1 text-xs rounded border border-slate-700 text-slate-300 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRosterPlayer(player)}
                        className="px-2 py-1 text-xs rounded border border-red-500/20 text-red-300 hover:text-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl border border-amber-500/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Attackers</h2>
                <span className="px-2 py-1 rounded-lg text-xs bg-amber-500/10 text-amber-300 border border-amber-400/20">
                  {attackerPlayers.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => moveAllPlayersToTeam('attacker')}
                disabled={roster.length === 0}
                className="w-full sm:w-auto px-3 py-2 text-xs font-medium rounded-lg border border-amber-400/20 text-amber-300 hover:text-amber-200 hover:border-amber-300/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Move All Here
              </button>
            </div>
            <div className="mb-3">
              <input
                type="text"
                value={attackerSearch}
                onChange={(e) => setAttackerSearch(e.target.value)}
                placeholder="Search attackers..."
                className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400/40"
              />
            </div>
            <div
              className="space-y-3 min-h-[220px] rounded-xl border border-dashed border-amber-500/20 p-3 bg-amber-500/5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop('attacker');
              }}
            >
              {filteredAttackerPlayers.length > 0 ? (
                filteredAttackerPlayers.map((player) =>
                  renderPlayerCard(player, {
                    team: 'attacker',
                    index: attackerIds.indexOf(player.id),
                  }),
                )
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500 text-center px-4">
                  {attackerPlayers.length > 0 ? 'No attackers match your search' : 'Drag players here for the attacker team'}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card rounded-xl border border-sky-500/20 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-white">Defenders</h2>
                <span className="px-2 py-1 rounded-lg text-xs bg-sky-500/10 text-sky-300 border border-sky-400/20">
                  {defenderPlayers.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => moveAllPlayersToTeam('defender')}
                disabled={roster.length === 0}
                className="w-full sm:w-auto px-3 py-2 text-xs font-medium rounded-lg border border-sky-400/20 text-sky-300 hover:text-sky-200 hover:border-sky-300/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Move All Here
              </button>
            </div>
            <div className="mb-3">
              <input
                type="text"
                value={defenderSearch}
                onChange={(e) => setDefenderSearch(e.target.value)}
                placeholder="Search defenders..."
                className="w-full px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-400/40"
              />
            </div>
            <div
              className="space-y-3 min-h-[220px] rounded-xl border border-dashed border-sky-500/20 p-3 bg-sky-500/5"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop('defender');
              }}
            >
              {filteredDefenderPlayers.length > 0 ? (
                filteredDefenderPlayers.map((player) =>
                  renderPlayerCard(player, {
                    team: 'defender',
                    index: defenderIds.indexOf(player.id),
                  }),
                )
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500 text-center px-4">
                  {defenderPlayers.length > 0 ? 'No defenders match your search' : 'Drag players here for the defender team'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

