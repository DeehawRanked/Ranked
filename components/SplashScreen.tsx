'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem('ranked_splash');
    if (!shown) {
      sessionStorage.setItem('ranked_splash', '1');
      setVisible(true);
      setTimeout(() => setFading(true), 1800);
      setTimeout(() => setVisible(false), 2400);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative w-36 h-36 mb-6">
        <Image src="/Logo.jpeg" alt="RANKED" fill sizes="144px" className="object-contain" priority />
      </div>
      <h1 className="text-white font-black text-4xl tracking-tight">RANKED</h1>
      <p className="text-zinc-500 text-sm mt-2">Post. Rank. Survive.</p>
    </div>
  );
}
