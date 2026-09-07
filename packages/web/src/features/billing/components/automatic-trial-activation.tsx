import { isEmpty, isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { t } from 'i18next';
import { Check, CircleX, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { FullLogo } from '@/components/custom/full-logo';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Button } from '@/components/ui/button';
import {
  useAuthorization,
  useIsPlatformAdmin,
} from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { userHooks } from '@/hooks/user-hooks';
import {
  determineDefaultRoute,
  TRIAL_KEY_QUERY_PARAM,
} from '@/lib/route-utils';
import { cn } from '@/lib/utils';

export const AutomaticTrialActivation = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isPlatformAdmin = useIsPlatformAdmin();
  const [searchParams] = useSearchParams();
  const [pendingKey, setPendingKey] = useState<string | null>(() => {
    const licenseKey = searchParams.get(TRIAL_KEY_QUERY_PARAM)?.trim();
    const platformLicenseKey = platform.plan.licenseKey;
    const alreadyLicensed =
      !isNil(platformLicenseKey) && !isEmpty(platformLicenseKey);
    if (
      isNil(licenseKey) ||
      isEmpty(licenseKey) ||
      edition === ApEdition.COMMUNITY
    ) {
      return null;
    }
    return alreadyLicensed ? null : licenseKey;
  });

  const dismiss = useCallback(() => setPendingKey(null), []);

  if (isNil(pendingKey)) {
    return null;
  }

  return (
    <TrialActivationScreen
      licenseKey={pendingKey}
      isPlatformAdmin={isPlatformAdmin}
      onDone={dismiss}
    />
  );
};

