'use client';

import React, { useState, useEffect, useRef } from 'react';

import { API_BASE_URL, GOOGLE_CLIENT_ID } from '../config/constants';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthFormProps {
  onAuthSuccess: (token: string, user: User) => void;
  apiUrl?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const AuthForm: React.FC<AuthFormProps> = ({
  onAuthSuccess,
  apiUrl = API_BASE_URL,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = GOOGLE_CLIENT_ID;

  const handleGoogleResponse = async (response: any) => {
    if (!response.credential) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || 'Google authentication failed',
        );
      }

      onAuthSuccess(data.accessToken, data.user);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
          use_fedcm_for_prompt: false,
        });

        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_black',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 380,
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [googleClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        const regRes = await fetch(`${apiUrl}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            username: username.trim(),
            password: password.trim(),
          }),
        });

        const regData = await regRes.json();
        if (!regRes.ok) {
          throw new Error(
            Array.isArray(regData.message)
              ? regData.message.join(', ')
              : regData.message || 'Registration failed',
          );
        }

        onAuthSuccess(regData.accessToken, regData.user);
      } else {
        const loginRes = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password: password.trim(),
          }),
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) {
          throw new Error(
            Array.isArray(loginData.message)
              ? loginData.message.join(', ')
              : loginData.message || 'Invalid email or password',
          );
        }

        onAuthSuccess(loginData.accessToken, loginData.user);
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-950 flex overflow-hidden select-none">
      {/* FULL-PAGE SPLIT GRID */}
      <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* LEFT COLUMN: App Info, Hero Branding & Live Stats */}
        <div className="hidden lg:flex lg:col-span-7 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-12 lg:p-16 flex-col justify-between border-r border-slate-800/80 relative overflow-hidden">
          {/* Background Decorative Mesh Grids & Glows */}
          <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />

          {/* Top Brand Logo */}
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl gradient-btn flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-blue-500/20 ring-1 ring-white/20">
              ⚡
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                NEXUS <span className="text-xs text-cyan-400 font-extrabold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 tracking-wider">HQ</span>
              </h1>
              <p className="text-xs text-slate-400 font-semibold tracking-wide">ENTERPRISE CHAT WORKSPACE</p>
            </div>
          </div>

          {/* Hero Center Text & Feature Highlights */}
          <div className="max-w-xl space-y-8 relative z-10 py-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Next-Gen Distributed Collaboration</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                Empower your team with instant messaging & Groq AI summaries.
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">
                Experience real-time Socket.IO communication, distributed BullMQ worker queues, and automated daily AI chat summaries—all engineered into a sleek dark workspace.
              </p>
            </div>

            {/* Feature Cards Showcase */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl space-y-1.5 backdrop-blur-xl">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-base">
                  💬
                </div>
                <h4 className="text-xs font-extrabold text-white">Socket.IO</h4>
                <p className="text-[11px] text-slate-400">Zero-latency live rooms</p>
              </div>

              <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl space-y-1.5 backdrop-blur-xl">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-base">
                  🚀
                </div>
                <h4 className="text-xs font-extrabold text-white">Groq AI</h4>
                <p className="text-[11px] text-slate-400">Automated daily summaries</p>
              </div>

              <div className="p-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl space-y-1.5 backdrop-blur-xl">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-base">
                  ⚡
                </div>
                <h4 className="text-xs font-extrabold text-white">BullMQ Queues</h4>
                <p className="text-[11px] text-slate-400">Child-parent Redis flows</p>
              </div>
            </div>
          </div>

          {/* Bottom Footer Meta */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-6 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-slate-300">All Systems Operational</span>
            </div>
            <span className="font-medium text-slate-400">v2.5.0 Enterprise Release</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Auth Card Container */}
        <div className="col-span-1 lg:col-span-5 bg-slate-950 flex flex-col justify-center items-center p-6 sm:p-10 relative overflow-y-auto">
          {/* Mobile-only logo header */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-2xl gradient-btn flex items-center justify-center font-black text-white text-xl mx-auto shadow-lg">
              ⚡
            </div>
            <h1 className="text-xl font-black text-white">NEXUS HQ</h1>
          </div>

          <div className="w-full max-w-sm glass-card p-6 sm:p-8 rounded-3xl space-y-5 border border-slate-800/80 shadow-2xl backdrop-blur-2xl">
            {/* Form Header */}
            <div className="text-center space-y-1">
              <h3 className="text-xl font-black text-white tracking-tight">
                {mode === 'login' ? 'Sign In Workspace' : 'Create Account'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {mode === 'login'
                  ? 'Enter your account details to access your dashboard.'
                  : 'Register a developer profile to join workspace groups.'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 ${
                  mode === 'login'
                    ? 'gradient-btn text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 ${
                  mode === 'register'
                    ? 'gradient-btn text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs text-center flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    placeholder="e.g. john_doe"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="e.g. alice@example.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email || !password || (mode === 'register' && !username)}
                className="w-full py-3 gradient-btn text-white font-black rounded-xl text-xs disabled:opacity-40 transition-all shadow-xl mt-2 flex justify-center items-center gap-2 hover:scale-[1.01]"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : mode === 'login' ? (
                  'Sign In Workspace →'
                ) : (
                  'Register Account →'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-[1px] bg-slate-800/80"></div>
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">Or continue with</span>
              <div className="flex-1 h-[1px] bg-slate-800/80"></div>
            </div>

            {/* Official Working Google OAuth Interactive Button */}
            <div className="flex justify-center w-full min-h-[42px]">
              <div ref={googleBtnRef} className="w-full flex justify-center overflow-hidden" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
