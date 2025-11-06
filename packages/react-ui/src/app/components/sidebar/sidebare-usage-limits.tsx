import dayjs from 'dayjs';
import { t } from 'i18next';
import React from 'react';
import { Link } from 'react-router-dom';

import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { cn, formatUtils } from '@/lib/utils';
import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';

import { FlagGuard } from '../flag-guard';

const getTimeUntilNextReset = (nextResetDate: number) => {
  const now = dayjs();
  const nextReset = dayjs.unix(nextResetDate);

  if (nextReset.isBefore(now)) {
    return t('Today');
  }

  const diffInMonths = nextReset.diff(now, 'months');
  if (diffInMonths > 0) {
    return `${diffInMonths} ${t('months')}`;
  }

  const diffInDays = nextReset.diff(now, 'days');
  if (diffInDays > 0) {
    return `${diffInDays} ${t('days')}`;
  }

  const diffInHours = nextReset.diff(now, 'hours');
  if (diffInHours > 0) {
    return `${diffInHours} ${t('hours')}`;
  }

  const diffInMinutes = nextReset.diff(now, 'minutes');
  if (diffInMinutes > 0) {
    return `${diffInMinutes} ${t('minutes')}`;
  }

  return t('Today');
};

const SidebarUsageLimits = React.memo(() => {
  const { project, isPending } = projectHooks.useCurrentProject();

  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (edition === ApEdition.COMMUNITY) {
    return null;
  }

  if (isPending || isNil(project)) {
    return (
      <div className="flex flex-col gap-2 w-full px-2  broder rounded-md bg-background">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4" />
                    <Skeleton className="w-12 h-3" />
                  </div>
                  <Skeleton className="w-16 h-3" />
                </div>
                <Skeleton className="w-full h-[6px]" />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4" />
                <Skeleton className="w-16 h-3" />
              </div>
              <Skeleton className="w-20 h-3" />
            </div>
            <Skeleton className="w-full h-[6px]" />
            <Skeleton className="w-full h-8" />
          </div>
        </div>
        <Separator className="my-1.5" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full p-3 bg-background rounded-md border ">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <UsageProgress
            name={t('AI Credits')}
            value={project.usage.aiCredits}
            max={project.plan.aiCredits}
            variant={'success'}
          />
          <UsageProgress
            name={t('Executions')}
            value={null}
            max={null}
            variant={'success'}
          />
        </div>
        <div className="text-xs text-muted-foreground flex justify-between w-full">
          <span>
            {t('Usage resets in')}{' '}
            {getTimeUntilNextReset(project.usage.nextLimitResetDate)}{' '}
          </span>
          <FlagGuard flag={ApFlagId.SHOW_BILLING}>
            <Link to={'/platform/setup/billing'} className="w-fit">
              <span className="text-xs text-primary underline">
                {t('Manage')}
              </span>
            </Link>
          </FlagGuard>
        </div>
      </div>
    </div>
  );
});

type UsageProgressProps = {
  value: number | null;
  max: number | undefined | null;
  name: string;
  variant: 'success' | 'primary';
};

const UsageProgress = ({ value, max, name, variant }: UsageProgressProps) => {
  const isUnlimited = isNil(max);
  const usagePercentage = isUnlimited || isNil(value) ? 0 : (value / max) * 100;

  return (
    <div className="flex items-center flex-col justify-between gap-3  w-full">
      <div className="w-full flex text-xs justify-between">
        <span className="text-muted-foreground flex items-center gap-1">
          {name}
        </span>
        <div className="text-xs">
          {!isNil(value) && (
            <span>
              {formatUtils.formatNumber(value)}
              {' / '}
            </span>
          )}
          <span>
            {!isNil(max) ? formatUtils.formatNumber(max) : t('Unlimited')}
          </span>
        </div>
      </div>

      <Progress
        value={usagePercentage}
        className={cn('w-full h-[6px]', {
          'bg-primary/40': isUnlimited,
        })}
      />
    </div>
  );
};

SidebarUsageLimits.displayName = 'UsageLimitsButton';
export default SidebarUsageLimits;
