import dayjs from 'dayjs';
import { t } from 'i18next';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { Progress } from '@/components/ui/progress-circle';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { formatUtils } from '@/lib/utils';
import { ApFlagId, isNil } from '@activepieces/shared';

import { FlagGuard } from './flag-guard';

const getTimeUntilNextReset = (nextResetDate: string) => {
  const now = dayjs();
  const nextReset = dayjs(nextResetDate);
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

const UsageLimitsButton = React.memo(() => {
  const { project, refetch } = projectHooks.useCurrentProject();
  const { data: flagValue } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_BILLING,
  );
  useEffect(() => {
    return () => {
      refetch();
    };
  }, [refetch]);
  //for ce edition, we don't have plan and usage
  if (isNil(project?.plan?.tasks) || isNil(project?.usage?.tasks)) {
    return null;
  }

  const usageCardComponent = () => {
    return (
      <div className="flex flex-col gap-2 w-full py-1 px-2">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-3">
              <UsageProgress
                name={t('Tasks')}
                value={project.usage.tasks}
                max={project.plan.tasks}
              />
              <UsageProgress
                name={t('AI Credits')}
                value={project.usage.aiTokens}
                max={project.plan.aiTokens}
              />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {project.usage.nextLimitResetDate && (
                <div className="text-xs text-muted-foreground ">
                  {t('Usage resets in')}{' '}
                  {getTimeUntilNextReset(project.usage.nextLimitResetDate)}{' '}
                </div>
              )}
            </div>
            <FlagGuard flag={ApFlagId.SHOW_BILLING}>
              <Link to={'/platform/setup/billing'} className="w-fit">
                <span className="text-xs text-primary underline">
                  {t('Manage plan')}
                </span>
              </Link>
            </FlagGuard>
          </div>
        </div>
      </div>
    );
  };
  return (
    <>
      {flagValue && (
        <Link to={'/platform/setup/billing'} className="w-full cursor-pointer">
          {usageCardComponent()}
        </Link>
      )}
      {!flagValue && usageCardComponent()}
    </>
  );
});

type UsageProgressProps = {
  value: number;
  max: number | undefined | null;
  name: string;
};

const UsageProgress = ({ value, max, name }: UsageProgressProps) => {
  return (
    <div className="flex items-center flex-col justify-between gap-2  w-full">
      <div className="w-full flex text-xs justify-between">
        <span className="text-muted-foreground">{name}</span>
        <div className="text-xs">
          <span>
            {formatUtils.formatNumber(value)}
            {' / '}
          </span>
          <span>
            {!isNil(max) ? formatUtils.formatNumber(max) : t('Unlimited')}
          </span>
        </div>
      </div>
      {!isNil(max) && (
        <Progress value={(value / max) * 100} className="h-[6px]" />
      )}
    </div>
  );
};
UsageLimitsButton.displayName = 'UsageLimitsButton';
export default UsageLimitsButton;
