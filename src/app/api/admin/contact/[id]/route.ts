import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_STATUS = new Set(['new', 'read', 'replied', 'archived']);

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

  return { supabaseAdmin };
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Message id is required' }, { status: 400 });
    }

    const body = await request.json();
    const status = typeof body.status === 'string' ? body.status : '';
    if (!VALID_STATUS.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await auth.supabaseAdmin
      .from('contact_messages')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: data }, { status: 200 });
  } catch (error) {
    console.error('Admin contact PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
