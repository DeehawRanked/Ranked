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

    router.replace('/');
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

      {/* Divider */}
      <div className="flex items-center gap-3 my-5 w-full max-w-sm">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-zinc-600 text-xs font-medium">or</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>

      {/* Sign in with Apple */}
      <button
        type="button"
        onClick={() => setError('Apple Sign In requires an Apple Developer account and HTTPS. Coming soon!')}
        className="w-full max-w-sm flex items-center justify-center gap-3 bg-white hover:bg-zinc-100 text-black font-bold text-sm py-4 rounded-2xl transition-colors"
      >
        <svg width="17" height="17" viewBox="0 0 814 1000" fill="currentColor">
          <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-42.4-150.3-109.9c-51.8-75.5-83.4-190.8-83.4-300.3 0-180.5 117.6-275.8 233.5-275.8 63.4 0 116.2 41.8 155.8 41.8 37.5 0 98.7-44.2 168.1-44.2zm-73.9-294.8c31.5-37.5 54.2-89.7 54.2-141.9 0-7.7-.7-15.4-1.9-22.5-51.2 2-112.1 34.2-148.8 71.9-28.9 30.9-56.5 82.5-56.5 135.4 0 8.4 1.3 16.7 1.9 19.2 3.2.6 8.4 1.3 13.6 1.3 46.2 0 103.1-30.8 137.5-63.4z" />
        </svg>
        Sign in with Apple
      </button>

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
