import { isNil } from '@activepieces/core-utils';
import { PlanName } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Gem } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

import {
  EnterpriseTrial,
  enterpriseTrialHooks,
} from '../hooks/enterprise-trial-hooks';

export function EnterpriseTrialPill() {
  const trial = enterpriseTrialHooks.useTrial();
  if (
    trial.state !== 'active' ||
    isNil(trial.endsAt) ||
    !trial.isPlatformAdmin
  ) {
    return null;
  }
  return (
    <div className="flex w-full flex-col rounded-md border bg-gray-1 p-2.5">
      <EnterpriseTrialLine trial={trial} />
    </div>
  );
}

export function EnterpriseTrialLine({ trial }: { trial: EnterpriseTrial }) {
  if (!trial.isPlatformAdmin) {
    return null;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/platform/billing"
          className="min-w-0 self-start hover:underline"
        >
          <span
            className={cn(
              'flex h-5 min-w-0 items-center gap-1.5 text-xs',
              trial.endingSoon ? 'text-warning-11' : 'text-gray-11',
            )}
          >
            <Gem
              className={cn(
                'size-3.5 shrink-0',
                trial.endingSoon ? 'text-warning-11' : 'text-accent-11',
              )}
            />
            <span className="truncate">
              {t('Enterprise plan')} · {trialLeftText(trial)}
            </span>
          </span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        {trialDetailsText(trial)}
      </TooltipContent>
    </Tooltip>
  );
}

export function EnterprisePlanIndicator() {
  const trial = enterpriseTrialHooks.useTrial();
  const { platform } = platformHooks.useCurrentPlatform();
  const inTrial = trial.state === 'active' && !isNil(trial.endsAt);
  if (!trial.isPlatformAdmin) {
    return null;
  }
  if (!inTrial && platform.plan.plan !== PlanName.ENTERPRISE) {
    return null;
  }
  const row = (
    <Link
      to="/platform/billing"
      data-slot="enterprise-plan-indicator"
      className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors duration-150 hover:bg-gray-4"
    >
      <Gem className="size-3.5 shrink-0 text-accent-11" />
      <span className="flex min-w-0 items-baseline gap-1">
        <span className="shrink-0 font-medium text-gray-12">
          {t('Enterprise plan')}
        </span>
        {inTrial && (
          <span
            className={cn(
              'truncate',
              trial.lastDay ? 'text-warning-11' : 'text-gray-11',
            )}
          >
            · {trialLeftText(trial)}
          </span>
        )}
      </span>
    </Link>
  );
  if (!inTrial) {
    return row;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        {trialDetailsText(trial)}
      </TooltipContent>
    </Tooltip>
  );
}

export function trialEndsText(trial: EnterpriseTrial): string {
  const end = dayjs(trial.endsAt);
  const time = end.format('h:mm A');
  return pickByDay({
    end,
    today: () =>
      t('Your Enterprise plan trial ends today at {time}.', { time }),
    tomorrow: () =>
      t('Your Enterprise plan trial ends tomorrow at {time}.', { time }),
    later: () =>
      t('Your Enterprise plan trial ends on {date}.', {
        date: end.format('MMM D'),
      }),
  });
}

function trialLeftText(trial: EnterpriseTrial): string {
  const end = dayjs(trial.endsAt);
  return pickByDay({
    end,
    today: () => t('trial ends today'),
    tomorrow: () => t('trial ends tomorrow'),
    later: () =>
      t('trial, {count, plural, =1 {1 day left} other {# days left}}', {
        count: trial.daysLeft,
      }),
  });
}

function trialDetailsText(trial: EnterpriseTrial): string {
  const end = dayjs(trial.endsAt);
  const time = end.format('h:mm A');
  const plan = trial.basePlanName;
  return pickByDay({
    end,
    today: () =>
      t(
        'Every Enterprise plan feature is on until today at {time}. Then you are back on the {plan} plan. Your credits are not affected.',
        { time, plan },
      ),
    tomorrow: () =>
      t(
        'Every Enterprise plan feature is on until tomorrow at {time}. Then you are back on the {plan} plan. Your credits are not affected.',
        { time, plan },
      ),
    later: () =>
      t(
        'Every Enterprise plan feature is on until {date}. Then you are back on the {plan} plan. Your credits are not affected.',
        { date: end.format('MMM D'), plan },
      ),
  });
}

function pickByDay({
  end,
  today,
  tomorrow,
  later,
}: {
  end: dayjs.Dayjs;
  today: () => string;
  tomorrow: () => string;
  later: () => string;
}): string {
  if (end.isSame(dayjs(), 'day')) {
    return today();
  }
  if (end.isSame(dayjs().add(1, 'day'), 'day')) {
    return tomorrow();
  }
  return later();
}
