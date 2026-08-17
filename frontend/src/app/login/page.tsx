'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, ShieldCheck, Sparkles } from 'lucide-react';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import SurajAILogo from '@/components/SurajAILogo';
import CinematicLoginBg from '@/components/CinematicLoginBg';
import NeuralStartupModal from '@/components/NeuralStartupModal';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulseTrigger, setPulseTrigger] = useState<number>(0);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError(null);
        setPulseTrigger((prev) => prev + 1);
        await loginWithGoogle(tokenResponse.access_token);
      } catch (err: any) {
        setError(err.message || 'Google Sign-In failed.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google Sign-In was cancelled or failed.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Trigger portal shockwave energy pulse on canvas
    setPulseTrigger((prev) => prev + 1);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleLogin = () => {
    setPulseTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#04040a] text-gray-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* 60 FPS Canvas & Parallax Motion Background Engine */}
      <CinematicLoginBg pulseTrigger={pulseTrigger} focusedField={focusedInput} />

      {/* Top Navigation Header */}
      <header className="p-6 md:p-8 relative z-20 flex items-center justify-between">
        <Link href="/" className="inline-block transition-transform hover:scale-105">
          <SurajAILogo size="lg" />
        </Link>

        {/* Live System Online Badge */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>AI Core v2.4 Online</span>
          </div>
        </div>
      </header>

      {/* Centered Ultra-Premium Glassmorphic Login Card */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative z-20 my-auto">
        <div className="w-full max-w-[420px] cinematic-glass-card rounded-3xl p-7 sm:p-9 space-y-5 transition-all duration-500 relative overflow-hidden mt-6 sm:mt-10">
          
          {/* Subtle Top Holographic Border Highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 via-purple-500 to-transparent opacity-90" />

          {/* Card Header & Branding */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <SurajAILogo showIcon={false} size="xs" />
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              Welcome Back
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Sign in to continue to your AI workspace
            </p>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-300 animate-in fade-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Input Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block tracking-wide flex items-center justify-between">
                <span>Email Address</span>
                {focusedInput === 'email' && (
                  <span className="text-[10px] text-cyan-400 font-mono animate-pulse">● Active</span>
                )}
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  focusedInput === 'email' ? 'text-cyan-400' : 'text-slate-400'
                }`} />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onFocus={() => {
                    setFocusedInput('email');
                    setPulseTrigger((prev) => prev + 1);
                  }}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full neon-input rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Input Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block tracking-wide flex items-center gap-2">
                  <span>Password</span>
                  {focusedInput === 'password' && (
                    <span className="text-[10px] text-purple-400 font-mono animate-pulse">● Encrypted</span>
                  )}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-medium hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${
                  focusedInput === 'password' ? 'text-purple-400' : 'text-slate-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onFocus={() => {
                    setFocusedInput('password');
                    setPulseTrigger((prev) => prev + 1);
                  }}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full neon-input rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Device & Security Badge */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 w-3.5 h-3.5 accent-cyan-500 cursor-pointer"
                />
                <span>Remember this device</span>
              </label>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>256-bit AES</span>
              </div>
            </div>

            {/* Premium Animated Gradient Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full light-sweep-btn inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-white font-bold py-3.5 px-5 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono tracking-wider">Connecting to AI Workspace...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-cyan-200" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-slate-700/50 w-full" />
            <span className="bg-[#0b0c16] px-3 text-[11px] text-slate-500 uppercase tracking-widest font-mono">
              OR
            </span>
          </div>

          {/* Single Clean Google OAuth Button */}
          <div className="flex justify-center w-full overflow-hidden rounded-xl">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  try {
                    setLoading(true);
                    setError(null);
                    setPulseTrigger((prev) => prev + 1);
                    await loginWithGoogle(credentialResponse.credential);
                  } catch (err: any) {
                    setError(err.message || 'Google Sign-In failed.');
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              onError={() => {
                setError('Google Sign-In was cancelled or failed.');
              }}
              theme="filled_blue"
              shape="pill"
              size="large"
              width="360"
            />
          </div>

          {/* Footer Create Account Link */}
          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors ml-1 underline decoration-cyan-500/40 underline-offset-4"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Futuristic System Capabilities Ticker */}
        <div className="w-full max-w-[420px] mx-auto mt-5 p-4 rounded-2xl bg-[#090a16]/80 border border-cyan-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.15)] space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/80 pb-2">
            <span className="flex items-center gap-1.5 text-cyan-400 font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> SURAJ AI ENGINES
            </span>
            <span className="text-purple-400 font-semibold">● 100% LIVE</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-300">
            <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-2">
              <span className="text-cyan-400">⚡</span> Gemini 1.5 & GPT-4o
            </div>
            <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-2">
              <span className="text-purple-400">💾</span> TiDB Cloud MySQL
            </div>
            <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-2">
              <span className="text-rose-400">🎨</span> Real FLUX & DALL-E 3
            </div>
            <div className="p-2 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-2">
              <span className="text-emerald-400">🧠</span> Persistent RAG Memory
            </div>
          </div>
        </div>
      </main>

      <NeuralStartupModal isOpen={loading} />

      {/* Radiant Footer */}
      <footer className="p-6 text-center text-[11px] text-slate-500 relative z-20 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto w-full gap-3">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()}</span>
          <SurajAILogo showIcon={false} size="xs" />
          <span>Platform. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-mono text-[10px]">
          <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#" className="hover:text-cyan-400 transition-colors">Security Audit</a>
        </div>
      </footer>
    </div>
  );
}
