import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { ApprovalStageStatus } from '@/types';

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
      .select('id, role, alliance_id, can_edit_alliance, is_president')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { stage, decision, note } = body;

    if (!stage || !['alliance', 'president'].includes(stage)) {
      return NextResponse.json({ error: 'Invalid stage. Must be "alliance" or "president"' }, { status: 400 });
    }

    if (!decision || !['approve', 'reject'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision. Must be "approve" or "reject"' }, { status: 400 });
    }

    const { id: applicationId } = await params;

    const { data: application, error: appError } = await supabaseAdmin
      .from('migration_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const newStatus: ApprovalStageStatus = decision === 'approve' ? 'approved' : 'rejected';
    const now = new Date().toISOString();
    const noteValue = note?.trim()?.slice(0, 500) || null;

    if (stage === 'alliance') {
      const canApproveAlliance = 
        (profile.role === 'r5' && application.target_alliance_id === profile.alliance_id) ||
        (profile.role === 'r4' && application.target_alliance_id === profile.alliance_id && profile.can_edit_alliance) ||
        profile.role === 'superadmin';

      if (!canApproveAlliance) {
        return NextResponse.json({ error: 'You can only approve applications for your alliance' }, { status: 403 });
      }

      const { error: updateError } = await supabaseAdmin
        .from('migration_applications')
        .update({
          alliance_status: newStatus,
          alliance_reviewed_by: profile.id,
          alliance_reviewed_at: now,
          alliance_note: noteValue,
          updated_at: now,
        })
        .eq('id', applicationId);

      if (updateError) {
        throw updateError;
      }
    } else if (stage === 'president') {
      if (!profile.is_president && profile.role !== 'superadmin') {
        return NextResponse.json({ error: 'Only the president can provide final approval' }, { status: 403 });
      }

      const { error: updateError } = await supabaseAdmin
        .from('migration_applications')
        .update({
          president_status: newStatus,
          president_reviewed_by: profile.id,
          president_reviewed_at: now,
          president_note: noteValue,
          updated_at: now,
        })
        .eq('id', applicationId);

      if (updateError) {
        throw updateError;
      }
    }

    const { data: updatedApplication, error: fetchError } = await supabaseAdmin
      .from('migration_applications')
      .select(`
        *,
        alliance_reviewer:profiles!migration_applications_alliance_reviewed_by_fkey(id, display_name),
        president_reviewer:profiles!migration_applications_president_reviewed_by_fkey(id, display_name)
      `)
      .eq('id', applicationId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({
      application: updatedApplication,
      message: `${stage === 'alliance' ? 'Alliance' : 'President'} ${decision}d successfully`,
    }, { status: 200 });

  } catch (error) {
    console.error('Application update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: applicationId } = await params;

    const { data: application, error: appError } = await supabaseAdmin
      .from('migration_applications')
      .select(`
        *,
        target_alliance:alliances(id, name),
        alliance_reviewer:profiles!migration_applications_alliance_reviewed_by_fkey(id, display_name),
        president_reviewer:profiles!migration_applications_president_reviewed_by_fkey(id, display_name)
      `)
      .eq('id', applicationId)
      .single();

    if (appError) {
      if (appError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }
      throw appError;
    }

    return NextResponse.json({ application }, { status: 200 });

  } catch (error) {
    console.error('Application fetch API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
