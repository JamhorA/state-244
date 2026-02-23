import OpenAI from 'openai';
import { supabase } from './supabase';
import type { AIGeneratedImage } from '@/types';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OpenAI API key not set. AI features will not work.');
}

const openai: OpenAI | null = apiKey ? new OpenAI({ apiKey }) : null;

/**
 * Generate alliance presentation text using GPT-4
 */
export async function generatePresentationText(
  bulletPoints: string[],
  tone: 'formal' | 'casual' | 'enthusiastic' | 'professional'
): Promise<string> {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to .env.local');
  }

  const toneInstructions = {
    formal: 'Write in a formal, professional tone suitable for official alliance communications.',
    casual: 'Write in a friendly, approachable tone that welcomes new members.',
    enthusiastic: 'Write with energy and excitement to showcase alliance spirit.',
    professional: 'Write in a polished, business-like tone that conveys strength and reliability.',
  };

  const systemPrompt = `You are writing an alliance presentation for a gaming alliance. ${toneInstructions[tone]}

Take the provided bullet points and expand them into a compelling 3-4 paragraph presentation that showcases the alliance's strengths and attracts new members.

Keep the tone consistent and make it engaging for gaming community members.`;

  const userPrompt = `Bullet points about the alliance:
${bulletPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

Write an alliance presentation:`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error generating presentation text:', error);
    throw new Error('Failed to generate presentation text. Please try again.');
  }
}

/**
 * Generate alliance image using DALL-E 3
 */
export async function generateAllianceImage(
  prompt: string,
  imageType: 'banner' | 'emblem' | 'logo_draft'
): Promise<{ url: string; revisedPrompt: string }> {
  if (!openai) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to .env.local');
  }

  // Enhance prompt based on image type
  const typeEnhancements = {
    banner: 'Create a wide banner image, cinematic style, high detail, 16:9 aspect ratio.',
    emblem: 'Create a circular emblem, symbolic design, clean lines, suitable for gaming alliance logo.',
    logo_draft: 'Create a logo concept, simple but impactful, gaming aesthetic.',
  };

  const enhancedPrompt = `${typeEnhancements[imageType]} ${prompt}`;

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    });

    const imageData = response.data?.[0];
    if (!imageData?.url) {
      throw new Error('No image generated');
    }

    const imageUrl = imageData.url;
    const revisedPrompt = imageData.revised_prompt || enhancedPrompt;

    return { url: imageUrl, revisedPrompt };
  } catch (error) {
    console.error('Error generating image:', error);
    throw new Error('Failed to generate image. Please try again.');
  }
}

/**
 * Download image from URL and return as Buffer
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to download image');
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Fetch generated images for a user
 */
export async function fetchGeneratedImages(userId: string): Promise<AIGeneratedImage[]> {
  const { data, error } = await supabase
    .from('ai_generated_images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching generated images:', error);
    throw new Error('Failed to load images');
  }

  return data || [];
}

/**
 * Check rate limit for AI image generation (5 images/user/day)
 */
export async function checkImageRateLimit(userId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('rate_limits')
    .select('request_count')
    .eq('user_id', userId)
    .eq('resource_type', 'ai_image_generate')
    .gte('window_start', today.toISOString())
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking rate limit:', error);
    throw new Error('Failed to check rate limit');
  }

  // If no record exists or count is less than 5, allow
  if (!data) return true;
  return data.request_count < 5;
}

/**
 * Increment rate limit for AI image generation
 */
export async function incrementImageRateLimit(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from('rate_limits')
    .select('id, request_count')
    .eq('user_id', userId)
    .eq('resource_type', 'ai_image_generate')
    .gte('window_start', today.toISOString())
    .maybeSingle();

  if (existing) {
    // Update existing record
    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
  } else {
    // Create new record
    await supabase
      .from('rate_limits')
      .insert({
        user_id: userId,
        resource_type: 'ai_image_generate',
        request_count: 1,
        window_start: today.toISOString(),
      });
  }
}

/**
 * Store generated image metadata in database
 */
export async function storeGeneratedImage(
  userId: string,
  allianceId: string | null,
  imageUrl: string,
  prompt: string,
  imageType: 'banner' | 'emblem' | 'logo_draft'
): Promise<AIGeneratedImage> {
  const { data, error } = await supabase
    .from('ai_generated_images')
    .insert({
      user_id: userId,
      alliance_id: allianceId,
      image_url: imageUrl,
      prompt,
      image_type: imageType,
    })
    .select()
    .single();

  if (error) {
    console.error('Error storing generated image:', error);
    throw new Error('Failed to save image');
  }

  return data;
}
