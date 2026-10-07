import { isNil } from '@activepieces/core-utils';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Sparkles } from 'lucide-react';
import { ReactNode } from 'react';
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
      <span className="truncate">
        {t('Enterprise trial · ends {when}', {
          when: enterpriseTrialEndsWhen(trial, { withTime: false }),
        })}
      </span>
    </span>
  );
  return (
    <ExplainOnHover trial={trial}>
      {trial.isPlatformAdmin ? (
        <Link
          to="/platform/billing"
          aria-label={trialSummary(trial)}
          className="min-w-0 self-start hover:underline"
        >
          {content}
        </Link>
      ) : (
        <span aria-label={trialSummary(trial)} className="min-w-0 self-start">
          {content}
        </span>
      )}
    </ExplainOnHover>
  );
}

export function enterpriseTrialEndsWhen(
  trial: EnterpriseTrial,
  { withTime = true }: { withTime?: boolean } = {},
): string {
  const end = dayjs(trial.endsAt);
  const time = end.format('h:mm A');
  if (end.isSame(dayjs(), 'day')) {
    return withTime ? t('today at {time}', { time }) : t('today');
  }
  if (end.isSame(dayjs().add(1, 'day'), 'day')) {
    return withTime ? t('tomorrow at {time}', { time }) : t('tomorrow');
  }
  return end.format('MMM D');
}

function ExplainOnHover({
  trial,
  children,
}: {
  trial: EnterpriseTrial;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className="max-w-64">
        {trialDetails(trial)}
      </TooltipContent>
    </Tooltip>
  );
}

function trialSummary(trial: EnterpriseTrial): string {
  return t('Enterprise trial, ends {when}', {
    when: enterpriseTrialEndsWhen(trial),
  });
}

function trialDetails(trial: EnterpriseTrial): string {
  return t(
    'Enterprise features are on until {when}. Then you are back on {plan}. Your credits are not affected.',
    {
      when: enterpriseTrialEndsWhen(trial),
      plan: trial.basePlanName,
    },
  );
}
