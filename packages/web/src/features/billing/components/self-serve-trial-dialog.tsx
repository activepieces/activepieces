import { isNil } from '@activepieces/core-utils';
import {
  ApEdition,
  ApFlagId,
  SelfServeTrialState,
  SalesLinkLocationInWebApp,
} from '@activepieces/shared';
import confetti from 'canvas-confetti';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Check, Gem, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { billingDialogHooks } from '../hooks/billing-dialog-hooks';
import { billingQueries } from '../hooks/billing-hooks';
import {
  SELF_SERVE_TRIAL_DAYS,
  selfServeTrialHooks,
} from '../hooks/self-serve-trial-hooks';
import { enterpriseMotion } from '../utils/billing-utils';
import { selfServeTrialFeatures } from '../utils/self-serve-trial-features';
import { selfServeTrialTime } from '../utils/self-serve-trial-utils';

import { SelfServeTrialSalesLink } from './current-subscription-card';
import {
  DialogFrame,
  IncludedFeatures,
  LockedFeature,
  TrialAlreadyUsed,
  TrialNotStarted,
  TrialStarted,
} from './self-serve-trial-dialog-views';
import { SelfServeTrialEndedDialog } from './self-serve-trial-notices';

export function SelfServeTrialDialog() {
  const { payload, returnFocus, closeDialog } =
    billingDialogHooks.useSelfServeTrialDialogStore();
  const shouldOfferTrial = selfServeTrialHooks.useShouldOfferTrial();
  const {
    mutate: startSelfServeTrial,
    data: startedTrial,
    isPending: isStartingTrial,
    isError: trialStartFailed,
    reset: resetTrialStart,
  } = selfServeTrialHooks.useStartSelfServeTrial((status) => {
    if (status.state !== SelfServeTrialState.ACTIVE) {
      return;
    }
    celebrate();
    runPostTrialActivationCallback();
  });
  const open = !isNil(payload);
  const view = dialogViewForStartResult({
    result: startedTrial?.state,
    shouldOfferTrial: shouldOfferTrial || trialStartFailed,
  });
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
            isPending={isStartingTrial}
            isError={trialStartFailed}
            onStart={() => {
              startSelfServeTrial();
            }}
          />
        );
      case DialogView.STARTED:
        return <TrialStarted onClose={close} />;
      case DialogView.ALREADY_USED:
        return <TrialAlreadyUsed />;
      case DialogView.NOT_STARTED:
        return <TrialNotStarted onClose={close} />;
      case DialogView.LOCKED:
        return (
          <LockedFeature featureKey={payload?.featureKey} onAction={close} />
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
              {renderView()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TrialTimeline({ started }: { started: boolean }) {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: info } = billingQueries.usePlatformSubscription(platform.id);
  const endDate = dayjs().add(SELF_SERVE_TRIAL_DAYS, 'day');
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
          what: t('Everything turns on. Your credits stay the same.'),
        },
    {
      when: selfServeTrialTime.formatDate(endDate.subtract(1, 'day')),
      what: t('We remind you the day before it ends.'),
    },
    {
      when: selfServeTrialTime.formatDate(endDate),
      what: t(
        'You are back on {plan}. Your flows, connections and settings are kept.',
        {
          plan: info?.autumnPlanName,
        },
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

function StartTrial({
  isPending,
  isError,
  onStart,
}: {
  isPending: boolean;
  isError: boolean;
  onStart: () => void;
}) {
  const { payload } = billingDialogHooks.useSelfServeTrialDialogStore();
  const featureKey = payload?.featureKey;
  const hasPostTrialActivationCallback = !isNil(
    payload?.postTrialActivationCallback,
  );
  const featureName = selfServeTrialFeatures.name(featureKey);
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

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
        days: SELF_SERVE_TRIAL_DAYS,
      })}
      description={t(
        'Everything in the Enterprise plan turns on for everyone on your platform. No credit card, nothing to set up.',
      )}
      note={
        hasPostTrialActivationCallback && (
          <p className="flex items-start gap-2.5 text-sm text-gray-12">
            <Check className="mt-0.5 size-4 shrink-0 text-success-11" />
            {t(
              'We save your changes as soon as the trial starts, so nothing you did is lost.',
            )}
          </p>
        )
      }
      mainTitle={t('What is included')}
      main={
        <>
          <IncludedFeatures featureKey={featureKey} />
          {edition === ApEdition.CLOUD && (
            <p className="flex items-start gap-2.5 text-sm text-gray-11">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-gray-9" />
              {t(
                "Plans that include Embedding don't usually come with the Activepieces AI provider. You can use both together only during the trial.",
              )}
            </p>
          )}
        </>
      }
      asideTitle={t('How the trial works')}
      aside={<TrialTimeline started={false} />}
      footerNote={
        <>
          {t('Want to keep the Enterprise plan?')}
          <SelfServeTrialSalesLink
            locationInWebApp={SalesLinkLocationInWebApp.ENTERPRISE_TRIAL_START}
            variant="link"
            className="h-auto p-0"
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
            {hasPostTrialActivationCallback
              ? t('Start trial and save')
              : t('Start free trial')}
          </Button>
        </div>
      }
    />
  );
}

function dialogViewForStartResult({
  result,
  shouldOfferTrial,
}: {
  result: SelfServeTrialState | undefined;
  shouldOfferTrial: boolean;
}): DialogView {
  switch (result) {
    case SelfServeTrialState.ACTIVE:
      return DialogView.STARTED;
    case SelfServeTrialState.USED:
    case SelfServeTrialState.ENDED:
      return DialogView.ALREADY_USED;
    case SelfServeTrialState.UNAVAILABLE:
    case SelfServeTrialState.ELIGIBLE:
      return DialogView.NOT_STARTED;
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
  NOT_STARTED = 'not_started',
  LOCKED = 'locked',
}
