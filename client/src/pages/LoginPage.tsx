import React, { useState } from 'react';
import { Layers, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-500 shadow-xl shadow-cyan-500/20 mb-2">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">VELOZITY</h1>
          <p className="text-xs text-slate-400">
            Real-Time Client Project Dashboard with Role-Based Access
          </p>
        </div>

        <div className="rounded-2xl glass-panel p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          <div className="border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-white">Sign In to Your Account</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your credentials to access your authorized role dashboard.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@velozity.com"
                className="w-full text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-white px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                className="w-full text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-white px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          Protected with JWT & HttpOnly Cookie Session Security
        </div>
      </div>
    </div>
  );
};
