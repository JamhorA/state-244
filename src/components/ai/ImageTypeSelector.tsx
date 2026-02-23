import type { AIImageType } from '@/types';

interface ImageTypeSelectorProps {
  selectedType: AIImageType;
  onTypeChange: (type: AIImageType) => void;
  disabled?: boolean;
}

const imageTypes: { value: AIImageType; label: string; icon: string; description: string }[] = [
  {
    value: 'banner',
    label: 'Banner',
    icon: '🎨',
    description: 'Wide banner image (16:9)',
  },
  {
    value: 'emblem',
    label: 'Emblem',
    icon: '🛡️',
    description: 'Circular emblem/logo',
  },
  {
    value: 'logo_draft',
    label: 'Logo Draft',
    icon: '✏️',
    description: 'Concept for alliance logo',
  },
];

export function ImageTypeSelector({ selectedType, onTypeChange, disabled }: ImageTypeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Image Type
      </label>
      <div className="grid grid-cols-3 gap-3">
        {imageTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onTypeChange(type.value)}
            disabled={disabled}
            className={`p-4 text-center border rounded-lg transition-all ${
              selectedType === type.value
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="text-2xl mb-2">{type.icon}</div>
            <div className="font-medium text-gray-900 text-sm">{type.label}</div>
            <div className="text-xs text-gray-500 mt-1">{type.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
