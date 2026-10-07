import { isNil } from '@activepieces/core-utils';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import {
  EnterpriseTrial,
  enterpriseTrialHooks,
} from '../hooks/enterprise-trial-hooks';

export function EnterpriseTrialPill() {
  const trial = enterpriseTrialHooks.useTrial();
  if (trial.state !== 'active' || isNil(trial.endsAt)) {
    return null;
  }
  return (
    <div className="flex w-full flex-col rounded-md border bg-gray-1 p-2.5">
      <EnterpriseTrialLine trial={trial} />
    </div>
  );
}

export function EnterpriseTrialLine({ trial }: { trial: EnterpriseTrial }) {
  const content = (
    <span
      className={cn(
        'flex h-5 min-w-0 items-center gap-1.5 text-xs',
        trial.endingSoon ? 'text-warning-11' : 'text-gray-11',
      )}
    >
      <Sparkles
        className={cn(
          'size-3.5 shrink-0',
          trial.endingSoon ? 'text-warning-11' : 'text-accent-11',
        )}
      />
      <span className="truncate">{trialLineText(trial)}</span>
    </span>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {trial.isPlatformAdmin ? (
          <Link
            to="/platform/billing"
            className="min-w-0 self-start hover:underline"
          >
            {content}
          </Link>
        ) : (
          <span tabIndex={0} className="min-w-0 self-start">
            {content}
          </span>
        )}
      </TooltipTrigger>
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
    today: () => t('Your Enterprise trial ends today at {time}.', { time }),
    tomorrow: () =>
      t('Your Enterprise trial ends tomorrow at {time}.', { time }),
    later: () =>
      t('Your Enterprise trial ends on {date}.', {
        date: end.format('MMM D'),
      }),
  });
}

function trialLineText(trial: EnterpriseTrial): string {
  const end = dayjs(trial.endsAt);
  return pickByDay({
    end,
    today: () => t('Enterprise trial · ends today'),
    tomorrow: () => t('Enterprise trial · ends tomorrow'),
    later: () =>
      t('Enterprise trial · ends {date}', { date: end.format('MMM D') }),
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
        'Enterprise features are on until today at {time}. Then you are back on the {plan} plan. Your credits are not affected.',
        { time, plan },
      ),
    tomorrow: () =>
      t(
        'Enterprise features are on until tomorrow at {time}. Then you are back on the {plan} plan. Your credits are not affected.',
        { time, plan },
      ),
    later: () =>
      t(
        'Enterprise features are on until {date}. Then you are back on the {plan} plan. Your credits are not affected.',
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
