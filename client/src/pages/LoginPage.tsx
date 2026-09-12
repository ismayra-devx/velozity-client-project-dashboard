import React, { useState } from 'react';
import { Layers, ArrowRight, Lock, Mail, Eye, EyeOff, Users, CheckSquare, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const LoginPage: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="min-h-screen flex bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left Column - Clean Authentication Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 xl:p-20 overflow-y-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
              VELOZITY
            </div>
            <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Agency Portal
            </div>
          </div>
        </div>

        {/* Center Form */}
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              Sign in to access your projects, tasks, and team activity.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full text-xs rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 pl-10 pr-3.5 py-3 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full text-xs rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 pl-10 pr-10 py-3 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 text-xs font-bold text-white bg-[#1e293b] hover:bg-[#0f172a] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400">
                OR
              </span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-slate-400">
              By signing in, you agree to our internal access policy.
            </p>
          </div>
        </div>

        {/* Empty bottom spacer for layout balance */}
        <div className="hidden lg:block h-10" />
      </div>

      {/* Right Column - Modern Agency Workspace & Floating Value Card */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center p-12 overflow-hidden">
        {/* Background Image with tasteful darkening overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/login-bg.jpg')`,
          }}
        />
        <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px]" />

        {/* Motivational Wall Typography */}
        <div className="absolute top-16 left-16 text-white/30 font-black text-4xl tracking-widest select-none pointer-events-none">
          BUILD<br />DELIVER<br />GROW
        </div>

        {/* Centered Floating Frosted Value Card */}
        <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl p-7 shadow-2xl border border-white/60 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Collaborate</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Work together with your team in real time.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Track Progress</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Stay updated on every task and milestone.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Deliver Results</h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Keep your projects on schedule and your clients happy.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Tagline */}
        <div className="absolute bottom-10 left-16 right-16 flex flex-col gap-2 text-left z-10">
          <div className="w-12 h-0.5 bg-white/40" />
          <p className="text-xs text-white/90 font-medium tracking-wide">
            One agency. Many possibilities.
          </p>
        </div>
      </div>
    </div>
  );
};
