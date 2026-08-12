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
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-3 sm:p-6 relative overflow-hidden select-none">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      {/* Main Split Container */}
      <div className="w-full max-w-4xl h-[92vh] max-h-[640px] grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl backdrop-blur-2xl relative z-10 my-auto">
        
        {/* LEFT SIDE: App Info, Logo & Hero Highlights */}
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-950 p-6 lg:p-8 flex-col justify-between border-r border-slate-800/80 relative overflow-hidden">
          {/* Background Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-5 relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl gradient-btn flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
                ⚡
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                  NEXUS <span className="text-[10px] text-cyan-400 font-extrabold bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">HQ</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium">Enterprise Communications</p>
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-2 pt-1">
              <h2 className="text-base font-extrabold text-white leading-snug">
                Real-Time Chat & Distributed AI Workflows
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Connect with workspace groups powered by zero-latency Socket.IO WebSockets and automated Groq AI daily summaries.
              </p>
            </div>

            {/* Feature Cards List */}
            <div className="space-y-2 pt-1">
              <div className="p-2.5 bg-slate-900/70 border border-slate-800/80 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xs shrink-0">
                  💬
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Live WebSockets</h4>
                  <p className="text-[10px] text-slate-400">Instant room messages & status</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/70 border border-slate-800/80 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs shrink-0">
                  🚀
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Groq AI Summaries</h4>
                  <p className="text-[10px] text-slate-400">Automated BullMQ worker jobs</p>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/70 border border-slate-800/80 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs shrink-0">
                  🔒
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-white">Google OAuth 2.0</h4>
                  <p className="text-[10px] text-slate-400">Enterprise single sign-on</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer System Status Badge */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80 relative z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-extrabold text-slate-300">All Systems Operational</span>
          </div>
        </div>

        {/* RIGHT SIDE: Login & Registration Form */}
        <div className="col-span-1 md:col-span-7 bg-slate-950/90 p-5 sm:p-7 flex flex-col justify-center space-y-4 overflow-y-auto">
          {/* Mobile-only logo header */}
          <div className="md:hidden text-center space-y-1 pb-1">
            <div className="w-10 h-10 rounded-2xl gradient-btn flex items-center justify-center font-black text-white text-lg mx-auto shadow-md">
              ⚡
            </div>
            <h1 className="text-lg font-black text-white">NEXUS HQ</h1>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white">
              {mode === 'login' ? 'Sign In to Workspace' : 'Create Your Account'}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'login'
                ? 'Enter your account credentials to log in.'
                : 'Register a new developer account to join groups.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all duration-150 ${
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
              className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all duration-150 ${
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
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center flex items-center justify-center gap-2">
              <span className="text-xs">⚠️</span>
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-extrabold text-slate-300 mb-1 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  placeholder="e.g. john_doe"
                  className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-extrabold text-slate-300 mb-1 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g. alice@example.com"
                className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-300 mb-1 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Enter your password"
                className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password || (mode === 'register' && !username)}
              className="w-full py-2.5 gradient-btn text-white font-black rounded-xl text-xs disabled:opacity-40 transition-all shadow-lg mt-1 flex justify-center items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <div className="flex justify-center w-full min-h-[40px]">
            <div ref={googleBtnRef} className="w-full flex justify-center overflow-hidden" />
          </div>
        </div>
      </div>
    </div>
  );
};
