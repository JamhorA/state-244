import { NextRequest, NextResponse } from 'next/server';
import { requireWarPlanEditor } from '../_lib';

const GLORY_WAR_MODE = 'glory_war' as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireWarPlanEditor(request);
    if (auth instanceof NextResponse) return auth;

    const { supabaseAdmin, profile } = auth;
    const allianceId = profile.alliance_id as string;

    const [{ data: roster, error: rosterError }, { data: plan, error: planError }] = await Promise.all([
      supabaseAdmin
        .from('war_roster_players')
        .select('*')
        .eq('alliance_id', allianceId)
        .eq('is_active', true)
        .order('player_name'),
      supabaseAdmin
        .from('war_plans')
        .select('*')
        .eq('alliance_id', allianceId)
        .eq('mode', GLORY_WAR_MODE)
        .maybeSingle(),
    ]);

    if (rosterError) {
      console.error('Error loading roster for glory war:', rosterError);
      return NextResponse.json({ error: 'Failed to load roster' }, { status: 500 });
    }

    if (planError) {
      console.error('Error loading glory war plan:', planError);
      return NextResponse.json({ error: 'Failed to load plan' }, { status: 500 });
    }

    let assignments: Array<{
      id: string;
      plan_id: string;
      roster_player_id: string;
      team: 'attacker' | 'defender';
      position: number;
      created_at: string;
    }> = [];

    if (plan) {
      const { data, error } = await supabaseAdmin
        .from('war_plan_assignments')
        .select('*')
        .eq('plan_id', plan.id)
        .order('team')
        .order('position');

      if (error) {
        console.error('Error loading glory war assignments:', error);
        return NextResponse.json({ error: 'Failed to load plan assignments' }, { status: 500 });
      }

      assignments = data ?? [];
    }

    return NextResponse.json({
      roster: roster ?? [],
      plan: plan ?? null,
      assignments,
    });
  } catch (error) {
    console.error('Glory war GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireWarPlanEditor(request);
    if (auth instanceof NextResponse) return auth;

    const { supabaseAdmin, userId, profile } = auth;
    const allianceId = profile.alliance_id as string;
    const body = await request.json();

    const title = typeof body.title === 'string' && body.title.trim()
      ? body.title.trim().slice(0, 100)
      : 'Glory War Plan';

    const attackerIds = Array.isArray(body.attackerIds) ? body.attackerIds.map(String) : [];
    const defenderIds = Array.isArray(body.defenderIds) ? body.defenderIds.map(String) : [];

    const allSelected = [...attackerIds, ...defenderIds];
    const uniqueSelected = new Set(allSelected);
    if (uniqueSelected.size !== allSelected.length) {
      return NextResponse.json({ error: 'A player can only be assigned once' }, { status: 400 });
    }

    // Validate roster ownership
    if (allSelected.length > 0) {
      const { data: rosterRows, error: rosterError } = await supabaseAdmin
        .from('war_roster_players')
        .select('id')
        .eq('alliance_id', allianceId)
        .in('id', allSelected);

      if (rosterError) {
        console.error('Error validating roster players:', rosterError);
        return NextResponse.json({ error: 'Failed to validate roster players' }, { status: 500 });
      }

      if ((rosterRows?.length ?? 0) !== uniqueSelected.size) {
        return NextResponse.json({ error: 'One or more selected players are invalid for your alliance' }, { status: 400 });
      }
    }

    // Ensure a single draft plan row exists for this alliance+mode
    const { data: plan, error: planUpsertError } = await supabaseAdmin
      .from('war_plans')
      .upsert({
        alliance_id: allianceId,
        mode: GLORY_WAR_MODE,
        title,
        created_by: userId,
        updated_by: userId,
      }, { onConflict: 'alliance_id,mode' })
      .select('*')
      .single();

    if (planUpsertError || !plan) {
      console.error('Error upserting glory war plan:', planUpsertError);
      return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
    }

    const { error: deleteAssignmentsError } = await supabaseAdmin
      .from('war_plan_assignments')
      .delete()
      .eq('plan_id', plan.id);

    if (deleteAssignmentsError) {
      console.error('Error clearing assignments:', deleteAssignmentsError);
      return NextResponse.json({ error: 'Failed to save plan assignments' }, { status: 500 });
    }

    const assignmentRows = [
      ...attackerIds.map((id: string, index: number) => ({
        plan_id: plan.id,
        roster_player_id: id,
        team: 'attacker' as const,
        position: index,
      })),
      ...defenderIds.map((id: string, index: number) => ({
        plan_id: plan.id,
        roster_player_id: id,
        team: 'defender' as const,
        position: index,
      })),
    ];

    if (assignmentRows.length > 0) {
      const { error: insertAssignmentsError } = await supabaseAdmin
        .from('war_plan_assignments')
        .insert(assignmentRows);

      if (insertAssignmentsError) {
        console.error('Error inserting assignments:', insertAssignmentsError);
        return NextResponse.json({ error: 'Failed to save plan assignments' }, { status: 500 });
      }
    }

    const { data: assignments, error: assignmentsReloadError } = await supabaseAdmin
      .from('war_plan_assignments')
      .select('*')
      .eq('plan_id', plan.id)
      .order('team')
      .order('position');

    if (assignmentsReloadError) {
      console.error('Error reloading assignments:', assignmentsReloadError);
      return NextResponse.json({ error: 'Plan saved but failed to reload assignments' }, { status: 500 });
    }

    return NextResponse.json({
      plan,
      assignments: assignments ?? [],
      message: 'Glory War plan saved',
    });
  } catch (error) {
    console.error('Glory war PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
