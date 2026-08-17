'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Database,
  Zap,
  Layers,
  Brain,
  Code2,
  MessageSquare,
  Bot,
  Lock,
} from 'lucide-react';
import DigitalGridCanvas from './DigitalGridCanvas';

export default function Hero() {
  const handleScrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.hash = 'features';
    }
  };

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden bg-[#05060f] text-white">
      {/* 1. 3D Digital Terrain & Particle Network Canvas */}
      <DigitalGridCanvas />

      {/* 2. Central Energy Beam Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none z-0">
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-brand-600/10 to-purple-600/20 blur-[130px] animate-pulse duration-[7000ms]" />
        {/* Vertical Beam of Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[550px] bg-gradient-to-b from-transparent via-cyan-400/50 via-purple-500/50 to-transparent blur-[1px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex-1 flex flex-col justify-between">
        {/* TOP BRANDING & HEADLINE */}
        <div className="text-center max-w-4xl mx-auto pt-2">
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-card/60 backdrop-blur-md border border-cyan-500/30 text-xs sm:text-sm font-semibold text-cyan-300 mb-6 shadow-lg shadow-cyan-950/40"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin-slow" />
            <span className="tracking-widest uppercase text-[11px] sm:text-xs">SURAJAI • Future of Intelligence</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl mx-auto leading-[1.1]"
          >
            Your Intelligent <span className="bg-gradient-to-r from-cyan-400 via-brand-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">AI Workspace</span> for Modern Innovation.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 text-base sm:text-xl text-gray-300 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Powered by AI. Built for You. One unified platform for streaming chat, coding assistance, document RAG, persistent memory, and real-time tools.
          </motion.p>
        </div>

        {/* CENTRAL ANIMATED AI ORB & FLOATING GLASS ICON CARDS */}
        <div className="relative my-8 sm:my-12 py-10 flex items-center justify-center min-h-[300px] sm:min-h-[360px]">
          {/* Floating Left Side Glass Icon Cards */}
          <div className="absolute left-2 sm:left-12 lg:left-24 top-1/2 -translate-y-1/2 flex flex-col gap-5 sm:gap-8 z-20">
            {/* Brain Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="p-3 sm:p-4 rounded-2xl bg-[#090b17]/80 backdrop-blur-xl border border-cyan-500/40 shadow-xl shadow-cyan-950/50 group hover:border-cyan-400 hover:scale-110 transition-all duration-300 cursor-pointer"
            >
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 group-hover:drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
            </motion.div>

            {/* Code Card */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="p-3 sm:p-4 rounded-2xl bg-[#090b17]/80 backdrop-blur-xl border border-brand-500/40 shadow-xl shadow-brand-950/50 group hover:border-brand-400 hover:scale-110 transition-all duration-300 cursor-pointer"
            >
              <Code2 className="w-6 h-6 sm:w-8 sm:h-8 text-brand-400 group-hover:drop-shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
            </motion.div>

            {/* Chat Card */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="p-3 sm:p-4 rounded-2xl bg-[#090b17]/80 backdrop-blur-xl border border-indigo-500/40 shadow-xl shadow-indigo-950/50 group hover:border-indigo-400 hover:scale-110 transition-all duration-300 cursor-pointer"
            >
              <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 group-hover:drop-shadow-[0_0_12px_rgba(129,140,248,0.8)]" />
            </motion.div>
          </div>

          {/* CENTRAL GLOWING 3D "AI" ORB PLATFORM */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            {/* Outer Concentric Rotating Ring 1 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] rounded-full border border-dashed border-cyan-400/30 pointer-events-none"
            />

            {/* Inner Counter-Rotating Ring 2 */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="absolute w-[190px] h-[190px] sm:w-[260px] sm:h-[260px] rounded-full border border-dotted border-purple-500/40 pointer-events-none"
            />

            {/* Central Energy Core Circle */}
            <div className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-[#0c122c] via-[#111638] to-[#1a0f30] border-2 border-cyan-400/60 shadow-[0_0_50px_rgba(56,189,248,0.4)] flex flex-col items-center justify-center group hover:scale-105 transition-transform duration-500">
              {/* Glowing Typography "AI" */}
              <span className="text-4xl sm:text-6xl font-black bg-gradient-to-r from-cyan-400 via-blue-300 via-indigo-200 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(56,189,248,0.8)] tracking-tighter">
                AI
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-cyan-300/90 uppercase tracking-widest mt-1">
                SURAJAI CORE
              </span>
              {/* Pulsing Core Light */}
              <div className="absolute inset-0 rounded-full bg-cyan-500/10 animate-ping duration-1000 pointer-events-none" />
            </div>

            {/* Futuristic Ground Circular Energy Rings */}
            <div className="absolute -bottom-10 w-[280px] sm:w-[400px] h-[60px] rounded-[100%] bg-cyan-500/15 blur-xl pointer-events-none" />
          </div>

          {/* Floating Right Side Glass Icon Cards */}
          <div className="absolute right-2 sm:right-12 lg:right-24 top-1/2 -translate-y-1/2 flex flex-col gap-5 sm:gap-8 z-20">
            {/* Robot Card */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              className="p-3 sm:p-4 rounded-2xl bg-[#090b17]/80 backdrop-blur-xl border border-purple-500/40 shadow-xl shadow-purple-950/50 group hover:border-purple-400 hover:scale-110 transition-all duration-300 cursor-pointer"
            >
              <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 group-hover:drop-shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
            </motion.div>

            {/* Processor Chip Card */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3.7, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
              className="p-3 sm:p-4 rounded-2xl bg-[#090b17]/80 backdrop-blur-xl border border-fuchsia-500/40 shadow-xl shadow-fuchsia-950/50 group hover:border-fuchsia-400 hover:scale-110 transition-all duration-300 cursor-pointer"
            >
              <Cpu className="w-6 h-6 sm:w-8 sm:h-8 text-fuchsia-400 group-hover:drop-shadow-[0_0_12px_rgba(217,70,239,0.8)]" />
            </motion.div>

            {/* Security Lock Card */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
              className="p-3 sm:p-4 rounded-2xl bg-[#090b17]/80 backdrop-blur-xl border border-emerald-500/40 shadow-xl shadow-emerald-950/50 group hover:border-emerald-400 hover:scale-110 transition-all duration-300 cursor-pointer"
            >
              <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 group-hover:drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
            </motion.div>
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="text-center z-20 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            {/* Start Chatting Button */}
            <Link
              href="/workspace"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 text-base font-bold text-white bg-gradient-to-r from-cyan-600 via-brand-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 px-8 py-4 rounded-2xl shadow-xl shadow-cyan-600/30 hover:shadow-cyan-400/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 border border-cyan-300/30"
            >
              <span>Start Chatting</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            {/* Explore Architecture Button with Rainbow Animated Border */}
            <div className="relative w-full sm:w-auto p-[2px] rounded-[18px] bg-gradient-to-r from-pink-500 via-purple-500 via-cyan-400 to-amber-400 shadow-2xl shadow-purple-950/60 hover:shadow-cyan-500/40 transition-all duration-500 group">
              <Link
                href="#features"
                onClick={handleScrollToFeatures}
                className="relative z-10 w-full sm:w-auto inline-flex items-center justify-center gap-2.5 text-base font-bold text-white bg-[#080914] hover:bg-[#0f1124] px-8 py-4 rounded-[16px] transition-all duration-300 group-hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent font-extrabold tracking-wide">
                  Explore AI Architecture
                </span>
                <Layers className="w-5 h-5 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
              </Link>
              <div className="absolute -inset-1 rounded-[20px] bg-gradient-to-r from-pink-500 via-purple-500 via-cyan-400 to-amber-400 opacity-70 group-hover:opacity-100 blur-md transition-all duration-500 animate-pulse pointer-events-none" />
            </div>
          </motion.div>

          {/* Feature Pillars Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10 pt-6 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-400 font-medium hover:text-cyan-300 transition-colors">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Multi-Provider Engine</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-400 font-medium hover:text-cyan-300 transition-colors">
              <Database className="w-4 h-4 text-brand-400" />
              <span>Document RAG</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-400 font-medium hover:text-cyan-300 transition-colors">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Long-Term Memory</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-400 font-medium hover:text-cyan-300 transition-colors">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Enterprise Security</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
