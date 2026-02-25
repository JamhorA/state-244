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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperadmin(request);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const q = searchParams.get('q')?.trim();
    const limitParam = Number(searchParams.get('limit') ?? '100');
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 200)) : 100;

    let query = auth.supabaseAdmin
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status && ['new', 'read', 'replied', 'archived'].includes(status)) {
      query = query.eq('status', status);
    }

    if (q) {
      const escaped = q.replace(/[%_,]/g, '');
      query = query.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%,message.ilike.%${escaped}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ messages: data || [] }, { status: 200 });
  } catch (error) {
    console.error('Admin contact GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
