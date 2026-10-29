import { isNil } from '@activepieces/core-utils';
import {
  PlanName,
  SelfServeTrialState,
  PlatformAdminSurface,
} from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Gem, X, Check } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { authenticationSession } from '@/lib/authentication-session';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import {
  SelfServeTrial,
  selfServeTrialHooks,
} from '../hooks/self-serve-trial-hooks';
import { useUpgradeClick } from '../hooks/use-upgrade-click';
import {
  selfServeTrialCopy,
  enterpriseMotion,
  selfServeTrialUi,
} from '../utils/billing-utils';
import {
  selfServeTrialFeatures,
  selfServeTrialTime,
} from '../utils/self-serve-trial-utils';

import {
  useSalesLink,
  SelfServeTrialSalesLink,
} from './current-subscription-card';

export function SelfServeTrialLine({ trial }: { trial: SelfServeTrial }) {
  const line = (
    <span
      className={cn(
        'flex min-w-0 items-center gap-1.5 text-xs whitespace-nowrap',
        trial.endsToday ? 'text-warning-11' : 'text-gray-11',
      )}
    >
      <Gem
        className={cn(
          'size-3.5 shrink-0 -translate-y-px',
          trial.endsToday ? 'text-warning-11' : 'text-accent-11',
        )}
      />
      <span className="min-w-0 truncate font-medium">
        {t('Enterprise trial')}
      </span>
      <span className="shrink-0">· {selfServeTrialCopy.cardStatus(trial)}</span>
    </span>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {trial.isPlatformAdmin ? (
          <Link
            to="/platform/billing"
            className="max-w-full min-w-0 self-start hover:underline"
          >
            {line}
          </Link>
        ) : (
          <span tabIndex={0} className="max-w-full min-w-0 self-start">
            {line}
          </span>
        )}
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        {selfServeTrialCopy.details(trial)}
      </TooltipContent>
    </Tooltip>
  );
}

export function EnterprisePlanIndicator() {
  const trial = selfServeTrialHooks.useTrial();
  const { platform } = platformHooks.useCurrentPlatform();
  const salesLink = useSalesLink({ surface: 'enterprise_plan_indicator' });
  const inTrial =
    trial.state === SelfServeTrialState.ACTIVE && !isNil(trial.endsAt);
  if (!trial.isPlatformAdmin) {
    return null;
  }
  if (inTrial) {
    return <TrialIndicator trial={trial} />;
  }
  if (!platform.plan.plan?.startsWith(PlanName.ENTERPRISE)) {
    return null;
  }
  return (
    <a
      {...salesLink}
      data-slot="enterprise-plan-indicator"
      className={ROW_CLASS}
    >
      <Gem className="mt-0.5 size-4 shrink-0 text-accent-11" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-12">
          {t('Enterprise plan')}
        </span>
        <span className="text-xs text-gray-11">{t('Talk to sales')}</span>
      </span>
    </a>
  );
}

function TrialIndicator({ trial }: { trial: SelfServeTrial }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/platform/billing"
          data-slot="enterprise-plan-indicator"
          className={ROW_CLASS}
        >
          <Gem className="mt-0.5 size-4 shrink-0 text-accent-11" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium text-gray-12">
              {t('Enterprise plan trial')}
            </span>
            <span
              className={cn(
                'text-xs',
                trial.endsToday ? 'text-warning-11' : 'text-gray-11',
              )}
            >
              {selfServeTrialCopy.sidebarDetail(trial)}
            </span>
          </span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        {selfServeTrialCopy.details(trial)}
      </TooltipContent>
    </Tooltip>
  );
}

const ROW_CLASS =
  'flex min-w-0 items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-gray-4';

