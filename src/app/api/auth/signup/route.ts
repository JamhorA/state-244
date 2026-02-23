import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { UserRole } from '@/types';

interface SignupRequest {
  email: string;
  password: string;
  display_name: string;
  role?: UserRole;
  alliance_id?: string;
  can_edit_alliance?: boolean;
}

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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, alliance_id, can_edit_alliance')
      .eq('id', user.id)
      .single();

    if (!adminProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const body: SignupRequest = await request.json();
    const { 
      email, 
      password, 
      display_name, 
      role = 'member', 
      alliance_id,
      can_edit_alliance = false 
    } = body;

    if (!email || !password || !display_name) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ['superadmin', 'r5', 'r4', 'member'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const isAdmin = adminProfile.role === 'superadmin';
    const isR5 = adminProfile.role === 'r5';
    const isR4WithPermission = adminProfile.role === 'r4' && adminProfile.can_edit_alliance;

    if (!isAdmin && !isR5 && !isR4WithPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create users' },
        { status: 403 }
      );
    }

    let targetAllianceId: string | null = alliance_id ?? null;
    let targetRole = role;

    if (isAdmin) {
      // Keep the provided alliance_id (or null)
    } else {
      targetAllianceId = adminProfile.alliance_id;
      
      if (role === 'superadmin' || role === 'r5') {
        return NextResponse.json(
          { error: 'Only superadmin can create superadmin or R5 accounts' },
          { status: 403 }
        );
      }
      
      if (isR4WithPermission && role === 'r4') {
        return NextResponse.json(
          { error: 'R4 can only create member accounts' },
          { status: 403 }
        );
      }
    }

    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        display_name: display_name.trim(),
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json(
        { error: createError.message || 'Failed to create user' },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Small delay to ensure trigger has run
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if profile was auto-created
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single();

    let profileError;
    
    if (existingProfile) {
      // Update existing profile
      const result = await supabaseAdmin
        .from('profiles')
        .update({
          display_name: display_name.trim(),
          role: targetRole,
          alliance_id: targetAllianceId,
          can_edit_alliance: can_edit_alliance && (targetRole === 'r4'),
          hq_level: 1,
          power: 0,
        })
        .eq('id', authData.user.id);
      profileError = result.error;
    } else {
      // Create profile (in case trigger didn't run)
      const result = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          display_name: display_name.trim(),
          role: targetRole,
          alliance_id: targetAllianceId,
          can_edit_alliance: can_edit_alliance && (targetRole === 'r4'),
          hq_level: 1,
          power: 0,
          notes: null,
        });
      profileError = result.error;
    }

    if (profileError) {
      console.error('Error updating/creating profile:', profileError);
      // Don't delete user, just report error - user exists and can be fixed manually
      return NextResponse.json(
        { error: `User created but profile update failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    // Verify the update worked
    const { data: verifyProfile, error: verifyError } = await supabaseAdmin
      .from('profiles')
      .select('role, alliance_id')
      .eq('id', authData.user.id)
      .single();

    if (verifyError || !verifyProfile) {
      console.error('Could not verify profile:', verifyError);
    } else if (verifyProfile.role !== targetRole) {
      console.error('Profile role mismatch. Expected:', targetRole, 'Got:', verifyProfile.role);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        display_name: display_name.trim(),
        role: targetRole,
        alliance_id: targetAllianceId,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
