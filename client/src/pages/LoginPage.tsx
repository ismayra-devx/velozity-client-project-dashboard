import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Users,
  CheckSquare,
  BarChart3,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'ymail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'zoho.com',
  'mail.com',
  'gmx.com',
]);

function isPersonalEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return Boolean(domain && PERSONAL_EMAIL_DOMAINS.has(domain));
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your work email address.');
      return;
    }

    if (isPersonalEmail(trimmedEmail)) {
      setError(
        'Personal email addresses (e.g. @gmail, @yahoo, @hotmail, @outlook) are not permitted. Please use your official corporate agency work email (e.g. @velozity.com).'
      );
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(trimmedEmail, password);
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password. Please check your credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-white text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Left Column - Clean Authentication Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 xl:p-20 overflow-y-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8">
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
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                <Briefcase className="w-3 h-3" />
                Work Email Only
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-xs text-slate-500 mt-1.5">
              Sign in with your corporate agency credentials to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="name@velozity.com"
                  className="w-full text-xs rounded-xl bg-slate-50/50 border border-slate-200 text-slate-900 pl-10 pr-3.5 py-3 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Must be an official agency domain (e.g. @velozity.com). Personal emails are not allowed.
              </p>
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
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
              disabled={isSubmitting}
              className="w-full py-3 px-4 text-xs font-bold text-white bg-[#1e293b] hover:bg-[#0f172a] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Logins for Convenience */}
          <div className="pt-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
              Quick Switch (Demo Accounts)
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setDemoUser('admin@velozity.com')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('pm1@velozity.com')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                PM 1
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('pm2@velozity.com')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                PM 2
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('dev1@velozity.com')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Dev 1
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('dev2@velozity.com')}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Dev 2
              </button>
            </div>
          </div>

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
