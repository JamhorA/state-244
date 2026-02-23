import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { StateInfoProposal } from '@/types';

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

export async function GET(request: NextRequest) {
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'r5' && profile.role !== 'superadmin')) {
      return NextResponse.json({ error: 'R5 or superadmin required' }, { status: 403 });
    }

    const { data: proposals, error } = await supabaseAdmin
      .from('state_info_proposals')
      .select(`
        *,
        proposer:profiles!state_info_proposals_proposed_by_fkey(display_name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: votes } = await supabaseAdmin
      .from('state_info_votes')
      .select(`
        *,
        voter:profiles!state_info_votes_voter_id_fkey(display_name)
      `);

    const proposalsWithVotes = (proposals || []).map((p: StateInfoProposal & { proposer?: { display_name: string } }) => ({
      ...p,
      proposer_name: p.proposer?.display_name || 'Unknown',
      votes: (votes || []).filter(v => v.proposal_id === p.id),
    }));

    return NextResponse.json({ proposals: proposalsWithVotes });

  } catch (error) {
    console.error('Proposals API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'r5' && profile.role !== 'superadmin')) {
      return NextResponse.json({ error: 'R5 or superadmin required' }, { status: 403 });
    }

    const body = await request.json();
    const { section_key, proposed_title, proposed_content } = body;

    if (!section_key || !proposed_title || !proposed_content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: existingSection } = await supabaseAdmin
      .from('state_info')
      .select('section_key')
      .eq('section_key', section_key)
      .single();

    if (!existingSection) {
      return NextResponse.json({ error: 'Invalid section key' }, { status: 400 });
    }

    const { data: proposal, error } = await supabaseAdmin
      .from('state_info_proposals')
      .insert({
        section_key,
        proposed_title,
        proposed_content,
        proposed_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    if (profile.role === 'superadmin') {
      const { error: voteError } = await supabaseAdmin
        .from('state_info_votes')
        .insert({
          proposal_id: proposal.id,
          voter_id: user.id,
          vote: 'approve',
        });

      if (voteError) console.error('Error adding auto-vote:', voteError);
    }

    return NextResponse.json({ proposal }, { status: 201 });

  } catch (error) {
    console.error('Create proposal API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
