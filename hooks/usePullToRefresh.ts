import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 80;

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const pullYRef = useRef(0);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      // Only activate when truly at the top of the page
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop > 2) return;
      startY.current = e.touches[0].clientY;
      isPulling.current = false;
      pullYRef.current = 0;
    }

    function onTouchMove(e: TouchEvent) {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop > 2) { isPulling.current = false; return; }

      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) { isPulling.current = false; setPullY(0); return; }

      isPulling.current = true;
      const clamped = Math.min(delta * 0.5, THRESHOLD * 1.5);
      pullYRef.current = clamped;
      setPullY(clamped);
    }

    function onTouchEnd() {
      const y = pullYRef.current;
      isPulling.current = false;
      pullYRef.current = 0;
      setPullY(0);

      if (y >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        onRefresh().finally(() => setRefreshing(false));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRefresh]);

  return { refreshing, pullY };
}
