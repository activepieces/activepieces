import dayjs from 'dayjs';
import { t } from 'i18next';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ProgressCircularComponent } from '@/components/custom/circular-progress';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress-circle';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectHooks } from '@/hooks/project-hooks';
import { formatUtils } from '@/lib/utils';
import { ApFlagId, isNil } from '@activepieces/shared';

import { FlagGuard } from './flag-guard';
import { BarChartBig } from 'lucide-react';
import { flagsHooks } from '@/hooks/flags-hooks';

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
  const { data: flagValue } = flagsHooks.useFlag<boolean>(ApFlagId.SHOW_BILLING);
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
    <div className='flex flex-col gap-2 w-full bg-white rounded-lg shadow-md p-4'>
       <div className="flex flex-col gap-3">
          <div className='flex gap-2 justify-between'>
            <div className='flex items-center gap-2'>
              <BarChartBig className='size-4' />
              <span className='text-sm font-bold'>{t('Usage')}</span>
            </div>
            <div className='flex items-center gap-2'>
              {project.usage.nextLimitResetDate && (
                <div className="text-xs flex justify-end ">
                  {t('Resets in')}{' '}
                  {getTimeUntilNextReset(project.usage.nextLimitResetDate)}{' '}
                </div>
              )}
            </div>
          </div>
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
  )
  }
  return (
    <>
      {flagValue && (
        <Link  to={'/platform/setup/billing'} className='w-full cursor-pointer' >
          {usageCardComponent()}
        </Link>
      )}
      {!flagValue && (
        usageCardComponent()
      )}
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
    <div className="flex items-center flex-col justify-between gap-0.5  w-full">
      <Progress value={30} className="h-[7px]" />
      {/* {!isNil(max) && (
        <Progress value={(value / max) * 100} className="h-[5px]" />
      )} */}
      <div className="w-full flex text-sm justify-between">
        <span>{name}</span>
        <div className='text-sm'>
          <span className='text-muted-foreground'>{t('Used')}: {formatUtils.formatNumber(value)}{' / '}</span> 
          <span className='font-bold'>{!isNil(max) ? formatUtils.formatNumber(max) : t('Unlimited')}
          </span>
        </div>
      </div>

    </div>
  );
};
UsageLimitsButton.displayName = 'UsageLimitsButton';
export default UsageLimitsButton;
