'use client';

import React, { useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthFormProps {
  onAuthSuccess: (token: string, user: User) => void;
  apiUrl?: string;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  onAuthSuccess,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showGoogleAccountPicker, setShowGoogleAccountPicker] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  // Pre-configured Google Accounts for 1-click selection
  const mockGoogleAccounts = [
    { name: 'Farhan Butt', email: 'farhan.butt@gmail.com', avatar: 'FB', bg: 'bg-red-500' },
    { name: 'Muhammad Farhan', email: 'farhan.dev@gmail.com', avatar: 'MF', bg: 'bg-blue-600' },
    { name: 'Demo Workspace User', email: 'demo.workspace@gmail.com', avatar: 'DW', bg: 'bg-emerald-600' },
  ];

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

  const handleSelectGoogleAccount = async (selectedEmail: string, selectedName: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${apiUrl}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedEmail.trim().toLowerCase(),
          name: selectedName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Google Auth failed');
      }

      onAuthSuccess(data.accessToken, data.user);
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
      setShowGoogleAccountPicker(false);
    }
  };

  return (
    <div className="min-h-screen glass-main flex items-center justify-center p-4 relative overflow-hidden select-none">
      <div className="w-full max-w-md glass-card p-8 rounded-3xl space-y-6 relative z-10 border border-slate-800 shadow-2xl">
        {/* Brand Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl gradient-btn flex items-center justify-center font-black text-white text-2xl mx-auto shadow-xl">
            ⚡
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            NEXUS HQ
          </h1>
          <p className="text-xs text-slate-400">
            {mode === 'login'
              ? 'Enter your account credentials to access your workspace.'
              : 'Create a new user profile to join workspace groups.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-200 ${
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
            className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-200 ${
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
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs text-center flex items-center justify-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                placeholder="e.g. john_doe"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="e.g. alice@example.com"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Enter your password"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password || (mode === 'register' && !username)}
            className="w-full py-3.5 gradient-btn text-white font-black rounded-xl text-xs disabled:opacity-40 transition-all shadow-xl mt-2 flex justify-center items-center gap-2"
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

        {/* Divider & Google OAuth Button at Bottom */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-[1px] bg-slate-800" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">or sign in with</span>
            <div className="flex-1 h-[1px] bg-slate-800" />
          </div>

          <button
            type="button"
            onClick={() => setShowGoogleAccountPicker(true)}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl border border-slate-700/80 flex items-center justify-center gap-3 transition-all hover:border-slate-600 shadow-md cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.4 0 15.3c0 2.9.7 5.6 1.9 8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>

      {/* Official-looking Google Account Selector Modal */}
      {showGoogleAccountPicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-5 shadow-2xl border border-slate-200">
            {/* Google Brand Header */}
            <div className="text-center space-y-1.5 border-b border-slate-100 pb-4">
              <svg className="w-6 h-6 mx-auto mb-1" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.4 0 15.3c0 2.9.7 5.6 1.9 8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <h3 className="text-base font-bold text-slate-900">Choose an account</h3>
              <p className="text-xs text-slate-500">to continue to NEXUS HQ</p>
            </div>

            {/* Account List */}
            {!showCustomGoogleInput ? (
              <div className="space-y-1">
                {mockGoogleAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleSelectGoogleAccount(acc.email, acc.name)}
                    className="w-full p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 flex items-center gap-3 text-left transition-all group cursor-pointer"
                  >
                    <div className={`w-9 h-9 rounded-full ${acc.bg} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                      {acc.avatar}
                    </div>
                    <div className="truncate flex-1">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {acc.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{acc.email}</p>
                    </div>
                    <span className="text-slate-400 text-xs">→</span>
                  </button>
                ))}

                <button
                  onClick={() => setShowCustomGoogleInput(true)}
                  className="w-full p-3 rounded-2xl border border-dashed border-slate-300 hover:bg-slate-50 flex items-center gap-3 text-left transition-all text-xs font-bold text-slate-600 cursor-pointer mt-2"
                >
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center shrink-0">
                    +
                  </div>
                  <span>Use another Google account</span>
                </button>
              </div>
            ) : (
              /* Custom Account Input Option */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customGoogleEmail && customGoogleName) {
                    handleSelectGoogleAccount(customGoogleEmail, customGoogleName);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Google Email
                  </label>
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    required
                    placeholder="name@gmail.com"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={customGoogleName}
                    onChange={(e) => setCustomGoogleName(e.target.value)}
                    required
                    placeholder="Your Name"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomGoogleInput(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900"
                  >
                    ← Back to account list
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow"
                  >
                    Sign In
                  </button>
                </div>
              </form>
            )}

            {/* Cancel Footer */}
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowGoogleAccountPicker(false);
                  setShowCustomGoogleInput(false);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
