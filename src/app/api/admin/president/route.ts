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
 * GET /api/admin/president
 * Get current president info (any authenticated user)
 */
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: president, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, role, alliance_id')
      .eq('is_president', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json({ president: president || null }, { status: 200 });
  } catch (error) {
    console.error('President API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/president
 * Assign a new president (superadmin only)
 */
export async function POST(request: NextRequest) {
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

    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !requesterProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (requesterProfile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can assign president' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', userId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    if (targetUser.role !== 'r5' && targetUser.role !== 'r4') {
      return NextResponse.json({ error: 'President must be R5 or R4' }, { status: 400 });
    }

    const { error: clearError } = await supabaseAdmin
      .from('profiles')
      .update({ is_president: false })
      .eq('is_president', true);

    if (clearError) {
      throw clearError;
    }

    const { error: assignError } = await supabaseAdmin
      .from('profiles')
      .update({ is_president: true })
      .eq('id', userId);

    if (assignError) {
      throw assignError;
    }

    const { data: newPresident, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, role, alliance_id')
      .eq('id', userId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({ 
      message: 'President assigned successfully',
      president: newPresident 
    }, { status: 200 });

  } catch (error) {
    console.error('Assign president error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/president
 * Remove current president (superadmin only)
 */
export async function DELETE(request: NextRequest) {
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

    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !requesterProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (requesterProfile.role !== 'superadmin') {
      return NextResponse.json({ error: 'Only superadmin can remove president' }, { status: 403 });
    }

    const { error: clearError } = await supabaseAdmin
      .from('profiles')
      .update({ is_president: false })
      .eq('is_president', true);

    if (clearError) {
      throw clearError;
    }

    return NextResponse.json({ message: 'President removed successfully' }, { status: 200 });

  } catch (error) {
    console.error('Remove president error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
