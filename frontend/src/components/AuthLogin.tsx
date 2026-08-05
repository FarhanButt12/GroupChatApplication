'use client';

import React, { useState } from 'react';

interface AuthLoginProps {
  onLoginSuccess: (token: string, user: { id: string; name: string; email: string }) => void;
  apiUrl?: string;
}

export const AuthLogin: React.FC<AuthLoginProps> = ({
  onLoginSuccess,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
}) => {
  const [email, setEmail] = useState('user1@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const result = await response.json();
      // result structure: { message, data: { accessToken, user } }
      const token = result.data?.accessToken || result.accessToken;
      const user = result.data?.user || result.user;

      if (!token) {
        throw new Error('Access token missing from response');
      }

      onLoginSuccess(token, user);
    } catch (err: any) {
      setError(err.message || 'Error logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md border space-y-4">
      <h2 className="text-xl font-bold text-gray-800 text-center">Login to Chat</h2>
      <p className="text-xs text-gray-500 text-center">
        Use seeded credentials (e.g. <code className="bg-gray-100 px-1 py-0.5 rounded">user1@example.com</code> / <code className="bg-gray-100 px-1 py-0.5 rounded">password123</code>)
      </p>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};
