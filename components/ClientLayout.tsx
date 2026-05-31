'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Navigation from './Navigation';
import SplashScreen from './SplashScreen';
import OnboardingModal from './OnboardingModal';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';
import { fetchProfile } from '@/lib/db';
import { registerPushNotifications, unregisterPushNotifications } from '@/lib/notifications';
import { initRevenueCat } from '@/lib/iap';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { getSeasonStatus, SeasonStatus } from '@/lib/season';
import SeasonTransition from './SeasonTransition';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  useSwipeNavigation();
  const { setUsername, setProfile, endSeason, state } = useStore();
  const bare = pathname.replace(/\/$/, '') || '/';
  const isAuthPage = bare === '/auth';
  const isPublicPage = isAuthPage || bare === '/terms' || bare === '/privacy';
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [seasonStatus, setSeasonStatus] = useState<SeasonStatus>(() => getSeasonStatus());

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setHasSession(true);
        // Fetch profile in background — don't block ready on it
        fetchProfile(session.user.id).then((profile) => {
          if (profile) {
            setProfile(profile);
          } else {
            setUsername(session.user.user_metadata?.username ?? '', session.user.id);
          }
        });
        registerPushNotifications(session.user.id);
        initRevenueCat(session.user.id);
      }
      if (!isPublicPage && !session) {
        router.replace('/auth');
      } else {
        setReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setHasSession(!!session);
      if (!session) {
        if (!isPublicPage) router.replace('/auth');
      } else if (event === 'SIGNED_IN') {
        // Delay so navigation to '/' completes before the system prompt appears
        setTimeout(() => registerPushNotifications(session.user.id), 1500);
      } else if (event === 'SIGNED_OUT') {
        unregisterPushNotifications(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Season phase — check every 30s, auto-end season when transition begins
  useEffect(() => {
    function check() {
      const status = getSeasonStatus();
      setSeasonStatus(status);
      // If stored season is behind the expected next season, end it
      if (status.phase === 'transition' && state.season !== status.nextSeason) {
        endSeason();
      }
      if (status.phase === 'active' && state.season < status.activeSeason) {
        endSeason();
      }
    }
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.season]);

  if (!isPublicPage && !ready) return null;

  const showNav = !isAuthPage && hasSession && ready;
  const showPadding = !isAuthPage && hasSession && ready;

  const inTransition = hasSession && seasonStatus.phase === 'transition';

  return (
    <>
      <SplashScreen />
      {showNav && <OnboardingModal />}
      {showNav && !inTransition && <Navigation />}
      {inTransition && seasonStatus.transitionEndsAt && (
        <SeasonTransition
          endedSeason={seasonStatus.activeSeason}
          nextSeason={seasonStatus.nextSeason}
          transitionEndsAt={seasonStatus.transitionEndsAt}
        />
      )}
      <main
        className={`max-w-lg mx-auto min-h-screen ${showPadding ? 'pb-24' : ''}`}
        style={showPadding ? { paddingTop: 'calc(env(safe-area-inset-top) + 3.5rem)' } : undefined}
      >
        {children}
      </main>
    </>
  );
}
