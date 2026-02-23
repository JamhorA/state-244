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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params;
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
    const { vote } = body;

    if (!vote || !['approve', 'reject'].includes(vote)) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }

    const { data: proposal } = await supabaseAdmin
      .from('state_info_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (proposal.status !== 'pending') {
      return NextResponse.json({ error: 'Proposal is no longer pending' }, { status: 400 });
    }

    const { data: existingVote } = await supabaseAdmin
      .from('state_info_votes')
      .select('*')
      .eq('proposal_id', proposalId)
      .eq('voter_id', user.id)
      .single();

    if (existingVote) {
      return NextResponse.json({ error: 'You have already voted' }, { status: 400 });
    }

    const { error: voteError } = await supabaseAdmin
      .from('state_info_votes')
      .insert({
        proposal_id: proposalId,
        voter_id: user.id,
        vote,
      });

    if (voteError) throw voteError;

    if (vote === 'reject') {
      await supabaseAdmin
        .from('state_info_proposals')
        .update({ status: 'rejected', resolved_at: new Date().toISOString() })
        .eq('id', proposalId);
    } else {
      const { data: approveVotes } = await supabaseAdmin
        .from('state_info_votes')
        .select('*')
        .eq('proposal_id', proposalId)
        .eq('vote', 'approve');

      if (approveVotes && approveVotes.length >= 2) {
        const { error: updateError } = await supabaseAdmin
          .from('state_info')
          .update({
            title: proposal.proposed_title,
            content: proposal.proposed_content,
            updated_at: new Date().toISOString(),
          })
          .eq('section_key', proposal.section_key);

        if (updateError) {
          console.error('Error updating state_info:', updateError);
        } else {
          await supabaseAdmin
            .from('state_info_proposals')
            .update({ status: 'approved', resolved_at: new Date().toISOString() })
            .eq('id', proposalId);
        }
      }
    }

    return NextResponse.json({ success: true, vote });

  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
