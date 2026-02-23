import { supabase } from './supabase';
import type { AlliancePresentation, PresentationTone } from '@/types';

/**
 * Fetch presentations for an alliance
 */
export async function fetchAlliancePresentations(
  allianceId: string
): Promise<AlliancePresentation[]> {
  const { data, error } = await supabase
    .from('alliance_presentations')
    .select('*')
    .eq('alliance_id', allianceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching presentations:', error);
    throw new Error('Failed to load presentations');
  }

  return data || [];
}

/**
 * Get a specific presentation by ID
 */
export async function getPresentationById(
  presentationId: string
): Promise<AlliancePresentation | null> {
  const { data, error } = await supabase
    .from('alliance_presentations')
    .select('*')
    .eq('id', presentationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching presentation:', error);
    throw new Error('Failed to load presentation');
  }

  return data;
}

/**
 * Save a new AI-generated presentation draft
 */
export async function savePresentation(
  allianceId: string,
  userId: string,
  bulletPoints: string[],
  tone: PresentationTone,
  content: string
): Promise<AlliancePresentation> {
  const { data, error } = await supabase
    .from('alliance_presentations')
    .insert({
      alliance_id: allianceId,
      generated_by: userId,
      bullet_points: bulletPoints,
      tone,
      content,
      is_published: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving presentation:', error);
    throw new Error('Failed to save presentation');
  }

  return data;
}

/**
 * Update an existing presentation
 */
export async function updatePresentation(
  presentationId: string,
  content: string,
  isPublished = false
): Promise<AlliancePresentation> {
  const { data, error } = await supabase
    .from('alliance_presentations')
    .update({
      content,
      is_published: isPublished,
      ...(isPublished && { reviewed_at: new Date().toISOString() }),
    })
    .eq('id', presentationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating presentation:', error);
    throw new Error('Failed to update presentation');
  }

  return data;
}

/**
 * Publish a presentation to the alliance's public profile
 */
export async function publishPresentation(
  presentationId: string,
  allianceDescription: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from('alliance_presentations')
    .update({
      is_published: true,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', presentationId);

  if (updateError) {
    console.error('Error publishing presentation:', updateError);
    throw new Error('Failed to publish presentation');
  }

  // Update the alliance's description with the published content
  const { error: allianceError } = await supabase
    .from('alliances')
    .update({ description: allianceDescription })
    .eq('id', (await getPresentationById(presentationId))?.alliance_id);

  if (allianceError) {
    console.error('Error updating alliance description:', allianceError);
    throw new Error('Failed to update alliance description');
  }
}

/**
 * Delete a presentation (only unpublished drafts)
 */
export async function deletePresentation(
  presentationId: string
): Promise<void> {
  const { error } = await supabase
    .from('alliance_presentations')
    .delete()
    .eq('id', presentationId);

  if (error) {
    console.error('Error deleting presentation:', error);
    throw new Error('Failed to delete presentation');
  }
}
