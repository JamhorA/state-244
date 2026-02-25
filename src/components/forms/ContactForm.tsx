'use client';

import { useState } from 'react';

type ContactTopic = 'general' | 'alliance' | 'support' | 'bug' | 'partnership';

const TOPIC_OPTIONS: Array<{ value: ContactTopic; label: string }> = [
  { value: 'general', label: 'General Question' },
  { value: 'alliance', label: 'Alliance Inquiry' },
  { value: 'support', label: 'Website Support' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'partnership', label: 'Partnership / Collaboration' },
];

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'general' as ContactTopic,
    message: '',
    website: '',
    form_started_at: Date.now(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required';
    } else if (formData.name.trim().length > 80) {
      nextErrors.name = 'Name must be 80 characters or less';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      nextErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      nextErrors.message = 'Message must be at least 10 characters';
    } else if (formData.message.trim().length > 4000) {
      nextErrors.message = 'Message must be 4000 characters or less';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSuccess(false);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source_path: '/contact',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        topic: 'general',
        message: '',
        website: '',
        form_started_at: Date.now(),
      });
      setErrors({});
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 sm:p-7 lg:p-8 border border-slate-800/80 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-bl-[100px] pointer-events-none" />

      {isSuccess && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-emerald-300 font-medium">
            Message sent. We will get back to you as soon as possible.
          </p>
        </div>
      )}

      {submitError && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-red-300 font-medium">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-slate-300 mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              maxLength={80}
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-200 placeholder:text-slate-600 ${
                errors.name ? 'border-red-500/50 focus:ring-red-500/40' : 'border-slate-700/50 focus:ring-emerald-500/20 focus:border-emerald-500/40'
              }`}
              placeholder="Your name"
            />
            {errors.name && <p className="mt-2 text-sm text-red-400">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              maxLength={255}
              className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-200 placeholder:text-slate-600 ${
                errors.email ? 'border-red-500/50 focus:ring-red-500/40' : 'border-slate-700/50 focus:ring-emerald-500/20 focus:border-emerald-500/40'
              }`}
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-2 text-sm text-red-400">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="topic" className="block text-sm font-semibold text-slate-300 mb-2">
            Topic
          </label>
          <div className="relative">
            <select
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full appearance-none px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40"
            >
              {TOPIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-slate-300 mb-2">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            value={formData.message}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 bg-slate-900/50 border rounded-xl focus:outline-none focus:ring-2 transition-all text-slate-200 placeholder:text-slate-600 resize-none ${
              errors.message ? 'border-red-500/50 focus:ring-red-500/40' : 'border-slate-700/50 focus:ring-emerald-500/20 focus:border-emerald-500/40'
            }`}
            placeholder="Tell us how we can help..."
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            {errors.message ? (
              <p className="text-sm text-red-400">{errors.message}</p>
            ) : (
              <p className="text-xs text-slate-500">{formData.message.length} / 4000 characters</p>
            )}
            <p className="text-xs text-slate-500 hidden sm:block">Replies will be sent to your email.</p>
          </div>
        </div>

        <div className="hidden" aria-hidden="true">
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleChange}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Protected by basic anti-spam checks.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  );
}
