import React, { useState } from 'react';
import { Layers, Shield, Briefcase, Code2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('admin@velozity.com');
  const [password, setPassword] = useState('Password123!');
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

  const handleQuickLogin = async (demoEmail: string) => {
    setError('');
    setEmail(demoEmail);
    setPassword('Password123!');
    try {
      await login(demoEmail, 'Password123!');
    } catch (err: any) {
      setError(err.message || 'Login failed.');
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
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@velozity.com"
                className="w-full text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-white px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-white px-3.5 py-2.5 focus:outline-none focus:border-cyan-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 rounded-xl transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Access Buttons for Evaluator */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                1-Click Evaluator Logins:
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">Password123!</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@velozity.com')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-rose-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                      Admin: Sarah Connor
                    </div>
                    <div className="text-[11px] text-slate-400">admin@velozity.com</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-white uppercase">
                  Login &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('pm1@velozity.com')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                      PM 1: Alex Morgan
                    </div>
                    <div className="text-[11px] text-slate-400">pm1@velozity.com (Projects 1 & 2)</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-white uppercase">
                  Login &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('pm2@velozity.com')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                      PM 2: Jordan Lee
                    </div>
                    <div className="text-[11px] text-slate-400">pm2@velozity.com (Project 3)</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-white uppercase">
                  Login &rarr;
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dev1@velozity.com')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 text-left transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors">
                      Developer: Ravi Sharma
                    </div>
                    <div className="text-[11px] text-slate-400">dev1@velozity.com (Assigned Tasks)</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-white uppercase">
                  Login &rarr;
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-500">
          JWT Access Token (Memory) + HttpOnly SameSite Cookie Refresh Token
        </div>
      </div>
    </div>
  );
};
