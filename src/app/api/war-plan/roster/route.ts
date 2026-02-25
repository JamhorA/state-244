import { NextRequest, NextResponse } from 'next/server';
import { requireWarPlanEditor } from '../_lib';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireWarPlanEditor(request);
    if (auth instanceof NextResponse) return auth;

    const { supabaseAdmin, profile } = auth;
    const allianceId = profile.alliance_id as string;

    const { data, error } = await supabaseAdmin
      .from('war_roster_players')
      .select('*')
      .eq('alliance_id', allianceId)
      .eq('is_active', true)
      .order('player_name');

    if (error) {
      console.error('Error loading war roster:', error);
      return NextResponse.json({ error: 'Failed to load roster' }, { status: 500 });
    }

    return NextResponse.json({ players: data ?? [] });
  } catch (error) {
    console.error('War roster GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireWarPlanEditor(request);
    if (auth instanceof NextResponse) return auth;

    const { supabaseAdmin, userId, profile } = auth;
    const allianceId = profile.alliance_id as string;
    const body = await request.json();

    const rawName = typeof body.player_name === 'string' ? body.player_name : '';
    const playerName = rawName.trim();
    const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    const linkedProfileId = typeof body.linked_profile_id === 'string' && body.linked_profile_id ? body.linked_profile_id : null;

    if (!playerName) {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }

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

    const { data, error } = await supabaseAdmin
      .from('war_roster_players')
      .insert({
        alliance_id: allianceId,
        player_name: playerName,
        notes: notes || null,
        linked_profile_id: linkedProfileId,
        created_by: userId,
        updated_by: userId,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating roster player:', error);
      const message = error.code === '23505'
        ? 'A player with this name already exists in your alliance roster'
        : 'Failed to create roster player';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ player: data }, { status: 201 });
  } catch (error) {
    console.error('War roster POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
