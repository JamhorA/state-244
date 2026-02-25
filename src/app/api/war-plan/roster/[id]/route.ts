import { NextRequest, NextResponse } from 'next/server';
import { requireWarPlanEditor } from '../../_lib';

type RouteContext = { params: Promise<{ id: string }> };

async function getRosterPlayerForAlliance(
  supabaseAdmin: any,
  rosterPlayerId: string,
  allianceId: string,
) {
  return supabaseAdmin
    .from('war_roster_players')
    .select('*')
    .eq('id', rosterPlayerId)
    .eq('alliance_id', allianceId)
    .single();
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireWarPlanEditor(request);
    if (auth instanceof NextResponse) return auth;

    const { supabaseAdmin, userId, profile } = auth;
    const allianceId = profile.alliance_id as string;
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Roster player ID is required' }, { status: 400 });
    }

    const { data: existing } = await getRosterPlayerForAlliance(supabaseAdmin, id, allianceId);
    if (!existing) {
      return NextResponse.json({ error: 'Roster player not found' }, { status: 404 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = { updated_by: userId };

    if (body.player_name !== undefined) {
      const playerName = String(body.player_name ?? '').trim();
      if (!playerName) {
        return NextResponse.json({ error: 'Player name cannot be empty' }, { status: 400 });
      }
      updates.player_name = playerName.slice(0, 50);
    }

    if (body.notes !== undefined) {
      const notes = String(body.notes ?? '').trim();
      updates.notes = notes ? notes.slice(0, 250) : null;
    }

    if (body.linked_profile_id !== undefined) {
      const linkedProfileId = body.linked_profile_id ? String(body.linked_profile_id) : null;
      if (linkedProfileId) {
        const { data: linkedProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, alliance_id')
          .eq('id', linkedProfileId)
          .single();

        if (!linkedProfile || linkedProfile.alliance_id !== allianceId) {
          return NextResponse.json({ error: 'Linked account must belong to your alliance' }, { status: 400 });
        }
      }
      updates.linked_profile_id = linkedProfileId;
    }

    if (body.is_active !== undefined) {
      updates.is_active = !!body.is_active;
    }

    const { data, error } = await supabaseAdmin
      .from('war_roster_players')
      .update(updates)
      .eq('id', id)
      .eq('alliance_id', allianceId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating roster player:', error);
      const message = error.code === '23505'
        ? 'A player with this name already exists in your alliance roster'
        : 'Failed to update roster player';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ player: data });
  } catch (error) {
    console.error('War roster PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireWarPlanEditor(request);
    if (auth instanceof NextResponse) return auth;

    const { supabaseAdmin, profile } = auth;
    const allianceId = profile.alliance_id as string;
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Roster player ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('war_roster_players')
      .delete()
      .eq('id', id)
      .eq('alliance_id', allianceId);

    if (error) {
      console.error('Error deleting roster player:', error);
      return NextResponse.json({ error: 'Failed to delete roster player' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('War roster DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
