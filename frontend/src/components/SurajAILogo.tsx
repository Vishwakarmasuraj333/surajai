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

  const badgeTextSizes = {
    xs: 'text-[9px] px-1 py-0.2',
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-0.5',
    xl: 'text-base px-3 py-1',
  };

  return (
    <div className={`inline-flex items-center group cursor-pointer select-none ${textSizes[size]} ${className}`}>
      {/* Radiant Sun-Quantum Icon Emblem */}
      {showIcon && (
        <div
          className={`relative ${iconSizes[size]} rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-600 p-[1.5px] shadow-[0_0_20px_rgba(6,182,212,0.35)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.55)] group-hover:scale-105 transition-all duration-300 mr-2.5`}
        >
          {/* Inner Dark Core */}
          <div className="w-full h-full bg-[#070712] rounded-[14px] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-blue-500/10 to-purple-600/20 opacity-80 group-hover:opacity-100 transition-opacity" />

            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-3/5 h-3/5 relative z-10 text-cyan-400 group-hover:rotate-45 transition-transform duration-500"
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="opacity-60 animate-spin-slow" />
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
        </div>
      )}

      {/* Ultra-Premium Radiant Typography */}
      {showText && (
        <span className="font-extrabold tracking-tight flex items-center">
          {/* "SURAJ" Radiant Metallic Gradient Text */}
          <span className="bg-gradient-to-r from-white via-slate-100 to-cyan-200 bg-clip-text text-transparent font-black tracking-tight drop-shadow-[0_2px_12px_rgba(6,182,212,0.3)]">
            SURAJ
          </span>
          
          {/* "AI" High-Tech Cybernetic Badge */}
          <span className={`ml-1.5 font-mono font-black uppercase tracking-widest bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 text-white rounded-lg border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.4)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] group-hover:scale-105 transition-all duration-300 ${badgeTextSizes[size]}`}>
            AI
          </span>
        </span>
      )}
    </div>
  );
}
