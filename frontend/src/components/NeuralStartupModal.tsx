'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Cpu, Database, ShieldCheck, Zap } from 'lucide-react';

interface NeuralStartupModalProps {
  isOpen: boolean;
  onCancel?: () => void;
}

export default function NeuralStartupModal({ isOpen }: NeuralStartupModalProps) {
  const [progress, setProgress] = useState(5);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { title: 'Waking up Render API Engine...', icon: Zap, detail: 'Spinning up free cloud server instance' },
    { title: 'Connecting to TiDB Database...', icon: Database, detail: 'Establishing encrypted MySQL SSL pool' },
    { title: 'Initializing SurajAI Models...', icon: Cpu, detail: 'Loading Gemini & OpenAI AI pipelines' },
    { title: 'Authenticating Secure Session...', icon: ShieldCheck, detail: 'Verifying JWT access token' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setProgress(5);
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        const next = prev + 2;
        if (next > 75) setCurrentStep(3);
        else if (next > 48) setCurrentStep(2);
        else if (next > 22) setCurrentStep(1);
        else setCurrentStep(0);
        return next;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#04040a]/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md bg-[#0c0d1a]/95 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.35)] overflow-hidden">
        {/* Top Glow Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600" />

        {/* Ambient Ring */}
        <div className="flex flex-col items-center text-center space-y-5">
          <div className="relative flex items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 border-r-purple-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <CurrentIcon className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-100 flex items-center justify-center gap-2">
              <span>Initializing SurajAI</span>
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            </h3>
            <p className="text-xs text-slate-400 font-medium">Connecting to Render Cloud & TiDB Database</p>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
              <span className="text-cyan-400 font-semibold">{steps[currentStep].title}</span>
              <span className="text-purple-400 font-bold">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-900/90 rounded-full border border-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-wide pt-1">
              {steps[currentStep].detail}
            </p>
          </div>

          {/* Step Badges */}
          <div className="grid grid-cols-4 gap-1.5 w-full pt-2">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-xl text-[10px] font-semibold border transition-all ${
                  idx === currentStep
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : idx < currentStep
                    ? 'bg-purple-950/40 border-purple-500/30 text-purple-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-600'
                }`}
              >
                Step {idx + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
