'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Github,
  Twitter,
  Linkedin,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Send,
  Heart,
  ExternalLink,
  Lock,
  Cpu,
} from 'lucide-react';
import SurajAILogo from '@/components/SurajAILogo';

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="bg-[#050509] border-t border-surface-border/80 text-slate-400 text-sm relative overflow-hidden">
      {/* Background Subtle Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 relative z-10">
        {/* Top Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-surface-border/60">
          {/* Brand & Description */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/">
              <SurajAILogo size="md" />
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              SurajAI is a production-grade, enterprise AI platform combining multi-model streaming, real AI image generation, document RAG, and automated tool execution.
            </p>

            {/* Platform Status Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All Systems Operational (100% Uptime)</span>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-500/40 hover:scale-105 transition-all"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-500/40 hover:scale-105 transition-all"
                title="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-500/40 hover:scale-105 transition-all"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="mailto:support@surajai.com"
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-brand-500/40 hover:scale-105 transition-all"
                title="Contact Support"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-brand-400" /> Product
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/workspace" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>AI Workspace</span>
                  <ExternalLink className="w-3 h-3 text-slate-600" />
                </Link>
              </li>
              <li>
                <Link href="/workspace" className="hover:text-white transition-colors">
                  AI Image Studio
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  Knowledge Base (RAG)
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  Persistent AI Memory
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  AI Tools Registry
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" /> Resources
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="#pricing" className="hover:text-white transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-white transition-colors">
                  FAQ & Docs
                </Link>
              </li>
              <li>
                <Link href="/api/health" target="_blank" className="hover:text-white transition-colors">
                  API Health Endpoint
                </Link>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  GitHub Repository
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter & Security */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" /> Newsletter
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Get weekly updates on multi-model AI releases and RAG benchmarks.
            </p>
            {subscribed ? (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-medium animate-in fade-in">
                ✓ Thanks for subscribing!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="enter your email..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full bg-[#0c0e17] border border-surface-border rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <button
                  type="submit"
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-600/30 transition-all"
                >
                  <Send className="w-3 h-3" /> Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Copyright & Security Line */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SurajAI SaaS Platform. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-300 cursor-pointer flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" /> Security Compliance
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