export function SelfServeTrialEndingAlert() {
  const trial = selfServeTrialHooks.useTrial();
  const { platform } = platformHooks.useCurrentPlatform();
  const upgradeClick = useUpgradeClick();
  const trialId = selfServeTrialUi.trialStorageId({
    platformId: platform.id,
    userId: authenticationSession.getCurrentUserId(),
    endsAt: trial.endsAt,
  });
  const dismissKey = trial.ending
    ? `${ENDING_DISMISS_KEY_PREFIX}${trialId}-${dayjs().format('YYYY-MM-DD')}`
    : `${STARTED_DISMISS_KEY_PREFIX}${trialId}`;
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const dismissed =
    dismissedKey === dismissKey ||
    selfServeTrialUi.readLocalStorageFlag(dismissKey);
  const visible =
    trial.isPlatformAdmin &&
    trial.state === SelfServeTrialState.ACTIVE &&
    !isNil(trial.endsAt) &&
    (trial.ending || trial.justStarted) &&
    !dismissed;

  if (!visible) {
    return null;
  }

  const ending = trial.ending;
  const tone = trial.endsToday ? TONE.today : TONE.soon;
  const date = dayjs(trial.endsAt).format('MMM D');

  const title = ending
    ? selfServeTrialCopy.endsSentence(trial)
    : t('You are on a free trial of the Enterprise plan until {date}.', {
        date,
      });
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
                  upgradeClick({ surface: PlatformAdminSurface.BANNER })
                }
              >
                {t('Explore plans')}
              </Button>
              <SelfServeTrialSalesLink
                surface="enterprise_trial_ending"
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
            selfServeTrialUi.setLocalStorageFlag(dismissKey);
            setDismissedKey(dismissKey);
          }}
        >
          <X className="size-3.5" />
        </Button>
      </div>
    </div>
  );
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

export function SelfServeTrialEndedDialog() {
  const { platform } = platformHooks.useCurrentPlatform();
  const trial = selfServeTrialHooks.useTrial();
  const upgradeClick = useUpgradeClick();
  const storageKey = `${SEEN_KEY_PREFIX}${selfServeTrialUi.trialStorageId({
    platformId: platform.id,
    userId: authenticationSession.getCurrentUserId(),
    endsAt: trial.endsAt,
  })}`;
  const [seenKey, setSeenKey] = useState<string | null>(null);
  const alreadySeen =
    seenKey === storageKey || selfServeTrialUi.readLocalStorageFlag(storageKey);

  const endedRecently =
    !isNil(trial.endsAt) &&
    selfServeTrialTime.calendarDaysBetween({
      from: trial.endsAt,
      to: Date.now(),
    }) <= SHOW_FOR_DAYS;
  const open =
    trial.state === SelfServeTrialState.ENDED &&
    trial.isPlatformAdmin &&
    endedRecently &&
    !alreadySeen;
  const close = () => {
    selfServeTrialUi.setLocalStorageFlag(storageKey);
    setSeenKey(storageKey);
  };
  const locked = selfServeTrialFeatures.lockedAfterTrial(platform.plan);
  const keptAfterTrial = [t('Flows, connections and data'), t('Your credits')];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent
        onOpenAutoFocus={selfServeTrialUi.focusDialogItself}
        className="max-h-[calc(100dvh-2rem)] gap-5 overflow-y-auto p-7 sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex flex-col gap-2 pr-6">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {t('Thanks for trying the Enterprise plan')}
          </DialogTitle>
          <DialogDescription className="text-base text-pretty">
            {isNil(trial.endsAt)
              ? t('You are back on the {plan} plan.', {
                  plan: trial.basePlanName,
                })
              : t('It ended on {date}. You are back on the {plan} plan.', {
                  date: dayjs(trial.endsAt).format('MMM D'),
                  plan: trial.basePlanName,
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
              close();
              upgradeClick({ surface: PlatformAdminSurface.DIALOG });
            }}
          >
            {t('Explore plans')}
          </Button>
          <SelfServeTrialSalesLink
            surface="enterprise_trial_ended"
            variant="default"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

const SEEN_KEY_PREFIX = 'ap-self-serve-trial-ended-seen-';

const SHOW_FOR_DAYS = 14;
