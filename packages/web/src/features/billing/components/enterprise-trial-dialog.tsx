import { isNil, tryCatch } from '@activepieces/core-utils';
import { PlatformAdminSurface } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  ArrowRight,
  Check,
  CircleAlert,
  Gem,
  ChevronDown,
  LoaderCircle,
} from 'lucide-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import {
  billingDialogHooks,
  EnterpriseTrialDialogPayload,
} from '../hooks/billing-dialog-hooks';
import {
  ENTERPRISE_TRIAL_DAYS,
  enterpriseTrialHooks,
} from '../hooks/enterprise-trial-hooks';
import {
  EnterpriseAccess,
  useEnterpriseAccess,
} from '../hooks/use-enterprise-gate';
import { usePlanTier } from '../hooks/use-plan-tier';
import { enterpriseMotion } from '../utils/enterprise-motion';
import { enterpriseTrialFeatures } from '../utils/enterprise-trial-features';
import { FeatureTier } from '../utils/feature-tier';
import { planTiers } from '../utils/plan-tiers';

import { EnterpriseTrialEndedDialog } from './enterprise-trial-ended-dialog';
import { EnterpriseTrialLockedActions } from './enterprise-trial-locked-actions';
import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';
import { PlanBadge } from './plan-badge';
import { FeatureKey } from './request-trial';

