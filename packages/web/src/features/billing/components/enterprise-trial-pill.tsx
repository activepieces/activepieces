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
  if (!trial.isPlatformAdmin || trial.state !== 'active') {
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
              'flex min-w-0 items-start gap-1.5 text-xs',
              trial.ending ? 'text-warning-11' : 'text-gray-11',
            )}
          >
            <Gem
              className={cn(
                'mt-px size-3.5 shrink-0',
                trial.ending ? 'text-warning-11' : 'text-accent-11',
              )}
            />
            <span className="flex flex-wrap gap-x-1">
              <span className="font-medium">{t('Enterprise plan trial')}</span>
              <span>· {enterpriseTrialCopy.daysLeftLabel(trial)}</span>
            </span>
          </span>
        </Link>
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
  const ending = inTrial && trial.ending;
  const row = (
    <Link
      to="/platform/billing"
      data-slot="enterprise-plan-indicator"
      className="flex min-w-0 items-start gap-2.5 rounded-md px-2 py-2 transition-colors duration-150 hover:bg-gray-4"
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
              ending ? 'text-warning-11' : 'text-gray-11',
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
