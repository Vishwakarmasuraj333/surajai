'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, Check, Sparkles } from 'lucide-react';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';
import SurajAILogo from '@/components/SurajAILogo';
import CinematicLoginBg from '@/components/CinematicLoginBg';
import { OtpVerificationModal } from '@/components/OtpVerificationModal';
import NeuralStartupModal from '@/components/NeuralStartupModal';

export default function RegisterPage() {
  const { register, loginWithGoogle, setSession } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulseTrigger, setPulseTrigger] = useState<number>(0);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);

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

  // Password strength evaluation
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLen && hasUpper && hasLower && hasNumber;

  const handleResendOtp = async (): Promise<boolean> => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Failed to resend verification code.');
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Please fulfill all password security requirements.');
      return;
    }

    setLoading(true);
    setPulseTrigger((prev) => prev + 1);

    try {
      await register(name, email, password);
      // Automatically send OTP code via Gmail SMTP
      await handleResendOtp();
      setShowOtpModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySuccess = (userData: any, accessToken: string) => {
    if (setSession) {
      setSession(userData, accessToken);
    }
    window.location.href = '/workspace';
  };

  return (
    <div className="min-h-screen bg-[#04040a] text-gray-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* 60 FPS Canvas Background */}
      <CinematicLoginBg pulseTrigger={pulseTrigger} focusedField={focusedInput} />

      <header className="p-6 md:p-8 relative z-20 flex items-center justify-between">
        <Link href="/" className="inline-block transition-transform hover:scale-105">
          <SurajAILogo size="lg" />
        </Link>
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Registration Open</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-20">
        <div className="w-full max-w-[450px] cinematic-glass-card rounded-3xl p-8 sm:p-10 space-y-6 transition-all duration-500 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-purple-500 opacity-80" />

          <div className="text-center space-y-2.5">
            <div className="flex justify-center mb-1">
              <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <SurajAILogo showIcon={false} size="xs" />
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">Get Started</h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Create your production-grade AI workspace
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3 text-xs text-red-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Suraj Vishwakarma"
                  value={name}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full neon-input rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full neon-input rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full neon-input rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength ticks */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Check className="w-3 h-3" /> 8+ Characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Check className="w-3 h-3" /> Uppercase Letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Check className="w-3 h-3" /> Lowercase Letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <Check className="w-3 h-3" /> Number
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full light-sweep-btn inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:via-blue-400 hover:to-indigo-500 text-white font-bold py-3.5 px-5 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
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

          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors ml-1 underline decoration-cyan-500/40 underline-offset-4">
              Sign In
            </Link>
          </div>
        </div>
      </main>

      <NeuralStartupModal isOpen={loading} />

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
        </div>
      </footer>

      {/* 6-Digit Email OTP Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        email={email}
        onClose={() => setShowOtpModal(false)}
        onVerifySuccess={handleVerifySuccess}
        onResendOtp={handleResendOtp}
      />
    </div>
  );
}
