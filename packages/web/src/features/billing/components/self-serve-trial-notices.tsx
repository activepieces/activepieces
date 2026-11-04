import { isNil, tryCatchSync } from '@activepieces/core-utils';
import {
  UpgradeLocationInWebApp,
  SalesLinkLocationInWebApp,
} from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Gem, X, Check } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { authenticationSession } from '@/lib/authentication-session';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { billingQueries } from '../hooks/billing-hooks';
import { useUpgradeClick } from '../hooks/use-upgrade-click';
import { enterpriseMotion } from '../utils/billing-utils';
import { selfServeTrialFeatures } from '../utils/self-serve-trial-features';
import { selfServeTrialTime } from '../utils/self-serve-trial-utils';

import { SelfServeTrialSalesLink } from './current-subscription-card';

export function SelfServeTrialEndingAlert() {
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();
  const upgradeClick = useUpgradeClick();
  const trial = platform.selfServeTrial;
  const trialId = `${platform.id}-${authenticationSession.getCurrentUserId()}-${
    trial?.endsAt
  }`;
  const daysLeft = isNil(trial)
    ? null
    : selfServeTrialTime.daysLeft(trial.endsAt);
  const ending = !isNil(daysLeft) && daysLeft <= 1;
  const justStarted =
    !isNil(trial) &&
    selfServeTrialTime.calendarDaysBetween({
      from: trial.startedAt,
      to: Date.now(),
    }) < JUST_STARTED_DAYS;
  const dismissKey = ending
    ? `${ENDING_DISMISS_KEY_PREFIX}${trialId}-${dayjs().format('YYYY-MM-DD')}`
    : `${STARTED_DISMISS_KEY_PREFIX}${trialId}`;
  const { dismissed, dismiss } = useRememberedDismissal(dismissKey);

  if (
    !isPlatformAdmin ||
    !selfServeTrialTime.isRunning(trial) ||
    !(ending || justStarted) ||
    dismissed
  ) {
    return null;
  }

  const tone = daysLeft === 0 ? TONE.today : TONE.soon;
  const end = selfServeTrialTime.whenItEnds(trial.endsAt);

  const title = ending
    ? t(
        'Your Enterprise plan trial ends {day, select, today {today at {time}} tomorrow {tomorrow at {time}} other {on {date}}}.',
        end,
      )
    : t('You are on a free trial of the Enterprise plan until {date}.', end);
  const detail = ending
    ? t(
        'Want to keep the Enterprise plan? Talk to our team. Nothing is deleted either way.',
      )
    : t(
        'Single sign-on, audit logs, your own AI providers and every other Enterprise plan feature are on for your whole platform.',
      );

  return (
    <div className={cn(DASHBOARD_CONTENT_PADDING_X, 'w-full pt-3')}>
      <div
        role="status"
        data-slot="self-serve-trial-banner"
        className={cn(
          'flex items-start gap-3 rounded-xl border py-3 pr-2 pl-4 text-sm',
          tone.surface,
          enterpriseMotion.appear,
        )}
      >
        <Gem className={cn('mt-0.5 size-4 shrink-0', tone.icon)} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-1 basis-72 flex-col gap-0.5">
            <p className="font-medium text-gray-12">{title}</p>
            <p className="text-pretty text-gray-11">{detail}</p>
          </div>
          {ending && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                {...adminControl(AdminControl.TRIAL_PLANS_OPEN)}
                variant="outline"
                size="sm"
                className={tone.secondary}
                onClick={() =>
                  upgradeClick({
                    locationInWebApp: UpgradeLocationInWebApp.BANNER,
                  })
                }
              >
                {t('Explore plans')}
              </Button>
              <SelfServeTrialSalesLink
                locationInWebApp={
                  SalesLinkLocationInWebApp.ENTERPRISE_TRIAL_ENDING
                }
                size="sm"
                variant="default"
                className={tone.primary}
              />
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={ending ? t('Dismiss for today') : t('Dismiss')}
          className={cn('shrink-0', tone.dismiss)}
          onClick={() => {
            dismiss();
          }}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function SelfServeTrialEndedDialog() {
  const { platform } = platformHooks.useCurrentPlatform();
  const isPlatformAdmin = useIsPlatformAdmin();
  const upgradeClick = useUpgradeClick();
  const trial = platform.selfServeTrial;
  const storageKey = `${SEEN_KEY_PREFIX}${
    platform.id
  }-${authenticationSession.getCurrentUserId()}-${trial?.endsAt}`;
  const { dismissed: alreadySeen, dismiss: markSeen } =
    useRememberedDismissal(storageKey);
  const endedRecently =
    selfServeTrialTime.hasEnded(trial) &&
    selfServeTrialTime.calendarDaysBetween({
      from: trial.endsAt,
      to: Date.now(),
    }) <= SHOW_FOR_DAYS;
  const shouldShow = isPlatformAdmin && endedRecently && !alreadySeen;
  const { data: info } = billingQueries.usePlatformSubscription(
    platform.id,
    shouldShow,
  );
  const open = shouldShow && !isNil(info);
  const locked = selfServeTrialFeatures.lockedAfterTrial(platform.plan);
  const keptAfterTrial = [t('Flows, connections and data'), t('Your credits')];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && markSeen()}>
      <DialogContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto p-7 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex flex-col gap-2 pr-6">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {t('Thanks for trying the Enterprise plan')}
          </DialogTitle>
          <DialogDescription className="text-base text-pretty">
            {!isNil(info) &&
              selfServeTrialTime.hasEnded(trial) &&
              t('It ended on {date}. You are back on {plan}.', {
                date: selfServeTrialTime.whenItEnds(trial.endsAt).date,
                plan: info.autumnPlanName,
              })}
          </DialogDescription>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-gray-12">
            {t('Everything you built is still here')}
          </span>
          <ul className="flex flex-col gap-2.5">
            {keptAfterTrial.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-sm text-gray-12"
              >
                <Check className="size-4 shrink-0 text-success-11" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        {locked.length > 0 && (
          <div className="flex flex-col gap-3 border-t pt-5">
            <span className="text-sm text-gray-11">
              {t('Locked for changes')}
            </span>
            <ul className="flex flex-wrap gap-2">
              {locked.map((feature) => (
                <li
                  key={feature.title}
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-gray-11"
                >
                  <feature.icon className="size-3.5 shrink-0 text-gray-9" />
                  {feature.title}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-sm text-gray-11">
          {t(
            'Our team can extend your trial or set you up on the Enterprise plan.',
          )}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            {...adminControl(AdminControl.TRIAL_PLANS_OPEN)}
            variant="outline"
            onClick={() => {
              markSeen();
              upgradeClick({
                locationInWebApp: UpgradeLocationInWebApp.DIALOG,
              });
            }}
          >
            {t('Explore plans')}
          </Button>
          <SelfServeTrialSalesLink
            locationInWebApp={SalesLinkLocationInWebApp.ENTERPRISE_TRIAL_ENDED}
            variant="default"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function useRememberedDismissal(key: string): RememberedDismissal {
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  return {
    dismissed:
      dismissedKey === key ||
      tryCatchSync(() => window.localStorage.getItem(key)).data === 'true',
    dismiss: () => {
      tryCatchSync(() => window.localStorage.setItem(key, 'true'));
      setDismissedKey(key);
    },
  };
}

const TONE = {
  soon: {
    surface: 'border-accent-7 bg-accent-3',
    icon: 'text-accent-11',
    secondary:
      'border-accent-7 bg-transparent text-accent-11 hover:bg-accent-4',
    primary: '',
    dismiss: 'text-accent-11 hover:bg-accent-4 hover:text-accent-12',
  },
  today: {
    surface: 'border-warning-7 bg-warning-3',
    icon: 'text-warning-11',
    secondary:
      'border-warning-7 bg-transparent text-warning-11 hover:bg-warning-4',
    primary: 'bg-warning-9 text-on-warning hover:bg-warning-10',
    dismiss: 'text-warning-11 hover:bg-warning-4 hover:text-warning-12',
  },
};

const ENDING_DISMISS_KEY_PREFIX = 'ap-self-serve-trial-ending-dismissed-';

const STARTED_DISMISS_KEY_PREFIX = 'ap-self-serve-trial-started-dismissed-';

const JUST_STARTED_DAYS = 2;

const SEEN_KEY_PREFIX = 'ap-self-serve-trial-ended-seen-';

const SHOW_FOR_DAYS = 14;

type RememberedDismissal = {
  dismissed: boolean;
  dismiss: () => void;
};