const TrialActivationScreen = ({
  licenseKey,
  isPlatformAdmin,
  onDone,
}: TrialActivationScreenProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const { checkAccess } = useAuthorization();
  const { data: user } = userHooks.useCurrentUser();
  const [now, setNow] = useState(Date.now());
  const confettiCanvas = useRef<HTMLCanvasElement>(null);
  const startedAt = useRef(Date.now());
  const succeededAt = useRef<number | null>(null);

  const homeRoute = determineDefaultRoute({
    checkAccess,
    chatEnabled: platform.plan.chatEnabled,
  });

  const returnToApp = useCallback(() => {
    onDone();
    navigate(homeRoute);
  }, [homeRoute, navigate, onDone]);

  const {
    mutate: activateLicenseKey,
    isPending,
    isSuccess,
    isError,
  } = platformHooks.useUpdateLisenceKey({
    queryClient,
    messages: { success: null, error: null },
  });

  const activate = useCallback(() => {
    startedAt.current = Date.now();
    succeededAt.current = null;
    activateLicenseKey(licenseKey, {
      onSuccess: () => {
        succeededAt.current = Date.now();
        burstConfetti(confettiCanvas.current);
        setTimeout(returnToApp, REDIRECT_SECONDS * 1000);
      },
    });
  }, [activateLicenseKey, licenseKey, returnToApp]);

  useEffect(() => {
    if (isPlatformAdmin) {
      activate();
    }
    const scrubbed = new URLSearchParams(searchParams);
    scrubbed.delete(TRIAL_KEY_QUERY_PARAM);
    setSearchParams(scrubbed, { replace: true });
    // Re-renders TrialActivationScreen every TICK_MS so that progress,
    // the activation timeout and the redirect countdown stay derived from `now`.
    const ticker = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(ticker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const elapsed = Math.max(0, now - startedAt.current);
  const progress = progressFor(elapsed);
  const view = viewOf({
    isPlatformAdmin,
    isSuccess,
    isError,
    isPending,
    timedOut: elapsed >= ACTIVATION_TIMEOUT_MS,
  });
  const secondsLeft = isNil(succeededAt.current)
    ? REDIRECT_SECONDS
    : Math.max(
        0,
        REDIRECT_SECONDS - Math.floor((now - succeededAt.current) / 1000),
      );

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-builder-background px-6 py-12',
        '[background-image:radial-gradient(var(--builder-background-pattern)_1px,transparent_0)] [background-size:22px_22px]',
      )}
    >
      <canvas
        ref={confettiCanvas}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5] size-full"
      />
      <div className="relative z-10 w-full max-w-[520px] rounded-lg border bg-background p-10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-[240ms] fill-mode-both">
        <FullLogo className="h-6 mb-8" />
        {view === 'activating' && (
          <div className="flex flex-col gap-6">
            <div className="relative grid size-11 place-items-center rounded-full bg-primary/10">
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <LoadingSpinner className="relative size-[18px] stroke-primary" />
            </div>
            <TrialActivationCopy
              heading={t('Activating your trial')}
              body={t(
                "This usually takes under a minute. Keep this tab open — we'll drop you into your platform as soon as it's ready.",
              )}
            />
            <div className="flex flex-col gap-2.5">
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                aria-label={t('Trial activation progress')}
                className="h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="relative h-full overflow-hidden rounded-full bg-primary transition-[width] duration-300 ease-[var(--ease-expand-out)]"
                  style={{ width: `${Math.round(progress)}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent)] animate-indeterminate-progress" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span
                  className="text-xs text-muted-foreground"
                  aria-live="polite"
                >
                  {statusMessageFor(progress)}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground/70">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>
        )}
        {view === 'success' && (
          <div className="flex flex-col gap-6">
            <div className="grid size-11 place-items-center rounded-full bg-success/10">
              <Check className="size-[22px] text-success" strokeWidth={2.2} />
            </div>
            <TrialActivationCopy
              heading={t('Your trial is active')}
              body={t(
                'Everything on your plan is unlocked for your whole platform. Nothing else to set up — go build a flow.',
              )}
            />
            <div className="flex items-center gap-3">
              <Button size="lg" onClick={returnToApp}>
                {t('Go to home')}
              </Button>
              <span className="text-xs text-muted-foreground">
                {secondsLeft > 0
                  ? t('Taking you there in {seconds}s', {
                      seconds: secondsLeft,
                    })
                  : t('Redirecting')}
              </span>
            </div>
          </div>
        )}
        {view === 'not_admin' && (
          <div className="flex flex-col gap-6">
            <div className="grid size-11 place-items-center rounded-full bg-warning/15">
              <TriangleAlert className="size-[22px] text-warning-700" />
            </div>
            <TrialActivationCopy
              heading={t('A platform admin needs to do this')}
              body={t(
                'You are not a platform admin on this platform, please send the following link to a platform admin and let them sign in with it to kick off your trial.',
              )}
            />
            <CopyToClipboardInput
              textToCopy={activationLinkFor(licenseKey)}
              useInput
            />
            <p className="text-xs leading-relaxed text-muted-foreground/70">
              {t(
                "Signed in as {email}. Sign out and back in with an admin account if that's you.",
                { email: user?.email ?? '' },
              )}
            </p>
          </div>
        )}
        {view === 'failed' && (
          <div className="flex flex-col gap-6">
            <div className="grid size-11 place-items-center rounded-full bg-destructive/10">
              <CircleX className="size-[22px] text-destructive-700" />
            </div>
            <TrialActivationCopy
              heading={t("We couldn't activate your trial")}
              body={t(
                "Nothing changed on your platform. Try again — if it fails a second time, contact support and we'll turn it on manually.",
              )}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={activate}>
                {t('Try again')}
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={SUPPORT_MAIL_HREF}>{t('Contact support')}</a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TrialActivationCopy = ({ heading, body }: TrialActivationCopyProps) => (
  <div className="flex flex-col gap-2" aria-live="polite">
    <h2 className="text-3xl font-bold tracking-[-0.015em] text-foreground">
      {heading}
    </h2>
    <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
      {body}
    </p>
  </div>
);

function viewOf({
  isPlatformAdmin,
  isSuccess,
  isError,
  isPending,
  timedOut,
}: ViewOfParams): TrialActivationView {
  if (!isPlatformAdmin) {
    return 'not_admin';
  }
  if (isSuccess) {
    return 'success';
  }
  if (isPending && !timedOut) {
    return 'activating';
  }
  return isError || timedOut ? 'failed' : 'activating';
}

function progressFor(elapsedMs: number): number {
  const ratio = Math.min(1, elapsedMs / PROGRESS_SPAN_MS);
  const eased = 1 - Math.pow(1 - ratio, 3);
  return INITIAL_PROGRESS + (PROGRESS_CEILING - INITIAL_PROGRESS) * eased;
}

function statusMessageFor(progress: number): string {
  const step = [...ACTIVATION_STEPS]
    .reverse()
    .find((candidate) => progress >= candidate.from);
  return t(step?.message ?? ACTIVATION_STEPS[0].message);
}

function activationLinkFor(licenseKey: string): string {
  return `${
    window.location.origin
  }/?${TRIAL_KEY_QUERY_PARAM}=${encodeURIComponent(licenseKey)}`;
}

function burstConfetti(canvas: HTMLCanvasElement | null): void {
  if (isNil(canvas)) {
    return;
  }
  confetti.create(canvas, { resize: true })(CONFETTI_OPTIONS);
}

const TICK_MS = 250;
const INITIAL_PROGRESS = 4;
const PROGRESS_CEILING = 95;
const PROGRESS_SPAN_MS = 20 * 1000;
const ACTIVATION_TIMEOUT_MS = 75 * 1000;
const REDIRECT_SECONDS = 5;
const SUPPORT_MAIL_HREF = `mailto:support@activepieces.com?subject=${encodeURIComponent(
  'Trial activation failed',
)}`;
const ACTIVATION_STEPS = [
  { from: 0, message: 'Verifying your account' },
  { from: 18, message: 'Checking platform permissions' },
  { from: 38, message: 'Provisioning your trial' },
  { from: 62, message: 'Applying your license' },
  { from: 84, message: 'Finishing up' },
];
const CONFETTI_OPTIONS: confetti.Options = {
  particleCount: 140,
  spread: 360,
  startVelocity: 34,
  ticks: 160,
  gravity: 0.9,
  decay: 0.93,
  scalar: 0.85,
  shapes: ['square'],
  origin: { x: 0.5, y: 0.44 },
  colors: ['#8142E3', '#B592F0', '#10b981', '#f59e0b', '#0a0a0a'],
  disableForReducedMotion: true,
};

type TrialActivationView = 'activating' | 'success' | 'not_admin' | 'failed';

type TrialActivationScreenProps = {
  licenseKey: string;
  isPlatformAdmin: boolean;
  onDone: () => void;
};

type TrialActivationCopyProps = {
  heading: string;
  body: string;
};

type ViewOfParams = {
  isPlatformAdmin: boolean;
  isSuccess: boolean;
  isError: boolean;
  isPending: boolean;
  timedOut: boolean;
};
