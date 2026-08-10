import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import { useEffect, useRef } from 'react';

import { useTheme } from '@/components/providers/theme-provider';
import { authenticationSession } from '@/lib/authentication-session';
import { useRedirectAfterLogin } from '@/lib/navigation-utils';

import { AuthBackdrop } from './auth-backdrop';
import { AuthDrawerBody } from './auth-drawer-body';

const NUDGE_STREAK_WINDOW_MS = 700;

// The sign-in / sign-up experience: one small card floating over a white-faded
// facsimile of the real app, so visitors see what they're signing up for while
// the form stays the only thing in focus. Both routes share this shell — the
// unified email entry makes the sign-in / sign-up distinction cosmetic.
export function AuthLanding({ initialMode }: AuthLandingProps) {
  const { setForceLightMode } = useTheme();
  const redirectAfterLogin = useRedirectAfterLogin();
  // An onboarding token counts as signed in here: DefaultRoute checks it before
  // the authenticated branch and hands it to /create-platform, so a half-finished
  // sign-up that comes back to this screen resumes where it stopped instead of
  // being shown an email field it has already filled in.
  const signedIn = !isNil(authenticationSession.getToken());
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

  // Imperative (Web Animations API) so every backdrop click restarts the pulse
  // immediately — even mid-animation. Rapid clicks pulse a touch harder,
  // macOS-style: "heard you — this dialog still has the page". Focus follows
  // the nudge into whatever input the current step shows.
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
      {/* Fade: pushed nearly to white so the app reads as a faint ghost and the
          colour band above it stays the thing you notice. A partial blur is
          what strains the eye — it leaves text almost legible so you keep
          trying to focus it — so this leans on opacity, not blur. Clicking it
          nudges the card and focuses the field. */}
      <div
        aria-hidden
        onClick={nudgePanel}
        className="absolute inset-0 z-40 cursor-default bg-neutral-50/78 backdrop-blur-[2.8px]"
      />
      {/* Wrapper centers and owns the entrance; the card owns its visuals and
          the imperative nudge, so the entrance never replays mid-nudge. The
          card's shadow is layered rather than one flat blur: a tight contact
          shadow keeps the edge crisp, mid layers give lift, and a wide ambient
          pool separates it from the washed-out app behind. */}
      <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300 fill-mode-both">
        {/* The card stays a plain element: step height is animated inside
            AuthDrawerBody, and a layout/transform animation here would fight
            the imperative nudge above. */}
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

type AuthMode = 'signin' | 'signup';

type AuthLandingProps = {
  initialMode: AuthMode;
};
