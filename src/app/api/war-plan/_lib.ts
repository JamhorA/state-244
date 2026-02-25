import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export interface WarPlanEditorContext {
  supabaseAdmin: any;
  userId: string;
  profile: {
    id: string;
    role: 'superadmin' | 'r5' | 'r4' | 'member';
    alliance_id: string | null;
    display_name: string;
  };
}

export function getSupabaseAdmin() {
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

export async function requireWarPlanEditor(request: NextRequest): Promise<WarPlanEditorContext | NextResponse> {
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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, alliance_id, display_name')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (!['r4', 'r5', 'superadmin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
  }

  if (!profile.alliance_id) {
    return NextResponse.json({ error: 'You are not assigned to an alliance' }, { status: 400 });
  }

  return {
    supabaseAdmin,
    userId: user.id,
    profile,
  };
}
