'use client';

import { useState } from 'react';
import type { Profile } from '@/types';

interface ProfileEditProps {
  profile: Profile;
  onSave: (updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'alliance_id'>>) => void;
}

export function ProfileEdit({ profile, onSave }: ProfileEditProps) {
  const [formData, setFormData] = useState({
    display_name: profile.display_name,
    hq_level: profile.hq_level.toString(),
    power: profile.power.toString(),
    notes: profile.notes || '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSave({
        display_name: formData.display_name.trim(),
        hq_level: parseInt(formData.hq_level) || 1,
        power: parseInt(formData.power) || 0,
        notes: formData.notes.trim() || null,
      });
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      display_name: profile.display_name,
      hq_level: profile.hq_level.toString(),
      power: profile.power.toString(),
      notes: profile.notes || '',
    });
    setIsEditing(false);
    setError(null);
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        Edit Profile
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Edit Profile
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="space-y-4">
          {/* Display Name */}
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="display_name"
              name="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              required
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.display_name.length} / 50 characters
            </p>
          </div>

          {/* HQ Level */}
          <div>
            <label htmlFor="hq_level" className="block text-sm font-medium text-gray-700 mb-1">
              HQ Level <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="hq_level"
              name="hq_level"
              value={formData.hq_level}
              onChange={(e) => setFormData({ ...formData, hq_level: e.target.value })}
              required
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving}
            />
          </div>

          {/* Power Level */}
          <div>
            <label htmlFor="power" className="block text-sm font-medium text-gray-700 mb-1">
              Power Level <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="power"
              name="power"
              value={formData.power}
              onChange={(e) => setFormData({ ...formData, power: e.target.value })}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving}
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Optional notes about yourself..."
              disabled={isSaving}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.notes.length} / 500 characters
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
