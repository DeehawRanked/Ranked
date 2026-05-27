'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';

const NAV_ITEMS = [
  { href: '/', label: 'Feed', icon: '🏆' },
  { href: '/explore', label: 'Explore', icon: '🔍' },
  { href: '/upload', label: 'Post', icon: '➕' },
  { href: '/profile', label: 'Profile', icon: '👤' },
];

export default function Navigation() {
  const pathname = usePathname();
  const { toggleDevMode, state } = useStore();
  const [tapCount, setTapCount] = useState(0);
  const [tapFlash, setTapFlash] = useState(false);

  function handleLogoTap() {
    const u = state.currentUser.username.toLowerCase();
    if (u !== 'sultan' && u !== 'deehaw') return;
    const next = tapCount + 1;
    if (next >= 5) {
      toggleDevMode();
      setTapCount(0);
      setTapFlash(true);
      setTimeout(() => setTapFlash(false), 600);
    } else {
      setTapCount(next);
      setTimeout(() => setTapCount((c) => (c === next ? 0 : c)), 3000);
    }
  }

  return (
    <>
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-zinc-900" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo + wordmark — tap 5× to unlock dev mode */}
          <button
            onClick={handleLogoTap}
            className={`flex items-center gap-2.5 select-none transition-all ${
              tapFlash ? 'opacity-50' : 'opacity-100'
            }`}
            aria-label="RANKED"
          >
            <div className="relative w-8 h-8 shrink-0">
              <Image
                src="/Logo.jpeg"
                alt="RANKED logo"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">RANKED</span>
              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                LIVE
              </span>
            </div>
          </button>

          <div className="flex items-center gap-3">
            {/* Dev mode indicator — subtle, only visible when on */}
            {state.devMode && (
              <span className="text-xs text-zinc-600 font-mono">DEV</span>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-zinc-500">Season Active</span>
            </div>
          </div>
        </div>

        {/* Thin red accent line under the header */}
        <div className="h-px bg-gradient-to-r from-transparent via-red-600/60 to-transparent" />
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-zinc-900" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Thin red accent line above the nav */}
        <div className="h-px bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />
        <div className="max-w-lg mx-auto px-2">
          <ul className="flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href} className="flex-1">
                  <Link
                    href={item.href}
                    className={`flex flex-col items-center gap-0.5 py-3 text-xs transition-colors ${
                      active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="text-lg leading-none">{item.icon}</span>
                    <span className={`font-medium ${active ? 'text-red-500' : ''}`}>
                      {item.label}
                    </span>
                    {active && (
                      <span className="w-1 h-1 rounded-full bg-red-500 mt-0.5" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}
