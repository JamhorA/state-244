import type { PresentationTone } from '@/types';

interface ToneSelectorProps {
  selectedTone: PresentationTone;
  onToneChange: (tone: PresentationTone) => void;
  disabled?: boolean;
}

const tones: { value: PresentationTone; label: string; description: string }[] = [
  {
    value: 'formal',
    label: 'Formal',
    description: 'Professional and authoritative tone',
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed and friendly tone',
  },
  {
    value: 'enthusiastic',
    label: 'Enthusiastic',
    description: 'Exciting and energetic tone',
  },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Balanced and business-like tone',
  },
];

export function ToneSelector({ selectedTone, onToneChange, disabled }: ToneSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Presentation Tone
      </label>
      <div className="grid grid-cols-2 gap-3">
        {tones.map((tone) => (
          <button
            key={tone.value}
            type="button"
            onClick={() => onToneChange(tone.value)}
            disabled={disabled}
            className={`p-4 text-left border rounded-lg transition-all ${
              selectedTone === tone.value
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="font-medium text-gray-900">{tone.label}</div>
            <div className="text-sm text-gray-500 mt-1">{tone.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
