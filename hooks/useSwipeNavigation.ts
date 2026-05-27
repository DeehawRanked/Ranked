import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const ROUTES = ['/', '/explore', '/upload', '/profile'];
const H_THRESHOLD = 55;  // min horizontal distance to trigger
const MAX_V_RATIO = 0.55; // cancel if vertical movement exceeds this fraction of horizontal

function isInsideHorizontalScroll(el: EventTarget | null): boolean {
  let node = el as HTMLElement | null;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const overflow = style.overflowX;
    if ((overflow === 'auto' || overflow === 'scroll') && node.scrollWidth > node.clientWidth) {
      return true;
    }
    node = node.parentElement;
  }
  return false;
}

export function useSwipeNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let startTarget: EventTarget | null = null;
    let cancelled = false;

    function onTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startTarget = e.target;
      cancelled = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (cancelled) return;
      const dy = Math.abs(e.touches[0].clientY - startY);
      const dx = Math.abs(e.touches[0].clientX - startX);
      // Cancel if predominantly vertical
      if (dy > dx * 1.2) cancelled = true;
    }

    function onTouchEnd(e: TouchEvent) {
      if (cancelled) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = Math.abs(e.changedTouches[0].clientY - startY);

      if (Math.abs(dx) < H_THRESHOLD) return;
      if (dy > Math.abs(dx) * MAX_V_RATIO) return;
      if (isInsideHorizontalScroll(startTarget)) return;

      const currentIdx = ROUTES.indexOf(pathname);
      if (currentIdx === -1) return;

      if (dx < 0) {
        const next = ROUTES[currentIdx + 1];
        if (next) router.push(next);
      } else {
        const prev = ROUTES[currentIdx - 1];
        if (prev) router.push(prev);
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [pathname, router]);
}
