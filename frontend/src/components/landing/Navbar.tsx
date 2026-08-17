'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Menu, X, ArrowRight, ShieldCheck } from 'lucide-react';
import SurajAILogo from '@/components/SurajAILogo';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-surface-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/">
            <SurajAILogo size="md" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#rag" className="hover:text-white transition-colors">Knowledge RAG</Link>
            <Link href="#memory" className="hover:text-white transition-colors">AI Memory</Link>
            <Link href="#tools" className="hover:text-white transition-colors">AI Tools</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
          </nav>

          {/* CTA Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 px-5 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 hover:shadow-brand-500/50 transition-all duration-200"
            >
              <span>Launch App</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-hover transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-surface-border px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-gray-300">
            <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Features</Link>
            <Link href="#rag" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Knowledge RAG</Link>
            <Link href="#memory" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">AI Memory</Link>
            <Link href="#tools" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">AI Tools</Link>
            <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Pricing</Link>
            <Link href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">FAQ</Link>
          </nav>
          <div className="pt-4 border-t border-surface-border flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full text-center text-sm font-medium text-gray-300 hover:text-white py-2.5 rounded-lg border border-surface-border"
            >
              Sign In
            </Link>
            <Link
              href="/app"
              className="w-full text-center text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 py-2.5 rounded-lg shadow-lg shadow-brand-600/30"
            >
              Launch App
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
