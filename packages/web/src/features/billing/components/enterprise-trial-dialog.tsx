import { isNil, tryCatch } from '@activepieces/core-utils';
import { useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import dayjs from 'dayjs';
import { t } from 'i18next';
import {
  ArrowRight,
  Check,
  CircleAlert,
  Gem,
  LoaderCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import {
  ENTERPRISE_TRIAL_DAYS,
  enterpriseTrialHooks,
} from '../hooks/enterprise-trial-hooks';
import { enterpriseMotion } from '../utils/enterprise-motion';
import { enterpriseTrialFeatures } from '../utils/enterprise-trial-features';

import { EnterpriseLockedBody } from './enterprise-locked-body';
import { EnterpriseTrialEndedDialog } from './enterprise-trial-ended-dialog';
import { EnterpriseTrialSalesLink } from './enterprise-trial-sales-link';
import { FeatureKey } from './request-trial';

export function EnterpriseTrialDialog() {
  const { payload, closeDialog } =
    billingDialogHooks.useEnterpriseTrialDialogStore();
  const queryClient = useQueryClient();
  enterpriseTrialHooks.useStatus();
  const offer = enterpriseTrialHooks.useOffer();
  const start = enterpriseTrialHooks.useStart();
  const [resumeState, setResumeState] = useState<ResumeState>('idle');
  const open = !isNil(payload);
  const result = start.data?.state;
  const view = viewFor({ result, offer });
  const wide = view === 'start' || view === 'started';
  const close = () => {
    confetti.reset();
    closeDialog();
    start.reset();
    setResumeState('idle');
  };
  const resume = payload?.resume;

  const finishBlockedWork = async () => {
    if (isNil(resume)) {
      return;
    }
    setResumeState('saving');
    for (const delayMs of RESUME_ATTEMPT_DELAYS_MS) {
      await wait(delayMs);
      await queryClient.refetchQueries({ queryKey: ['platform'] });
      const { error } = await tryCatch(async () => resume());
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
          onOpenAutoFocus={focusDialogItself}
          className={cn(
            'max-h-[calc(100dvh-2rem)] sm:rounded-2xl',
            wide
              ? 'flex flex-col gap-0 overflow-hidden p-0 sm:max-w-[60rem]'
              : 'gap-0 overflow-y-auto p-7 sm:max-w-md',
          )}
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
                  onStart={() =>
                    start.mutate(undefined, {
                      onSuccess: (status) => {
                        if (status.state === 'active') {
                          celebrate();
                          finishBlockedWork().catch(() => undefined);
                        }
                      },
                    })
                  }
                />
              )}
              {view === 'started' && (
                <TrialStarted
                  endsAt={start.data?.endsAt ?? null}
                  featureKey={payload?.featureKey}
                  resumeState={resumeState}
                  onRetry={() => finishBlockedWork().catch(() => undefined)}
                  onClose={close}
                />
              )}
              {view === 'used' && <TrialAlreadyUsed />}
              {view === 'unavailable' && <TrialNotStarted onClose={close} />}
              {view === 'locked' && (
                <EnterpriseLockedBody
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
  const features = enterpriseTrialFeatures.list();
  const featureName = enterpriseTrialFeatures.name(featureKey);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-2 px-7 pt-7 pb-6 pr-14">
          {featureName && (
            <span className="flex items-center gap-2 text-sm font-medium text-accent-11">
              <Gem className="size-4" />
              {t('Included in the Enterprise plan: {feature}', {
                feature: featureName,
              })}
            </span>
          )}
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {t('Try the Enterprise plan free for {days} days', {
              days: ENTERPRISE_TRIAL_DAYS,
            })}
          </DialogTitle>
          <DialogDescription className="text-base text-pretty">
            {t(
              'Everything in the Enterprise plan turns on for everyone on your platform. No credit card, nothing to set up.',
            )}
          </DialogDescription>
          {resumes && (
            <p className="flex items-start gap-2.5 text-sm text-gray-12">
              <Check className="mt-0.5 size-4 shrink-0 text-success-11" />
              {t(
                'We save your changes as soon as the trial starts, so nothing you did is lost.',
              )}
            </p>
          )}
        </div>

        <div className="grid border-t md:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-4 px-7 py-6">
            <span className="text-sm font-medium text-gray-12">
              {t('What is included')}
            </span>
            <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {features.map((feature) => {
                const highlighted =
                  featureKey !== undefined &&
                  feature.featureKeys.includes(featureKey);
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
          </div>
          <aside className="flex flex-col gap-4 border-t px-7 py-6 md:border-t-0 md:border-l">
            <span className="text-sm font-medium text-gray-12">
              {t('How the trial works')}
            </span>
            <TrialTimeline basePlanName={trial.basePlanName} started={false} />
          </aside>
        </div>
      </div>

      <div className="flex shrink-0 flex-col-reverse items-stretch gap-3 border-t px-7 py-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="flex flex-wrap items-center justify-center gap-1 text-sm text-gray-11">
          {t('Want to keep the Enterprise plan?')}
          <EnterpriseTrialSalesLink
            surface="enterprise_trial_start"
            variant="link"
            className="h-auto p-0"
            label={t('Talk to sales')}
            featureKey={featureKey}
          />
        </span>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {isError && (
            <p className="text-sm text-danger-11">
              {t('We could not start your trial. Please try again.')}
            </p>
          )}
          <Button size="lg" loading={isPending} onClick={onStart}>
            <Gem />
            {resumes
              ? t('Start trial and save')
              : t('Start free {days}-day trial', {
                  days: ENTERPRISE_TRIAL_DAYS,
                })}
          </Button>
        </div>
      </div>
    </>
  );
}

function TrialTimeline({
  basePlanName,
  started,
  endsAt,
}: {
  basePlanName: string;
  started: boolean;
  endsAt?: Date;
}) {
  const endDate = dayjs(endsAt ?? dayjs().add(ENTERPRISE_TRIAL_DAYS, 'day'));
  const steps = [
    ...(started
      ? []
      : [
          {
            when: t('Today'),
            what: t('Everything turns on. Your credits stay the same.'),
          },
        ]),
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
              {index === 0 && !started ? (
                <Check className="size-4 text-success-11" />
              ) : (
                <span className="size-2 rounded-full bg-gray-8" />
              )}
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
  featureKey,
  resumeState,
  onRetry,
  onClose,
}: {
  endsAt: string | null;
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
    <>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="flex items-start px-7 pt-7 pb-6 pr-14">
          <div className="flex flex-col gap-2">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {t('Your Enterprise plan trial is on')}
            </DialogTitle>
            <DialogDescription className="text-base text-pretty">
              {isNil(endsAt)
                ? t(
                    'Every Enterprise plan feature is unlocked for your platform.',
                  )
                : t('Every Enterprise plan feature is unlocked until {date}.', {
                    date: dayjs(endsAt).format('MMM D'),
                  })}
            </DialogDescription>
            {resumeState !== 'idle' && (
              <ResumeStatus
                state={resumeState}
                featureName={featureName}
                onRetry={onRetry}
              />
            )}
          </div>
        </div>
        <div className="grid border-t md:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex flex-col gap-4 px-7 py-6">
            <span className="text-sm font-medium text-gray-12">
              {t('Good first steps')}
            </span>
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
          </div>
          <aside className="flex flex-col gap-4 border-t px-7 py-6 md:border-t-0 md:border-l">
            <span className="text-sm font-medium text-gray-12">
              {t('Your trial')}
            </span>
            <TrialTimeline
              basePlanName={trial.basePlanName}
              started={true}
              endsAt={isNil(endsAt) ? undefined : new Date(endsAt)}
            />
          </aside>
        </div>
      </div>
      <div className="flex shrink-0 justify-end border-t px-7 py-5">
        <Button size="lg" onClick={onClose}>
          {t('Got it')}
        </Button>
      </div>
    </>
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 pr-6">
        <DialogTitle className="text-xl font-semibold tracking-tight">
          {t('Your Enterprise plan trial was already used')}
        </DialogTitle>
        <DialogDescription className="text-base text-pretty">
          {t(
            'Each platform owner can start the Enterprise plan trial once. Talk to our team to get more time.',
          )}
        </DialogDescription>
      </div>
      <div className="flex justify-end">
        <EnterpriseTrialSalesLink
          surface="enterprise_trial_used"
          variant="default"
          label={t('Talk to sales')}
        />
      </div>
    </div>
  );
}

function TrialNotStarted({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 pr-6">
        <DialogTitle className="text-xl font-semibold tracking-tight">
          {t('We could not start your trial')}
        </DialogTitle>
        <DialogDescription className="text-base text-pretty">
          {t(
            'The Enterprise plan trial is not available for your platform right now. Please try again later, or talk to our team.',
          )}
        </DialogDescription>
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose}>
          {t('Close')}
        </Button>
        <EnterpriseTrialSalesLink
          surface="enterprise_trial_unavailable"
          variant="default"
          label={t('Talk to sales')}
        />
      </div>
    </div>
  );
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

type DialogView = 'start' | 'started' | 'used' | 'unavailable' | 'locked';

type ResumeState = 'idle' | 'saving' | 'saved' | 'failed';
