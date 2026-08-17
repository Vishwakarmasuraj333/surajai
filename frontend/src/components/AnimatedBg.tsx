'use client';

import React from 'react';

export default function AnimatedBg() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Moving Ambient Orb 1 */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-brand-600/20 via-purple-600/10 to-transparent blur-[140px] animate-pulse duration-[8000ms]" />

      {/* Moving Ambient Orb 2 */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-indigo-600/20 via-brand-500/10 to-transparent blur-[150px] animate-pulse duration-[10000ms]" />

      {/* Center Floating Orb 3 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full bg-gradient-to-tr from-purple-800/15 via-cyan-500/10 to-transparent blur-[120px] animate-pulse duration-[6000ms]" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
}
