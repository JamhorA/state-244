import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: sections, error } = await supabase
      .from('state_info')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;

    return NextResponse.json({ sections });

  } catch (error) {
    console.error('State info API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
