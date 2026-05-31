'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { register, signIn } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';

export default function AuthPage() {
  const router = useRouter();
  const { setUsername } = useStore();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsernameField] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Already logged in — skip straight to app
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/');
    });
  }, [router]);

  async function handleForgot(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'ranked://auth/reset',
    });
    setLoading(false);
    if (error) {
      setError('Could not send reset email. Please try again.');
    } else {
      setSuccess('If an account exists with this email, a password reset link has been sent.');
    }
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'signup') {
      if (!birthdate) { setError('Please enter your date of birth.'); return; }
      const age = (Date.now() - new Date(birthdate).getTime()) / (365.25 * 24 * 3_600_000);
      if (age < 13) {
        setError('You must be at least 13 years old to create an account.');
        return;
      }
    }

    setLoading(true);

    try {
      const result = await (
        mode === 'signup'
          ? register(email.trim(), password, username.trim())
          : signIn(email.trim(), password)
      );

      if (!result.success) {
        setError(result.error ?? 'Something went wrong.');
        setLoading(false);
        return;
      }

      if (result.needsVerification) {
        setSuccess('Check your email and click the verification link before signing in.');
        setLoading(false);
        return;
      }

      if (result.session) {
        setUsername(result.session.username, result.session.id);
      }

      // Use hard navigation — Capacitor's WKWebView doesn't reliably handle
      // client-side router.replace across routes on first load
      window.location.replace('/');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="relative w-24 h-24 mb-5">
        <Image src="/Logo.jpeg" alt="RANKED" fill sizes="96px" className="object-contain" priority />
      </div>
      <h1 className="text-white font-black text-3xl tracking-tight mb-1">RANKED</h1>
      <p className="text-zinc-500 text-sm mb-8">Post. Rank. Survive.</p>

      {/* Tabs */}
      {mode !== 'forgot' && (
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1 mb-6 w-full max-w-sm">
          {(['signin', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                mode === m ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>
      )}

      {mode === 'forgot' && (
        <div className="w-full max-w-sm mb-2">
          <h2 className="text-white font-black text-xl mb-1">Reset Password</h2>
          <p className="text-zinc-500 text-sm mb-6">Enter your email and a new password.</p>
          <form onSubmit={handleForgot} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              autoComplete="email"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
            {error && <p className="text-red-400 text-xs text-center px-2">{error}</p>}
            {success && <p className="text-green-400 text-xs text-center px-2">{success}</p>}
            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black text-base py-4 rounded-2xl transition-colors">
              {loading ? '…' : 'Send Reset Link →'}
            </button>
            <button type="button" onClick={() => { setMode('signin'); setError(''); setSuccess(''); }} className="w-full text-zinc-500 text-sm py-2 hover:text-zinc-300 transition-colors">
              ← Back to Sign In
            </button>
          </form>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`w-full max-w-sm space-y-3 ${mode === 'forgot' ? 'hidden' : ''}`}>
        {mode === 'signup' && (
          <>
            <input
              value={username}
              onChange={(e) => setUsernameField(e.target.value)}
              placeholder="Username"
              required
              autoComplete="username"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
            <div>
              <label className="block text-xs font-semibold text-zinc-500 mb-1.5 px-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                required
                max={new Date().toISOString().slice(0, 10)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-zinc-500 transition-colors [color-scheme:dark]"
              />
              <p className="text-zinc-700 text-xs mt-1 px-1">You must be 13 or older to use RANKED.</p>
            </div>
          </>
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          autoComplete="email"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={6}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
        />

        {error && <p className="text-red-400 text-xs text-center px-2">{error}</p>}
        {success && <p className="text-green-400 text-xs text-center px-2">{success}</p>}

        {mode === 'signin' && (
          <button type="button" onClick={() => { setMode('forgot'); setError(''); }} className="w-full text-zinc-500 text-xs text-right hover:text-zinc-300 transition-colors">
            Forgot password?
          </button>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black text-base py-4 rounded-2xl transition-colors"
        >
          {loading ? '…' : mode === 'signup' ? 'Create Account →' : 'Sign In →'}
        </button>
      </form>

      <p className="text-zinc-700 text-xs mt-6 text-center max-w-xs">
        By continuing you agree to the{' '}
        <Link href="/terms" className="text-zinc-400 underline underline-offset-2 hover:text-white transition-colors">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-zinc-400 underline underline-offset-2 hover:text-white transition-colors">
          Privacy Policy
        </Link>.
      </p>
    </div>
  );
}
