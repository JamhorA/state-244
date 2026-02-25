'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Alliance } from '@/types';

interface MigrationApplicationFormProps {
  alliance?: Alliance;
  alliances: Alliance[];
}

export function MigrationApplicationForm({ alliance, alliances }: MigrationApplicationFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    player_name: '',
    topic: '',
    current_server: '',
    current_alliance: '',
    power_level: '',
    hq_level: '',
    troop_level: '',
    arena_power: '',
    duel_points: '',
    svs_participation: '',
    target_alliance_id: alliance?.id || '',
    motivation: '',
    website: '', // Honeypot field
  });
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.target_alliance_id) {
      newErrors.target_alliance_id = 'Please select an alliance to apply to';
    }

    if (!formData.player_name.trim()) {
      newErrors.player_name = 'Player name is required';
    } else if (formData.player_name.length > 50) {
      newErrors.player_name = 'Player name must be 50 characters or less';
    }

    if (!formData.topic.trim()) {
      newErrors.topic = 'Topic is required';
    } else if (formData.topic.trim().length < 3) {
      newErrors.topic = 'Topic must be at least 3 characters';
    } else if (formData.topic.trim().length > 120) {
      newErrors.topic = 'Topic must be 120 characters or less';
    }

    if (!formData.current_server.trim()) {
      newErrors.current_server = 'Current server is required';
    } else if (formData.current_server.length > 100) {
      newErrors.current_server = 'Server name must be 100 characters or less';
    }

    if (formData.current_alliance.length > 50) {
      newErrors.current_alliance = 'Alliance name must be 50 characters or less';
    }

    const powerLevel = parseInt(formData.power_level);
    if (!formData.power_level) {
      newErrors.power_level = 'Total power is required';
    } else if (isNaN(powerLevel) || powerLevel < 0) {
      newErrors.power_level = 'Power must be a positive number';
    }

    const hqLevel = parseInt(formData.hq_level);
    if (!formData.hq_level) {
      newErrors.hq_level = 'HQ level is required';
    } else if (isNaN(hqLevel) || hqLevel < 1 || hqLevel > 35) {
      newErrors.hq_level = 'HQ level must be between 1 and 35';
    }

    if (!formData.troop_level) {
      newErrors.troop_level = 'Please select your troop level';
    }

    if (!formData.arena_power.trim()) {
      newErrors.arena_power = 'Arena power is required';
    }

    if (!formData.duel_points) {
      newErrors.duel_points = 'Please select your average duel points';
    }

    if (!formData.svs_participation) {
      newErrors.svs_participation = 'Please indicate SvS participation';
    }

    if (!formData.motivation.trim()) {
      newErrors.motivation = 'Motivation is required';
    } else if (formData.motivation.length < 10) {
      newErrors.motivation = 'Motivation must be at least 10 characters';
    } else if (formData.motivation.length > 3000) {
      newErrors.motivation = 'Motivation must be 3000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setScreenshots(prev => [...prev, ...selectedFiles].slice(0, 5)); // Limit to 5 images
    }
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Attempt to upload screenshots if present
      const uploadedUrls: string[] = [];
      if (screenshots.length > 0) {
        for (const file of screenshots) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const filePath = `screenshots/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('applications')
            .upload(filePath, file);
            
          if (!uploadError && uploadData) {
            const { data: { publicUrl } } = supabase.storage
              .from('applications')
              .getPublicUrl(filePath);
            uploadedUrls.push(publicUrl);
          } else {
            console.error("Failed to upload screenshot:", uploadError);
            // If upload fails (e.g. bucket doesn't exist yet), we append the filename instead
            uploadedUrls.push(`[Failed to upload: ${file.name}]`);
          }
        }
      }

      // 2. Submit application to backend
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: formData.player_name,
          topic: formData.topic.trim(),
          current_server: formData.current_server,
          current_alliance: formData.current_alliance,
          power_level: parseInt(formData.power_level),
          hq_level: parseInt(formData.hq_level),
          troop_level: formData.troop_level,
          arena_power: formData.arena_power,
          duel_points: formData.duel_points,
          svs_participation: formData.svs_participation,
          target_alliance_id: formData.target_alliance_id,
          motivation: formData.motivation,
          screenshots: uploadedUrls,
          website: formData.website, // Honeypot field
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'Rate limit exceeded') {
          throw new Error('You have submitted too many applications. Please wait before trying again.');
        }
        throw new Error(data.error || 'Failed to submit application. Please try again.');
      }

      // Redirect to success page
      router.push('/apply/success');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-800/80 shadow-2xl relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-bl-[100px] pointer-events-none" />

      {submitError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {submitError}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 relative z-10">
        
        {/* Alliance Selection */}
        <div>
          <label htmlFor="target_alliance_id" className="block text-sm font-semibold text-slate-300 mb-2">
            Target Alliance <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <select
              id="target_alliance_id"
              name="target_alliance_id"
              value={formData.target_alliance_id}
              onChange={handleChange}
              disabled={!!alliance || isSubmitting}
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all ${
                errors.target_alliance_id 
                  ? 'border-red-500/50 focus:ring-red-500/50 text-red-200' 
                  : 'border-slate-700/50 focus:border-sky-500/50 focus:ring-sky-500/20 text-slate-200'
              } ${!!alliance ? 'opacity-70 cursor-not-allowed' : 'hover:border-slate-600/80 cursor-pointer'}`}
            >
              <option value="" disabled>Select an alliance...</option>
              {alliances.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} {a.recruitment_status !== 'open' ? '(Closed)' : ''}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.target_alliance_id && (
            <p className="mt-2 text-sm text-red-400">{errors.target_alliance_id}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {/* Player Name */}
          <div>
            <label htmlFor="player_name" className="block text-sm font-semibold text-slate-300 mb-2">
              Player Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="player_name"
              name="player_name"
              value={formData.player_name}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder:text-slate-600 text-slate-200 ${
                errors.player_name ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700/50 focus:border-sky-500/50 focus:ring-sky-500/20 hover:border-slate-600/80'
              }`}
              placeholder="Your in-game name"
              disabled={isSubmitting}
            />
            {errors.player_name && <p className="mt-2 text-sm text-red-400">{errors.player_name}</p>}
          </div>

          {/* Current Server */}
          <div>
            <label htmlFor="current_server" className="block text-sm font-semibold text-slate-300 mb-2">
              Current Server <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                id="current_server"
                name="current_server"
                value={formData.current_server}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all text-slate-200 ${
                  errors.current_server ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700/50 focus:border-sky-500/50 focus:ring-sky-500/20 hover:border-slate-600/80 cursor-pointer'
                }`}
              >
                <option value="" disabled>Select your server...</option>
                {[241, 242, 243, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255, 256].map(server => (
                  <option key={server} value={`State ${server}`}>State {server}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.current_server && <p className="mt-2 text-sm text-red-400">{errors.current_server}</p>}
          </div>

          {/* Topic */}
          <div className="md:col-span-2">
            <label htmlFor="topic" className="block text-sm font-semibold text-slate-300 mb-2">
              Application Topic <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              maxLength={120}
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder:text-slate-600 text-slate-200 ${
                errors.topic ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700/50 focus:border-sky-500/50 focus:ring-sky-500/20 hover:border-slate-600/80'
              }`}
              placeholder="e.g. Main account migration / Group move with 3 players"
              disabled={isSubmitting}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              {errors.topic ? (
                <p className="text-sm text-red-400">{errors.topic}</p>
              ) : (
                <p className="text-xs text-slate-500">{formData.topic.length} / 120 characters</p>
              )}
            </div>
          </div>

          {/* Current Alliance */}
          <div>
            <label htmlFor="current_alliance" className="block text-sm font-semibold text-slate-300 mb-2">
              Current Alliance Name <span className="text-slate-500 font-normal text-xs ml-1">(Optional)</span>
            </label>
            <input
              type="text"
              id="current_alliance"
              name="current_alliance"
              value={formData.current_alliance}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder:text-slate-600 text-slate-200 ${
                errors.current_alliance ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700/50 focus:border-sky-500/50 focus:ring-sky-500/20 hover:border-slate-600/80'
              }`}
              placeholder="e.g. [ABC] The Alphas"
              disabled={isSubmitting}
            />
            {errors.current_alliance && <p className="mt-2 text-sm text-red-400">{errors.current_alliance}</p>}
          </div>

          {/* Power Level */}
          <div>
            <label htmlFor="power_level" className="block text-sm font-semibold text-slate-300 mb-2">
              Total Power <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              id="power_level"
              name="power_level"
              value={formData.power_level}
              onChange={handleChange}
              min="0"
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder:text-slate-600 text-slate-200 ${
                errors.power_level ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700/50 focus:border-sky-500/50 focus:ring-sky-500/20 hover:border-slate-600/80'
              }`}
              placeholder="e.g. 150000000"
              disabled={isSubmitting}
            />
            {errors.power_level && <p className="mt-2 text-sm text-red-400">{errors.power_level}</p>}
          </div>

          {/* HQ Level */}
          <div>
            <label htmlFor="hq_level" className="block text-sm font-semibold text-slate-300 mb-2">
              HQ Level <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              id="hq_level"
              name="hq_level"
              value={formData.hq_level}
              onChange={handleChange}
              min="1"
              max="35"
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder:text-slate-600 text-slate-200 ${
                errors.hq_level ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700/50 focus:border-sky-500/50 focus:ring-sky-500/20 hover:border-slate-600/80'
              }`}
              placeholder="1-35"
              disabled={isSubmitting}
            />
            {errors.hq_level && <p className="mt-2 text-sm text-red-400">{errors.hq_level}</p>}
          </div>

          {/* Troop Unit Level */}
          <div>
            <label htmlFor="troop_level" className="block text-sm font-semibold text-slate-300 mb-2">
              Troops Unit Level <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                id="troop_level"
                name="troop_level"
                value={formData.troop_level}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all text-slate-200 ${
                  errors.troop_level ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700/50 focus:border-sky-500/50 focus:ring-sky-500/20 hover:border-slate-600/80 cursor-pointer'
                }`}
              >
                <option value="" disabled>Select level...</option>
                {['T8', 'T9', 'T10'].map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.troop_level && <p className="mt-2 text-sm text-red-400">{errors.troop_level}</p>}
          </div>

          {/* Main Team Arena Power */}
          <div>
            <label htmlFor="arena_power" className="block text-sm font-semibold text-slate-300 mb-2">
              Main Team Arena Power <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="arena_power"
              name="arena_power"
              value={formData.arena_power}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all placeholder:text-slate-600 text-slate-200 ${
                errors.arena_power ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700/50 focus:border-sky-500/50 focus:ring-sky-500/20 hover:border-slate-600/80'
              }`}
              placeholder="e.g. 5,000,000"
              disabled={isSubmitting}
            />
            {errors.arena_power && <p className="mt-2 text-sm text-red-400">{errors.arena_power}</p>}
          </div>

          {/* Weekly Alliance Duel Points */}
          <div>
            <label htmlFor="duel_points" className="block text-sm font-semibold text-slate-300 mb-2">
              Weekly Alliance Duel Points <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                id="duel_points"
                name="duel_points"
                value={formData.duel_points}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all text-slate-200 ${
                  errors.duel_points ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700/50 focus:border-sky-500/50 focus:ring-sky-500/20 hover:border-slate-600/80 cursor-pointer'
                }`}
              >
                <option value="" disabled>Select average score...</option>
                <option value="Less than 10m">Less than 10m</option>
                <option value="Up to 20m">Up to 20m</option>
                <option value="Up to 50m">Up to 50m</option>
                <option value="Up to 100m">Up to 100m</option>
                <option value="More than 200m">More than 200m</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.duel_points && <p className="mt-2 text-sm text-red-400">{errors.duel_points}</p>}
          </div>

          {/* Participate in SvS */}
          <div>
            <label htmlFor="svs_participation" className="block text-sm font-semibold text-slate-300 mb-2">
              Participate in State vs State? <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                id="svs_participation"
                name="svs_participation"
                value={formData.svs_participation}
                onChange={handleChange}
                disabled={isSubmitting}
                className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all text-slate-200 ${
                  errors.svs_participation ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700/50 focus:border-sky-500/50 focus:ring-sky-500/20 hover:border-slate-600/80 cursor-pointer'
                }`}
              >
                <option value="" disabled>Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Sometimes">Sometimes</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.svs_participation && <p className="mt-2 text-sm text-red-400">{errors.svs_participation}</p>}
          </div>
        </div>

        {/* File Upload (Screenshots) */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Boomer Zombie Report Screenshots <span className="text-slate-500 font-normal text-xs ml-1">(Optional)</span>
          </label>
          <p className="text-xs text-slate-400 mb-3">Upload screenshots of your main team heroes, gear, and tech (Max 5 images)</p>
          
          <div 
            className="w-full border-2 border-dashed border-slate-700/50 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-900/30 hover:bg-slate-900/50 hover:border-sky-500/50 transition-all cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-sky-400 font-medium">Click to select images</span>
            <span className="text-xs text-slate-500 mt-1">PNG, JPG, JPEG</span>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange} 
              multiple 
              accept="image/*" 
              className="hidden" 
              disabled={isSubmitting || screenshots.length >= 5}
            />
          </div>

          {screenshots.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {screenshots.map((file, index) => (
                <div key={index} className="relative group bg-slate-800 rounded-lg p-2 border border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-slate-300 truncate pr-4">{file.name}</span>
                  <button 
                    type="button" 
                    onClick={() => removeScreenshot(index)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Motivation */}
        <div>
          <label htmlFor="motivation" className="block text-sm font-semibold text-slate-300 mb-2">
            Why do you want to join? <span className="text-red-400">*</span>
          </label>
          <textarea
            id="motivation"
            name="motivation"
            value={formData.motivation}
            onChange={handleChange}
            rows={5}
            className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all resize-none placeholder:text-slate-600 text-slate-200 ${
              errors.motivation ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700/50 focus:border-sky-500/50 focus:ring-sky-500/20 hover:border-slate-600/80'
            }`}
            placeholder="Tell us about your gameplay style and what you bring to the alliance..."
            disabled={isSubmitting}
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 mt-2">
            {errors.motivation ? (
              <p className="text-sm text-red-400">{errors.motivation}</p>
            ) : (
              <p className="text-xs text-slate-500">
                {formData.motivation.length} / 3000 characters
              </p>
            )}
          </div>
        </div>

        {/* Honeypot field */}
        <div className="hidden" aria-hidden="true">
          <input
            type="text"
            name="website"
            id="website"
            value={formData.website}
            onChange={handleChange}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:flex-1 px-4 py-3 text-center text-slate-400 hover:text-white border border-slate-700/50 rounded-xl transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:flex-1 btn-primary px-4 py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                Submit Application
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
