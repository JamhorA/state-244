'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useRole } from '@/hooks/use-role';

interface PublicLayoutProps {
  children: ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { isAuthenticated, loading, signOut } = useAuth();
  const { profile } = useRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <span className="text-white font-bold text-sm">244</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-slate-100 group-hover:text-white transition-colors tracking-tight">State 244</span>
                <span className="text-xl font-bold text-sky-400 group-hover:text-sky-300 transition-colors tracking-tight">Hub</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <Link 
                href="/" 
                className="text-slate-300 hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-800/80 transition-all text-sm tracking-wide"
              >
                Alliances
              </Link>
              <Link 
                href="/about" 
                className="text-slate-300 hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-800/80 transition-all text-sm tracking-wide"
              >
                About
              </Link>
              <Link 
                href="/apply" 
                className="text-slate-300 hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-800/80 transition-all text-sm tracking-wide"
              >
                Apply
              </Link>
              
              {loading ? null : isAuthenticated ? (
                <div className="flex items-center gap-3 ml-2">
                  <Link 
                    href="/dashboard" 
                    className="btn-primary px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-[0_4px_14px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.5)] transition-all"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-400">
                      {profile?.display_name}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Sign out"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <Link 
                  href="/login" 
                  className="ml-2 btn-primary px-6 py-2.5 rounded-xl text-white font-semibold text-sm shadow-[0_4px_14px_rgba(14,165,233,0.3)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.5)] transition-all"
                >
                  Login
                </Link>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/80"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 animate-fade-in">
          <div 
            className="absolute inset-0 bg-slate-950/95 backdrop-blur-md"
            onClick={closeMobileMenu}
          />
          
          <div className="relative h-full flex flex-col pt-20 px-6">
            <div className="flex flex-col space-y-2">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="text-2xl font-semibold text-slate-200 py-4 px-6 hover:text-white hover:bg-slate-800/50 transition-all rounded-xl"
              >
                Alliances
              </Link>

              <Link
                href="/about"
                onClick={closeMobileMenu}
                className="text-2xl font-semibold text-slate-200 py-4 px-6 hover:text-white hover:bg-slate-800/50 transition-all rounded-xl"
              >
                About
              </Link>

              <Link
                href="/apply"
                onClick={closeMobileMenu}
                className="text-2xl font-semibold text-slate-200 py-4 px-6 hover:text-white hover:bg-slate-800/50 transition-all rounded-xl"
              >
                Apply
              </Link>
            </div>

            <div className="h-px bg-slate-800 my-6" />

            {loading ? null : isAuthenticated ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex items-center gap-3 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-lg">{profile?.display_name}</span>
                </div>
                
                <Link
                  href="/dashboard"
                  onClick={closeMobileMenu}
                  className="w-full text-center btn-primary py-3 px-6 rounded-xl text-white font-semibold shadow-[0_4px_14px_rgba(14,165,233,0.3)]"
                >
                  Dashboard
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors py-2 px-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-lg font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="w-full text-center btn-primary py-3 px-6 rounded-xl text-white font-semibold shadow-[0_4px_14px_rgba(14,165,233,0.3)]"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
