'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AIGeneratedImage } from '@/types';

interface UseGeneratedImagesOptions {
  initialLoad?: boolean;
}

export function useGeneratedImages({
  initialLoad = true,
}: UseGeneratedImagesOptions = {}) {
  const [images, setImages] = useState<AIGeneratedImage[]>([]);
  const [loading, setLoading] = useState(initialLoad);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setImages([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('ai_generated_images')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setImages(data || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoad) {
      fetchImages();
    }
  }, [initialLoad, fetchImages]);

  const refresh = useCallback(() => fetchImages(), [fetchImages]);

  return {
    images,
    loading,
    error,
    refresh,
  };
}

// Hook for checking image rate limit
export function useImageRateLimit() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkLimit = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRemaining(0);
          setLoading(false);
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data, error: fetchError } = await supabase
          .from('rate_limits')
          .select('request_count')
          .eq('user_id', user.id)
          .eq('resource_type', 'ai_image_generate')
          .gte('window_start', today.toISOString())
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        const count = data?.request_count || 0;
        setRemaining(Math.max(0, 5 - count));
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to check rate limit');
        setLoading(false);
      }
    };

    checkLimit();
  }, []);

  return {
    remaining,
    loading,
    error,
    maxLimit: 5,
  };
}
