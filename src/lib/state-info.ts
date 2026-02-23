import { supabase } from './supabase';

export interface StateInfoSection {
  id: string;
  section_key: string;
  title: string;
  content: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchStateInfo(): Promise<StateInfoSection[]> {
  const { data, error } = await supabase
    .from('state_info')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching state info:', error);
    throw new Error('Failed to load state information');
  }

  return data || [];
}

export async function fetchStateInfoSection(sectionKey: string): Promise<StateInfoSection | null> {
  const { data, error } = await supabase
    .from('state_info')
    .select('*')
    .eq('section_key', sectionKey)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching state info section:', error);
    throw new Error('Failed to load state information');
  }

  return data;
}