export function EnterpriseTrialDialog() {
  const { payload, returnFocus, closeDialog } =
    billingDialogHooks.useEnterpriseTrialDialogStore();
  const queryClient = useQueryClient();
  enterpriseTrialHooks.useStatus();
  const offer = enterpriseTrialHooks.useOffer();
  const [resumeState, setResumeState] = useState<ResumeState>('idle');
  const resumeOnStart =
    useRef<EnterpriseTrialDialogPayload['resume']>(undefined);
  const start = enterpriseTrialHooks.useStart((status) => {
    if (status.state !== 'active') {
      return;
    }
    celebrate();
    finishBlockedWork(resumeOnStart.current).catch(() => undefined);
  });
  const open = !isNil(payload);
  const result = start.data?.state;
  const view = viewFor({ result, offer });
  const busy = start.isPending || resumeState === 'saving';
  const close = () => {
    if (busy) {
      return;
    }
    confetti.reset();
    closeDialog();
    start.reset();
    setResumeState('idle');
  };
  const resume = payload?.resume;

  const finishBlockedWork = async (
    work: EnterpriseTrialDialogPayload['resume'],
  ) => {
    if (isNil(work)) {
      return;
    }
    setResumeState('saving');
    for (const delayMs of RESUME_ATTEMPT_DELAYS_MS) {
      await wait(delayMs);
      await queryClient.refetchQueries({ queryKey: ['platform'] });
      const { error } = await tryCatch(async () => work());
      if (isNil(error)) {
        setResumeState('saved');
        return;
      }
    }
    setResumeState('failed');
  };

  return (
    <>
      <EnterpriseTrialEndedDialog />
      <Dialog open={open} onOpenChange={(next) => !next && close()}>
        <DialogContent
          showCloseButton={!busy}
          onEscapeKeyDown={(event) => {
            if (busy) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (busy) {
              event.preventDefault();
            }
          }}
          onOpenAutoFocus={focusDialogItself}
          onCloseAutoFocus={(event) => {
            if (returnFocus?.isConnected) {
              event.preventDefault();
              returnFocus.focus();
            }
          }}
          className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[60rem] sm:rounded-2xl"
        >
          {open && (
            <div
              key={view}
              className={cn(
                'flex min-h-0 flex-1 flex-col',
                enterpriseMotion.swap,
              )}
            >
              {view === 'start' && (
                <StartTrial
                  featureKey={payload?.featureKey}
                  resumes={!isNil(resume)}
                  isPending={start.isPending}
                  isError={start.isError}
                  onStart={() => {
                    resumeOnStart.current = resume;
                    start.mutate();
                  }}
                />
              )}
              {view === 'started' && (
                <TrialStarted
                  endsAt={start.data?.endsAt ?? null}
                  startedAt={start.data?.startedAt ?? null}
                  featureKey={payload?.featureKey}
                  resumeState={resumeState}
                  onRetry={() =>
                    finishBlockedWork(resume).catch(() => undefined)
                  }
                  onClose={close}
                />
              )}
              {view === 'used' && <TrialAlreadyUsed />}
              {view === 'unavailable' && <TrialNotStarted onClose={close} />}
              {view === 'locked' && (
                <LockedFeature
                  featureKey={payload?.featureKey}
                  onAction={close}
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function StartTrial({
  featureKey,
  resumes,
  isPending,
  isError,
  onStart,
}: {
  featureKey: FeatureKey | undefined;
  resumes: boolean;
  isPending: boolean;
  isError: boolean;
  onStart: () => void;
}) {
  const trial = enterpriseTrialHooks.useTrial();
  const featureName = enterpriseTrialFeatures.name(featureKey);

  return (
    <DialogFrame
      eyebrow={
        featureName && (
          <span className="flex items-center gap-2 text-sm font-medium text-accent-11">
            <Gem className="size-4" />
            {t('Try {feature} in the Enterprise plan trial', {
              feature: featureName,
            })}
          </span>
        )
      }
      title={t('Try the Enterprise plan free for {days} days', {
        days: ENTERPRISE_TRIAL_DAYS,
      })}
      description={t(
        'Everything in the Enterprise plan turns on for everyone on your platform. No credit card, nothing to set up.',
      )}
      note={
        resumes && (
          <p className="flex items-start gap-2.5 text-sm text-gray-12">
            <Check className="mt-0.5 size-4 shrink-0 text-success-11" />
            {t(
              'We save your changes as soon as the trial starts, so nothing you did is lost.',
            )}
          </p>
        )
      }
      mainTitle={t('What is included')}
      main={<IncludedFeatures featureKey={featureKey} />}
      asideTitle={t('How the trial works')}
      aside={
        <TrialTimeline basePlanName={trial.basePlanName} started={false} />
      }
      footerNote={
        <>
          {t('Want to keep the Enterprise plan?')}
          <EnterpriseTrialSalesLink
            surface="enterprise_trial_start"
            variant="link"
            className="h-auto p-0"
            label={t('Talk to sales')}
            featureKey={featureKey}
          />
        </>
      }
      actions={
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {isError && (
            <p className="text-sm text-danger-11">
              {t('We could not start your trial. Please try again.')}
            </p>
          )}
          <Button
            {...adminControl(AdminControl.TRIAL_START_SUBMIT)}
            size="lg"
            loading={isPending}
            onClick={onStart}
          >
            {resumes ? t('Start trial and save') : t('Start free trial')}
          </Button>
        </div>
      }
    />
  );
}

function IncludedFeatures({
  featureKey,
}: {
  featureKey: FeatureKey | undefined;
}) {
  const features = enterpriseTrialFeatures.list();
  return (
    <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {features.map((feature) => {
        const highlighted =
          featureKey !== undefined && feature.featureKeys.includes(featureKey);
        return (
          <li key={feature.title} className="flex items-start gap-2.5">
            <feature.icon
              className={cn(
                'mt-0.5 size-4 shrink-0',
                highlighted ? 'text-accent-11' : 'text-gray-9',
              )}
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-12">
                {feature.title}
              </span>
              <span className="text-sm leading-relaxed text-gray-11">
                {feature.benefit}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function LockedFeature({
  featureKey,
  onAction,
}: {
  featureKey: FeatureKey | undefined;
  onAction: () => void;
}) {
  const access = useEnterpriseAccess({ unlocked: false });
  const plan = usePlanTier(featureKey);
  const copy = enterpriseTrialFeatures.lockedCopy(featureKey);
  const headline =
    copy?.headline ??
    enterpriseTrialFeatures.name(featureKey) ??
    t('The Enterprise plan for your whole team');
  const description =
    copy?.description ??
    t(
      'Single sign-on, audit logs, your own AI providers and more, for everyone on your platform.',
    );
  const benefits = copy?.benefits ?? [];

  return (
    <DialogFrame
      eyebrow={<PlanBadge featureKey={featureKey} />}
      title={headline}
      description={description}
      mainTitle={t('What you get')}
      main={
        benefits.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-success-11" />
                <span className="text-gray-12">{benefit}</span>
              </li>
            ))}
          </ul>
        ) : (
          <IncludedFeatures featureKey={featureKey} />
        )
      }
      asideTitle={t('How to get it')}
      aside={
        <p className="text-sm leading-relaxed text-gray-11">
          {howToGetIt({ access, tier: plan.tier })}
        </p>
      }
      actions={
        <EnterpriseTrialLockedActions
          featureKey={featureKey}
          surface={PlatformAdminSurface.DIALOG}
          onAction={onAction}
          primaryLast
        />
      }
    />
  );
}

function DialogFrame({
  eyebrow,
  title,
  description,
  note,
  mainTitle,
  main,
  asideTitle,
  aside,
  footerNote,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  description: ReactNode;
  note?: ReactNode;
  mainTitle?: string;
  main?: ReactNode;
  asideTitle?: string;
  aside?: ReactNode;
  footerNote?: ReactNode;
  actions: ReactNode;
}) {
  const [scroller, setScroller] = useState<HTMLDivElement | null>(null);
  const moreBelow = useMoreBelow(scroller);
  return (
    <>
      <div
        ref={setScroller}
        tabIndex={0}
        role="region"
        aria-label={title}
        className="relative flex min-h-0 flex-1 flex-col overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-8"
      >
        <div className="flex flex-col items-start gap-2 px-7 pt-7 pb-6 pr-14">
          {eyebrow}
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {title}
          </DialogTitle>
          <DialogDescription className="text-base text-pretty">
            {description}
          </DialogDescription>
          {note}
        </div>
        {(main || aside) && (
          <div className="grid border-t md:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex flex-col gap-4 px-7 py-6">
              {mainTitle && (
                <span className="text-sm font-medium text-gray-12">
                  {mainTitle}
                </span>
              )}
              {main}
            </div>
            <aside className="flex flex-col gap-4 border-t px-7 py-6 md:border-t-0 md:border-l">
              {asideTitle && (
                <span className="text-sm font-medium text-gray-12">
                  {asideTitle}
                </span>
              )}
              {aside}
            </aside>
          </div>
        )}
        {moreBelow && (
          <div className="pointer-events-none sticky bottom-0 flex justify-center pb-3">
            <span className="flex items-center gap-1 rounded-full border bg-gray-1 px-2.5 py-1 text-xs text-gray-11 shadow-sm">
              <ChevronDown className="size-3.5" />
              {t('More below')}
            </span>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col-reverse items-stretch gap-3 border-t px-7 py-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex flex-wrap items-center gap-1 text-sm text-gray-11">
          {footerNote}
        </span>
        <div className="flex justify-end">{actions}</div>
      </div>
    </>
  );
}

function howToGetIt({
  access,
  tier,
}: {
  access: EnterpriseAccess;
  tier: FeatureTier;
}): string {
  switch (access) {
    case 'ask_admin':
      return planTiers.askAdminText(tier);
    case 'community':
      return t(
        'This needs the Enterprise edition. Our team can set you up with a license.',
      );
    case 'trial_used':
      return t(
        'Your Enterprise plan trial was already used. Our team can extend it or set you up on a plan.',
      );
    default:
      return tier === 'enterprise'
        ? t(
            'Our team sets you up on the Enterprise plan and helps with the rollout.',
          )
        : t(
            'Upgrade from the plans page whenever you are ready. Your flows and settings stay as they are.',
          );
  }
}

function TrialTimeline({
  basePlanName,
  started,
  startedAt,
  endsAt,
}: {
  basePlanName: string;
  started: boolean;
  startedAt?: Date;
  endsAt?: Date;
}) {
  const endDate = dayjs(endsAt ?? dayjs().add(ENTERPRISE_TRIAL_DAYS, 'day'));
  const steps = [
    started
      ? {
          when: t('Today · {date}', {
            date: dayjs(startedAt ?? undefined).format('MMM D'),
          }),
          what: t(
            'Your Enterprise plan trial started. Everything is unlocked for {days} days.',
            { days: ENTERPRISE_TRIAL_DAYS },
          ),
        }
      : {
          when: t('Today'),
          what: t('Everything turns on. Your credits stay the same.'),
        },
    {
      when: endDate.subtract(1, 'day').format('MMM D'),
      what: t('We remind you the day before it ends.'),
    },
    {
      when: endDate.format('MMM D'),
      what: t(
        'You are back on the {plan} plan. Your flows, connections and settings are kept.',
        { plan: basePlanName },
      ),
    },
  ];
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => (
        <li key={step.when} className="flex gap-3">
          <span className="flex flex-col items-center">
            <span className="grid size-4 shrink-0 place-items-center">
              {index === 0 && !started && (
                <Check className="size-4 text-success-11" />
              )}
              {index === 0 && started && (
                <span className="size-2.5 rounded-full bg-accent-9" />
              )}
              {index > 0 && <span className="size-2 rounded-full bg-gray-8" />}
            </span>
            {index < steps.length - 1 && (
              <span className="my-1 w-px flex-1 bg-gray-6" />
            )}
          </span>
          <span className="flex flex-col gap-0.5 pb-5">
            <span className="text-sm font-medium text-gray-12">
              {step.when}
            </span>
            <span className="text-sm leading-relaxed text-gray-11">
              {step.what}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function TrialStarted({
  endsAt,
  startedAt,
  featureKey,
  resumeState,
  onRetry,
  onClose,
}: {
  endsAt: string | null;
  startedAt: string | null;
  featureKey: FeatureKey | undefined;
  resumeState: ResumeState;
  onRetry: () => void;
  onClose: () => void;
}) {
  const trial = enterpriseTrialHooks.useTrial();
  const featureName = enterpriseTrialFeatures.nameInSentence(featureKey);
  const shortcuts = [
    { label: t('Set up single sign-on'), to: '/platform/sso' },
    { label: t('Review audit logs'), to: '/platform/audit-log' },
    { label: t('Connect a secret manager'), to: '/platform/secret-managers' },
  ];
  return (
    <DialogFrame
      title={t('Your Enterprise plan trial is on')}
      description={
        isNil(endsAt)
          ? t('Every Enterprise plan feature is unlocked for your platform.')
          : t('Every Enterprise plan feature is unlocked until {date}.', {
              date: dayjs(endsAt).format('MMM D'),
            })
      }
      note={
        resumeState !== 'idle' && (
          <ResumeStatus
            state={resumeState}
            featureName={featureName}
            onRetry={onRetry}
          />
        )
      }
      mainTitle={t('Your trial')}
      main={
        <TrialTimeline
          basePlanName={trial.basePlanName}
          started={true}
          startedAt={isNil(startedAt) ? undefined : new Date(startedAt)}
          endsAt={isNil(endsAt) ? undefined : new Date(endsAt)}
        />
      }
      asideTitle={t('Good first steps')}
      aside={
        <div className="flex flex-col divide-y border-y">
          {shortcuts.map((shortcut) => (
            <Link
              key={shortcut.to}
              to={shortcut.to}
              onClick={onClose}
              className="flex items-center justify-between py-3 text-sm text-gray-12 transition-colors duration-150 hover:text-accent-11"
            >
              {shortcut.label}
              <ArrowRight className="size-4 text-gray-11" />
            </Link>
          ))}
        </div>
      }
      actions={
        <Button size="lg" onClick={onClose}>
          {t('Got it')}
        </Button>
      }
    />
  );
}

function ResumeStatus({
  state,
  featureName,
  onRetry,
}: {
  state: ResumeState;
  featureName: string | null;
  onRetry: () => void;
}) {
  const feature = featureName ?? t('this feature');
  if (state === 'failed') {
    return (
      <p
        role="status"
        className={cn(
          'flex flex-wrap items-center gap-2 text-sm text-danger-11',
          enterpriseMotion.swap,
        )}
      >
        <CircleAlert className="size-4 shrink-0" />
        {t('We could not save your changes to {feature}.', { feature })}
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0"
          onClick={onRetry}
        >
          {t('Try again')}
        </Button>
      </p>
    );
  }
  return (
    <p
      role="status"
      key={state}
      className={cn(
        'flex items-center gap-2 text-sm text-gray-12',
        enterpriseMotion.swap,
      )}
    >
      {state === 'saving' ? (
        <LoaderCircle className="size-4 shrink-0 animate-spin text-gray-11 motion-reduce:animate-none" />
      ) : (
        <Check className="size-4 shrink-0 text-success-11" />
      )}
      {state === 'saving'
        ? t('Saving your changes to {feature}…', { feature })
        : t('Your changes to {feature} are saved.', { feature })}
    </p>
  );
}

function TrialAlreadyUsed() {
  return (
    <DialogFrame
      title={t('Your Enterprise plan trial was already used')}
      description={t(
        'Each platform owner can start the Enterprise plan trial once. Talk to our team to get more time.',
      )}
      actions={
        <EnterpriseTrialSalesLink
          surface="enterprise_trial_used"
          variant="default"
          label={t('Talk to sales')}
        />
      }
    />
  );
}

function TrialNotStarted({ onClose }: { onClose: () => void }) {
  return (
    <DialogFrame
      title={t('We could not start your trial')}
      description={t(
        'The Enterprise plan trial is not available for your platform right now. Please try again later, or talk to our team.',
      )}
      actions={
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            {t('Close')}
          </Button>
          <EnterpriseTrialSalesLink
            surface="enterprise_trial_unavailable"
            variant="default"
            label={t('Talk to sales')}
          />
        </div>
      }
    />
  );
}

function useMoreBelow(element: HTMLElement | null): boolean {
  const [moreBelow, setMoreBelow] = useState(false);
  useEffect(() => {
    if (isNil(element)) {
      return;
    }
    const update = () =>
      setMoreBelow(
        element.scrollHeight - element.scrollTop - element.clientHeight >
          SCROLL_HINT_SLACK_PX,
      );
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, [element]);
  return moreBelow;
}

function viewFor({
  result,
  offer,
}: {
  result: string | undefined;
  offer: boolean;
}): DialogView {
  if (result === 'active') {
    return 'started';
  }
  if (result === 'used' || result === 'ended') {
    return 'used';
  }
  if (result === 'unavailable' || result === 'eligible') {
    return 'unavailable';
  }
  return offer ? 'start' : 'locked';
}

function focusDialogItself(event: Event): void {
  event.preventDefault();
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.focus();
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function celebrate(): void {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    disableForReducedMotion: true,
  })?.catch(() => undefined);
}

const RESUME_ATTEMPT_DELAYS_MS = [0, 2000];
const SCROLL_HINT_SLACK_PX = 8;

type DialogView = 'start' | 'started' | 'used' | 'unavailable' | 'locked';

type ResumeState = 'idle' | 'saving' | 'saved' | 'failed';
