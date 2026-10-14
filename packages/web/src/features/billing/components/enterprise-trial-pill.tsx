import { isNil } from '@activepieces/core-utils';
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
import { enterpriseTrialCopy } from '../utils/enterprise-trial-copy';
import { planTiers } from '../utils/plan-tiers';

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
  if (trial.state !== 'active') {
    return null;
  }
  const line = (
    <span
      className={cn(
        'flex min-w-0 items-center gap-1.5 text-xs whitespace-nowrap',
        trial.endsToday ? 'text-warning-11' : 'text-gray-11',
      )}
    >
      <Gem
        className={cn(
          'size-3.5 shrink-0',
          trial.endsToday ? 'text-warning-11' : 'text-accent-11',
        )}
      />
      <span className="min-w-0 truncate font-medium">
        {t('Enterprise trial')}
      </span>
      <span className="shrink-0">
        · {enterpriseTrialCopy.cardStatus(trial)}
      </span>
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
        {enterpriseTrialCopy.details(trial)}
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
  if (!inTrial && !planTiers.isEnterprisePlan(platform.plan.plan)) {
    return null;
  }
  const lastDay = inTrial && trial.endsToday;
  const row = (
    <Link
      to="/platform/billing"
      data-slot="enterprise-plan-indicator"
      className="flex min-w-0 items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-gray-4"
    >
      <Gem className="mt-0.5 size-4 shrink-0 text-accent-11" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-12">
          {inTrial ? t('Enterprise plan trial') : t('Enterprise plan')}
        </span>
        {inTrial && (
          <span
            className={cn(
              'text-xs',
              lastDay ? 'text-warning-11' : 'text-gray-11',
            )}
          >
            {enterpriseTrialCopy.sidebarDetail(trial)}
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
        {enterpriseTrialCopy.details(trial)}
      </TooltipContent>
    </Tooltip>
  );
}
