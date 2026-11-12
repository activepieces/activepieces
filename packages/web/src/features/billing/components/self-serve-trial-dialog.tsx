import { ErrorCode, isNil } from '@activepieces/core-utils';
import {
  SelfServeTrialState,
  SalesLinkLocationInWebApp,
} from '@activepieces/shared';
import confetti from 'canvas-confetti';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Check } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import { billingQueries } from '../hooks/billing-hooks';
import {
  SELF_SERVE_TRIAL_DAYS,
  selfServeTrialHooks,
} from '../hooks/self-serve-trial-hooks';
import { enterpriseMotion } from '../utils/billing-utils';
import { FeatureKey } from '../utils/platform-features';
import { selfServeTrialFeatures } from '../utils/self-serve-trial-features';
import { selfServeTrialTime } from '../utils/self-serve-trial-utils';

import { SelfServeTrialSalesLink } from './current-subscription-card';
import {
  LockedFeature,
  TrialAlreadyUsed,
  TrialStarted,
} from './self-serve-trial-dialog-views';
import { SelfServeTrialEndedDialog } from './self-serve-trial-notices';

export function SelfServeTrialDialog() {
  const { payload, returnFocus, closeDialog } =
    billingDialogHooks.useSelfServeTrialDialogStore();
  const [shownPayload, setShownPayload] = useState(payload);
  if (!isNil(payload) && payload !== shownPayload) {
    setShownPayload(payload);
  }
  const shouldOfferTrial = selfServeTrialHooks.useShouldOfferTrial();
  const {
    mutate: startSelfServeTrial,
    data: startedTrial,
    isPending: isStartingTrial,
    isError: trialStartFailed,
    error: trialStartError,
    reset: resetTrialStart,
  } = selfServeTrialHooks.useStartSelfServeTrial((status) => {
    if (status.state !== SelfServeTrialState.ACTIVE) {
      return;
    }
    celebrate();
    runPostTrialActivationCallback();
  });
  const open = !isNil(payload);
  const liveView = dialogViewForStartResult({
    result: startedTrial?.state,
    alreadyUsed: api.isApError(
      trialStartError,
      ErrorCode.SELF_SERVE_TRIAL_ALREADY_USED,
    ),
    shouldOfferTrial:
      (shouldOfferTrial &&
        selfServeTrialFeatures.isIncludedInTrial(shownPayload?.featureKey)) ||
      trialStartFailed,
  });
  const [view, setView] = useState(liveView);
  if (open && liveView !== view) {
    setView(liveView);
  }
  const busy = isStartingTrial;
  const close = () => {
    if (busy) {
      return;
    }
    confetti.reset();
    closeDialog();
    resetTrialStart();
  };
  const postTrialActivationCallback = payload?.postTrialActivationCallback;

  const renderView = () => {
    switch (view) {
      case DialogView.START:
        return (
          <StartTrial
            featureKey={shownPayload?.featureKey}
            hasPostTrialActivationCallback={
              !isNil(shownPayload?.postTrialActivationCallback)
            }
            isPending={isStartingTrial}
            isError={trialStartFailed}
            onStart={() => {
              startSelfServeTrial();
            }}
          />
        );
      case DialogView.STARTED:
        return <TrialStarted endsAt={startedTrial?.endsAt} onClose={close} />;
      case DialogView.ALREADY_USED:
        return <TrialAlreadyUsed />;
      case DialogView.LOCKED:
        return (
          <LockedFeature
            featureKey={shownPayload?.featureKey}
            onAction={close}
          />
        );
    }
  };

  function runPostTrialActivationCallback() {
    if (isNil(postTrialActivationCallback)) {
      return;
    }
    Promise.resolve(postTrialActivationCallback()).catch(() => undefined);
  }

  return (
    <>
      <SelfServeTrialEndedDialog />
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
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            if (returnFocus?.isConnected) {
              event.preventDefault();
              returnFocus.focus();
            }
          }}
          className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 shadow-lift sm:max-w-[50rem] sm:rounded-2xl"
        >
          {!isNil(shownPayload) && (
            <div
              key={view}
              className={cn(
                'flex min-h-0 flex-1 flex-col',
                enterpriseMotion.swap,
              )}
            >
              {renderView()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TrialTimeline({
  started,
  endsAt,
}: {
  started: boolean;
  endsAt?: string | null;
}) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: info } = billingQueries.usePlatformSubscription(platform.id);
  const endDate = isNil(endsAt)
    ? dayjs().add(SELF_SERVE_TRIAL_DAYS, 'day')
    : dayjs(endsAt);
  const steps = [
    started
      ? {
          when: t('Today · {date}', {
            date: selfServeTrialTime.formatDate(),
          }),
          what: t(
            'Your Enterprise plan trial started. Everything is unlocked for {days} days.',
            { days: SELF_SERVE_TRIAL_DAYS },
          ),
        }
      : {
          when: t('Today'),
          what: t('Full access, same credits'),
        },
    {
      when: selfServeTrialTime.formatDate(endDate.subtract(1, 'day')),
      what: t('We remind you'),
    },
    {
      when: selfServeTrialTime.formatDate(endDate),
      what: t('Back on {plan}, work kept', {
        plan: info?.autumnPlanName ?? t('Free'),
      }),
    },
  ];
  return (
    <ol className="flex flex-col">
      {steps.map((step, index) => (
        <li key={step.when} className="flex gap-3">
          <span className="flex w-2 flex-col items-center gap-1.5 pt-1">
            <span
              className={cn(
                'size-2 shrink-0 rounded-full',
                index === 0 ? 'bg-accent-9' : 'bg-gray-8',
              )}
            />
            {index < steps.length - 1 && (
              <span className="w-px flex-1 bg-gray-6" />
            )}
          </span>
          <span
            className={cn(
              'flex flex-col gap-0.5',
              index < steps.length - 1 && 'pb-6',
            )}
          >
            <span className="text-xs font-medium text-gray-11">
              {step.when}
            </span>
            <span className="text-sm text-gray-12">{step.what}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function StartTrial({
  featureKey,
  hasPostTrialActivationCallback,
  isPending,
  isError,
  onStart,
}: {
  featureKey: FeatureKey | undefined;
  hasPostTrialActivationCallback: boolean;
  isPending: boolean;
  isError: boolean;
  onStart: () => void;
}) {
  const highlights = selfServeTrialFeatures.highlights(featureKey);
  const isClicked = (keys: FeatureKey[]) =>
    featureKey !== undefined && keys.includes(featureKey);
  const featureName = highlights.some((feature) =>
    isClicked(feature.featureKeys),
  )
    ? selfServeTrialFeatures.nameInSentence(featureKey)
    : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row">
      <div className="flex flex-col gap-8 p-8 md:w-[32rem] md:shrink-0">
        <div className="flex flex-col gap-2 pr-8 md:pr-0">
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            {featureName
              ? t('Try {feature} free for {days} days', {
                  feature: featureName,
                  days: SELF_SERVE_TRIAL_DAYS,
                })
              : t('Try the Enterprise plan free for {days} days', {
                  days: SELF_SERVE_TRIAL_DAYS,
                })}
          </DialogTitle>
          <DialogDescription className="text-base text-gray-11">
            {t('You get the full Enterprise plan, no card needed.')}
          </DialogDescription>
          {hasPostTrialActivationCallback && (
            <p className="mt-2 flex items-start gap-2.5 text-sm text-gray-12">
              <Check className="mt-0.5 size-4 shrink-0 text-success-11" />
              {t(
                'We save your changes as soon as the trial starts, so nothing you did is lost.',
              )}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium text-gray-11">
            {t('What you get')}
          </span>
          <ul className="grid gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-flow-col md:grid-rows-3">
            {highlights.map((feature) => {
              const highlighted = isClicked(feature.featureKeys);
              return (
                <li key={feature.title} className="flex items-start gap-2.5">
                  <feature.icon
                    className={cn(
                      'mt-0.5 size-4 shrink-0',
                      highlighted ? 'text-accent-11' : 'text-gray-11',
                    )}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span
                      className={cn(
                        'text-sm text-gray-12',
                        highlighted && 'font-medium',
                      )}
                    >
                      {feature.shortTitle ?? feature.title}
                    </span>
                    <span className="truncate text-xs text-gray-11">
                      {feature.detail}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <aside className="flex flex-1 flex-col justify-between gap-8 border-t bg-gray-2 p-8 md:border-t-0 md:border-l">
        <TrialTimeline started={false} />
        <div className="flex flex-col items-stretch gap-2 bg-gray-2 max-md:sticky max-md:bottom-0">
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
            {hasPostTrialActivationCallback
              ? t('Start trial and save')
              : t('Start free trial')}
          </Button>
          <SelfServeTrialSalesLink
            locationInWebApp={SalesLinkLocationInWebApp.ENTERPRISE_TRIAL_START}
            className="h-10"
            featureKey={featureKey}
          />
        </div>
      </aside>
    </div>
  );
}

function dialogViewForStartResult({
  result,
  alreadyUsed,
  shouldOfferTrial,
}: {
  result: SelfServeTrialState | undefined;
  alreadyUsed: boolean;
  shouldOfferTrial: boolean;
}): DialogView {
  if (alreadyUsed) {
    return DialogView.ALREADY_USED;
  }
  switch (result) {
    case SelfServeTrialState.ACTIVE:
      return DialogView.STARTED;
    case SelfServeTrialState.ENDED:
      return DialogView.ALREADY_USED;
    case SelfServeTrialState.ELIGIBLE:
    case SelfServeTrialState.INELIGIBLE:
    case undefined:
      return shouldOfferTrial ? DialogView.START : DialogView.LOCKED;
  }
}

function celebrate(): void {
  confetti({
    particleCount: 120,
    spread: 80,
    origin: { y: 0.6 },
    disableForReducedMotion: true,
  })?.catch(() => undefined);
}

enum DialogView {
  START = 'start',
  STARTED = 'started',
  ALREADY_USED = 'already_used',
  LOCKED = 'locked',
}
