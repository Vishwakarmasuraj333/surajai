'use client';

import React from 'react';

interface SurajAILogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showIcon?: boolean;
  showText?: boolean;
}

export default function SurajAILogo({
  className = '',
  size = 'md',
  showIcon = true,
  showText = true,
}: SurajAILogoProps) {
  const iconSizes = {
    xs: 'w-5 h-5',
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const textSizes = {
    xs: 'text-sm gap-1',
    sm: 'text-base gap-1.5',
    md: 'text-xl gap-2',
    lg: 'text-2xl gap-2.5',
    xl: 'text-4xl gap-3',
  };

  return (
    <div className={`inline-flex items-center group cursor-pointer select-none ${textSizes[size]} ${className}`}>
      {/* Radiant Sun-Quantum Icon Emblem - Seamless Transparent Background */}
      {showIcon && (
        <div
          className={`relative ${iconSizes[size]} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 mr-2.5 shrink-0`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full relative z-10 text-cyan-400 group-hover:rotate-45 transition-transform duration-500 filter drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]"
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-75 animate-spin-slow" />
            <path
              d="M12 3L14.8 9.2L21 12L14.8 14.8L12 21L9.2 14.8L3 12L9.2 9.2L12 3Z"
              fill="url(#surajQuantumGlow)"
            />
            <circle cx="12" cy="12" r="2.2" fill="#ffffff" />
            <defs>
              <linearGradient id="surajQuantumGlow" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#8b5cf6" />
                <stop offset="1" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* Ultra-Premium Transparent Typography */}
      {showText && (
        <span className="font-extrabold tracking-tight flex items-center">
          {/* "SURAJ" Radiant Metallic Gradient Text */}
          <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent font-black tracking-tight drop-shadow-[0_2px_12px_rgba(6,182,212,0.3)]">
            SURAJ
          </span>
          
          {/* "AI" Clean Seamless Gradient Text (No Background Box) */}
          <span className="ml-1.5 font-mono font-black uppercase tracking-widest bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(6,182,212,0.5)] group-hover:scale-105 transition-all duration-300">
            AI
          </span>
        </span>
      )}
    </div>
  );
}
