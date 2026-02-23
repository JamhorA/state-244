import { useState } from 'react';
import type { PresentationTone } from '@/types';
import { ToneSelector } from './ToneSelector';
import { AITextEditor } from './AITextEditor';

interface AITextFormProps {
  onGenerate: (bulletPoints: string[], tone: PresentationTone) => Promise<void>;
  onSave?: (bulletPoints: string[], tone: PresentationTone, content: string) => Promise<void>;
  onPublish?: (content: string) => Promise<void>;
  loading?: boolean;
  saving?: boolean;
  publishing?: boolean;
  canPublish?: boolean;
  generatedContent?: string;
}

export function AITextForm({
  onGenerate,
  onSave,
  onPublish,
  loading,
  saving,
  publishing,
  canPublish = false,
  generatedContent = '',
}: AITextFormProps) {
  const [bulletPoints, setBulletPoints] = useState('');
  const [tone, setTone] = useState<PresentationTone>('professional');
  const [content, setContent] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  // Update content when generatedContent changes from parent
  if (generatedContent && !hasGenerated && content !== generatedContent) {
    setContent(generatedContent);
    setHasGenerated(true);
  }

  const parseBulletPoints = (): string[] => {
    return bulletPoints
      .split('\n')
      .map((bp) => bp.replace(/^[•\-\*]\s*/, '').trim())
      .filter((bp) => bp.length > 0);
  };

  const handleGenerate = async () => {
    const points = parseBulletPoints();
    if (points.length === 0) {
      alert('Please enter at least one bullet point');
      return;
    }

    try {
      await onGenerate(points, tone);
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  const handleSave = async () => {
    const points = parseBulletPoints();
    if (points.length === 0) {
      alert('Please enter at least one bullet point');
      return;
    }
    if (!content.trim()) {
      alert('Please generate or enter presentation content');
      return;
    }

    if (!onSave) return;

    try {
      await onSave(points, tone, content);
      alert('Presentation saved as draft');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handlePublish = async () => {
    if (!content.trim()) {
      alert('Please generate or enter presentation content');
      return;
    }

    if (!confirm('Are you sure you want to publish this presentation? This will update your alliance\'s public profile description.')) {
      return;
    }

    if (!onPublish) return;

    try {
      await onPublish(content);
      alert('Presentation published successfully!');
    } catch (error) {
      console.error('Publish failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bullet Points Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bullet Points
        </label>
        <textarea
          value={bulletPoints}
          onChange={(e) => setBulletPoints(e.target.value)}
          disabled={loading}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
          placeholder="• Mention your alliance's strengths&#10;• Highlight achievements&#10;• Describe your culture&#10;• Include benefits for new members"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter bullet points (one per line) to guide the AI. Use bullet symbols (•, -, *) or just new lines.
        </p>
      </div>

      {/* Tone Selector */}
      <ToneSelector
        selectedTone={tone}
        onToneChange={setTone}
        disabled={loading}
      />

      {/* Generate Button */}
      {!hasGenerated && (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || bulletPoints.trim().length === 0}
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
              Generating...
            </span>
          ) : (
            'Generate Presentation'
          )}
        </button>
      )}

      {/* Content Editor - Show after generation */}
      {hasGenerated && (
        <AITextEditor
          value={content}
          onChange={setContent}
          disabled={saving || publishing}
        />
      )}

      {/* Action Buttons - Show after generation */}
      {hasGenerated && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || publishing}
            className="flex-1 px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          {canPublish && onPublish && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={saving || publishing}
              className="flex-1 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {publishing ? 'Publishing...' : 'Publish to Profile'}
            </button>
          )}
        </div>
      )}

      {/* Reset Button */}
      {hasGenerated && (
        <button
          type="button"
          onClick={() => {
            setBulletPoints('');
            setContent('');
            setHasGenerated(false);
            setTone('professional');
          }}
          disabled={saving || publishing}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Over
        </button>
      )}
    </div>
  );
}
