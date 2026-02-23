import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * GET /api/applications
 * Fetch applications based on user role:
 * - R4/R5: All applications in the state (can only approve own alliance)
 * - President: All applications in the state
 * - Superadmin: All applications
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, alliance_id, is_president')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');
    const allianceId = searchParams.get('alliance_id');

    const isR4orR5 = profile.role === 'r4' || profile.role === 'r5';
    const canViewAll = profile.is_president || profile.role === 'superadmin';

    if (!isR4orR5 && !canViewAll) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    let query = supabaseAdmin
      .from('migration_applications')
      .select(`
        *,
        target_alliance:alliances(id, name),
        alliance_reviewer:profiles!migration_applications_alliance_reviewed_by_fkey(id, display_name),
        president_reviewer:profiles!migration_applications_president_reviewed_by_fkey(id, display_name)
      `);

    if (allianceId) {
      query = query.eq('target_alliance_id', allianceId);
    }

    if (filter) {
      switch (filter) {
        case 'awaiting_alliance':
          query = query.eq('alliance_status', 'pending');
          break;
        case 'awaiting_president':
          query = query.eq('alliance_status', 'approved').eq('president_status', 'pending');
          break;
        case 'approved':
          query = query.eq('status', 'approved');
          break;
        case 'rejected':
          query = query.eq('status', 'rejected');
          break;
        case 'all':
        default:
          break;
      }
    }

    query = query.order('submitted_at', { ascending: false });

    const { data: applications, error: appError } = await query;

    if (appError) {
      throw appError;
    }

    return NextResponse.json({ applications: applications || [] }, { status: 200 });

  } catch (error) {
    console.error('Applications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/applications
 * Submit a new migration application (Public)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.website) {
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const {
      player_name,
      current_server,
      current_alliance,
      power_level,
      hq_level,
      troop_level,
      arena_power,
      duel_points,
      svs_participation,
      target_alliance_id,
      motivation,
      screenshots,
    } = body;

    if (!player_name || !current_server || !power_level || !hq_level || !target_alliance_id || !motivation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('migration_applications')
      .insert([
        {
          player_name,
          current_server,
          current_alliance,
          power_level,
          hq_level,
          troop_level,
          arena_power,
          duel_points,
          svs_participation,
          target_alliance_id,
          motivation,
          screenshots: screenshots || [],
          status: 'submitted',
          alliance_status: 'pending',
          president_status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error inserting application:', error);
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, application: data }, { status: 201 });
  } catch (error) {
    console.error('Applications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
