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
    <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-3 sm:p-4 relative overflow-hidden select-none">
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-white p-6 sm:p-7 rounded-3xl space-y-4 relative z-10 border border-slate-200 shadow-2xl shadow-slate-950/5 my-auto">
        {/* Brand Logo & Tagline */}
        <div className="text-center space-y-1.5">
          <div className="relative w-12 h-12 rounded-2xl gradient-btn flex items-center justify-center font-black text-white text-xl mx-auto shadow-lg shadow-blue-500/25 ring-2 ring-white">
            ⚡
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
              NEXUS <span className="text-[10px] text-blue-600 font-extrabold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 tracking-wider">HQ</span>
            </h1>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto font-medium">
              {mode === 'login'
                ? 'Sign in to access your enterprise workspace.'
                : 'Create an account to join workspace groups.'}
            </p>
          </div>

          {/* Feature Badges Row */}
          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              💬 WebSockets
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              🚀 Groq AI
            </span>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
              ⚡ BullMQ
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all duration-150 ${
              mode === 'login'
                ? 'gradient-btn text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
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
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs text-center flex items-center justify-center gap-2">
            <span className="text-xs">⚠️</span>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                placeholder="e.g. john_doe"
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g. alice@example.com"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/30 transition-all"
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
          <div className="flex-1 h-[1px] bg-slate-200"></div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Or continue with</span>
          <div className="flex-1 h-[1px] bg-slate-200"></div>
        </div>

        {/* Official Working Google OAuth Interactive Button */}
        <div className="flex justify-center w-full min-h-[40px]">
          <div ref={googleBtnRef} className="w-full flex justify-center overflow-hidden" />
        </div>
      </div>
    </div>
  );
};
