import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { useEffect, useRef } from 'react';

import { useTheme } from '@/components/providers/theme-provider';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

import { AuthBackdrop } from './auth-backdrop';
import { AuthDrawerBody, AuthMode } from './auth-drawer-body';

const NUDGE_STREAK_WINDOW_MS = 700;

export function AuthLanding({ initialMode }: AuthLandingProps) {
  const { setForceLightMode } = useTheme();
  const redirectAfterLogin = useRedirectAfterLogin();
  const signedIn =
    !isNil(authenticationSession.getToken()) &&
    !authenticationSession.isOnboarding();
  const panelRef = useRef<HTMLElement | null>(null);
  const nudgeRef = useRef<{
    lastAt: number;
    streak: number;
    animation: Animation | null;
  }>({
    lastAt: 0,
    streak: 0,
    animation: null,
  });

  useEffect(() => {
    setForceLightMode(true);
    return () => setForceLightMode(false);
  }, [setForceLightMode]);

  useEffect(() => {
    if (signedIn) {
      redirectAfterLogin();
    }
  }, [signedIn, redirectAfterLogin]);

  if (signedIn) {
    return null;
  }

  const nudgePanel = () => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    panel
      .querySelector<HTMLInputElement>(
        'input:not([type="hidden"]):not([disabled])',
      )
      ?.focus();
    const state = nudgeRef.current;
    const now = performance.now();
    state.streak =
      now - state.lastAt < NUDGE_STREAK_WINDOW_MS ? state.streak + 1 : 0;
    state.lastAt = now;
    const peak = Math.min(1.015 + state.streak * 0.008, 1.045);
    state.animation?.cancel();
    state.animation = panel.animate(
      [
        { transform: 'scale(1)' },
        { transform: `scale(${peak})`, offset: 0.3 },
        { transform: 'scale(0.997)', offset: 0.6 },
        { transform: 'scale(1)' },
      ],
      { duration: 320, easing: 'ease-in-out' },
    );
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-white">
      <AuthBackdrop />
      <div
        aria-hidden
        onClick={nudgePanel}
        className="absolute inset-0 z-40 cursor-default bg-neutral-50/78 backdrop-blur-[2.8px]"
      />
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300 fill-mode-both">
        <section
          ref={panelRef}
          role="dialog"
          aria-label={t('Sign in or create your account')}
          className="pointer-events-auto max-h-[90dvh] w-full max-w-[400px] overflow-hidden rounded-2xl border border-black/[0.06] bg-background shadow-[0_1px_2px_rgba(16,24,40,0.04),0_6px_12px_-4px_rgba(16,24,40,0.06),0_24px_40px_-12px_rgba(16,24,40,0.14),0_56px_80px_-32px_rgba(16,24,40,0.16)]"
        >
          <AuthDrawerBody initialMode={initialMode} />
        </section>
      </div>
    </div>
  );
}

type AuthLandingProps = {
  initialMode: AuthMode;
};
