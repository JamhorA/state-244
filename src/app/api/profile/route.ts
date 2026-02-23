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

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, hq_level, power, notes } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (display_name !== undefined) updates.display_name = display_name.trim().slice(0, 50);
    if (hq_level !== undefined) updates.hq_level = Math.min(35, Math.max(1, hq_level));
    if (power !== undefined) updates.power = Math.max(0, power);
    if (notes !== undefined) updates.notes = notes?.trim().slice(0, 500) || null;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: data });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { targetUserId, display_name, hq_level, power, notes, can_edit_alliance } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
    }

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, alliance_id')
      .eq('id', user.id)
      .single();

    if (!adminProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const isSuperadmin = adminProfile.role === 'superadmin';
    const isR5 = adminProfile.role === 'r5';

    if (!isSuperadmin && !isR5) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (!isSuperadmin) {
      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('alliance_id')
        .eq('id', targetUserId)
        .single();

      if (!targetProfile || targetProfile.alliance_id !== adminProfile.alliance_id) {
        return NextResponse.json({ error: 'Can only edit members of your alliance' }, { status: 403 });
      }
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (display_name !== undefined) updates.display_name = display_name.trim().slice(0, 50);
    if (hq_level !== undefined) updates.hq_level = Math.min(35, Math.max(1, hq_level));
    if (power !== undefined) updates.power = Math.max(0, power);
    if (notes !== undefined) updates.notes = notes?.trim().slice(0, 500) || null;
    if (can_edit_alliance !== undefined) updates.can_edit_alliance = !!can_edit_alliance;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', targetUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ profile: data });

  } catch (error) {
    console.error('Profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
