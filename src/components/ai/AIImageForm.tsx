import { useState } from 'react';
import type { AIImageType } from '@/types';
import { ImageTypeSelector } from './ImageTypeSelector';

interface AIImageFormProps {
  onGenerate: (prompt: string, imageType: AIImageType) => Promise<void>;
  loading?: boolean;
  remaining?: number | null;
  maxLimit?: number;
}

export function AIImageForm({
  onGenerate,
  loading,
  remaining,
  maxLimit = 5,
}: AIImageFormProps) {
  const [prompt, setPrompt] = useState('');
  const [imageType, setImageType] = useState<AIImageType>('banner');

  const handleGenerate = async () => {
    if (prompt.trim().length < 5) {
      alert('Please enter a more detailed prompt (at least 5 characters)');
      return;
    }

    try {
      await onGenerate(prompt.trim(), imageType);
      setPrompt(''); // Clear prompt after successful generation
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  const getRemainingColor = () => {
    if (remaining === null || remaining === undefined) return 'text-gray-600';
    if (remaining === 0) return 'text-red-600';
    if (remaining <= 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  const isRateLimited = remaining === 0;

  return (
    <div className="space-y-6">
      {/* Rate Limit Indicator */}
      <div className={`p-4 rounded-lg border ${
        remaining === 0
          ? 'bg-red-50 border-red-200'
          : remaining !== null && remaining !== undefined && remaining <= 2
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {remaining === 0 ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-600 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-600 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <span className="text-sm">
              Daily generations: <strong className={getRemainingColor()}>
                {remaining !== null && remaining !== undefined ? maxLimit - remaining : '...'} / {maxLimit}
              </strong>
            </span>
          </div>
          {remaining !== null && remaining !== undefined && remaining > 0 && (
            <span className={`text-sm font-medium ${getRemainingColor()}`}>
              {remaining} remaining today
            </span>
          )}
        </div>
        {remaining === 0 && (
          <p className="text-xs text-red-600 mt-2">
            You've reached your daily limit. Come back tomorrow to generate more images.
          </p>
        )}
        {remaining !== null && remaining !== undefined && remaining > 0 && remaining <= 2 && (
          <p className="text-xs text-yellow-700 mt-2">
            Only {remaining} {remaining === 1 ? 'generation' : 'generations'} left today. Use them wisely!
          </p>
        )}
      </div>

      {/* Image Type Selector */}
      <ImageTypeSelector
        selectedType={imageType}
        onTypeChange={setImageType}
        disabled={loading || isRateLimited}
      />

      {/* Prompt Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe the image
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading || isRateLimited}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
          placeholder="A majestic dragon in gold and silver colors, standing atop a castle tower..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Be descriptive! Include colors, style, mood, and any specific elements you want to see.
        </p>
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || prompt.trim().length < 5 || isRateLimited}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating Image...
          </span>
        ) : isRateLimited ? (
          'Daily Limit Reached'
        ) : (
          'Generate Image'
        )}
      </button>
    </div>
  );
}
