import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '@/types';

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

async function requireSuperadmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { error: NextResponse.json({ error: 'Profile not found' }, { status: 404 }) };
  }

  if (profile.role !== 'superadmin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { supabaseAdmin, requesterId: user.id };
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getRouteUserId(context: RouteContext) {
  const resolvedParams = await context.params;
  return resolvedParams?.id;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;

    const userId = await getRouteUserId(context);
    if (!userId) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.role !== undefined) {
      const validRoles: UserRole[] = ['superadmin', 'r5', 'r4', 'member'];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updates.role = body.role;

      if (body.role !== 'r4' && body.can_edit_alliance === undefined) {
        updates.can_edit_alliance = false;
      }
    }

    if (body.alliance_id !== undefined) {
      updates.alliance_id = body.alliance_id || null;
    }

    if (body.can_edit_alliance !== undefined) {
      updates.can_edit_alliance = Boolean(body.can_edit_alliance);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    if (updates.role !== 'r4') {
      updates.can_edit_alliance = false;
    }

    const { data, error } = await auth.supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data }, { status: 200 });
  } catch (error) {
    console.error('Admin user PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;

    const userId = await getRouteUserId(context);
    if (!userId) {
      return NextResponse.json({ error: 'User id is required' }, { status: 400 });
    }

    if (userId === auth.requesterId) {
      return NextResponse.json({ error: 'You cannot delete your own account while logged in' }, { status: 400 });
    }

    const { data: targetProfile } = await auth.supabaseAdmin
      .from('profiles')
      .select('id, is_president')
      .eq('id', userId)
      .single();

    if (targetProfile?.is_president) {
      await auth.supabaseAdmin
        .from('profiles')
        .update({ is_president: false })
        .eq('id', userId);
    }

    const { error: deleteAuthError } = await auth.supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      return NextResponse.json({ error: deleteAuthError.message || 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin user DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
