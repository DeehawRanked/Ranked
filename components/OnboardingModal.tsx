'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ranked_onboarded';

const SLIDES = [
  {
    emoji: '📸',
    title: 'Photos that actually get seen',
    body: 'Ranked is a competition, not a feed. Every photo you post enters the live leaderboard and fights for the top spot.',
  },
  {
    emoji: '⏱',
    title: '72 hours to prove yourself',
    body: 'Every post has a 72-hour survival window. Earn likes and comments to climb the rankings before the clock runs out.',
  },
  {
    emoji: '🏆',
    title: 'Win the season. Make history.',
    body: 'The top posts at the end of each month enter the Hall of Fame. A fresh season starts every month — everyone begins equal.',
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-end">
      <div className="w-full max-w-lg mx-auto bg-zinc-950 border-t border-zinc-800 rounded-t-3xl px-6 pb-10 pt-6">
        {/* Dots */}
        <div className="flex justify-center gap-1.5 mb-8">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${i === slide ? 'w-6 bg-red-500' : 'w-1.5 bg-zinc-700'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{current.emoji}</div>
          <h2 className="text-white font-black text-xl mb-3 leading-tight">{current.title}</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">{current.body}</p>
        </div>

        {/* Actions */}
        <button
          onClick={() => isLast ? dismiss() : setSlide(s => s + 1)}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-black text-sm py-4 rounded-2xl transition-colors mb-3"
        >
          {isLast ? "Let's Go →" : 'Next'}
        </button>
        <button
          onClick={dismiss}
          className="w-full py-2 text-zinc-600 text-sm hover:text-zinc-400 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
