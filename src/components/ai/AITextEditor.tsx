import { useState } from 'react';

interface AITextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function AITextEditor({ value, onChange, disabled, readOnly }: AITextEditorProps) {
  const [wordCount, setWordCount] = useState(value.split(/\s+/).filter(Boolean).length);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setWordCount(newValue.split(/\s+/).filter(Boolean).length);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          Presentation Content
        </label>
        <span className="text-sm text-gray-500">
          {wordCount} words
        </span>
      </div>
      <textarea
        value={value}
        onChange={handleChange}
        disabled={disabled}
        readOnly={readOnly}
        rows={8}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-y"
        placeholder="Generated presentation will appear here. You can edit the content before saving..."
      />
      <p className="text-xs text-gray-500 mt-1">
        Tip: Keep the presentation concise (150-250 words) for best results on the public profile.
      </p>
    </div>
  );
}
