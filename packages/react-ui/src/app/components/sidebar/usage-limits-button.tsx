import dayjs from 'dayjs';
import { t } from 'i18next';
import { ClipboardCheck, Sparkles } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { Progress } from '@/components/ui/progress-circle';
import { Separator } from '@/components/ui/separator';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { formatUtils } from '@/lib/utils';
import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';

import { FlagGuard } from '../flag-guard';

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
  const { project } = projectHooks.useCurrentProject();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  if (edition === ApEdition.COMMUNITY) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 w-full px-2">
      <Separator className="my-1" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-3">
            <UsageProgress
              name={t('Tasks')}
              value={project.usage.tasks}
              max={project.plan.tasks}
              icon={<ClipboardCheck className="w-4 h-4 mr-1" />}
            />
            <UsageProgress
              name={t('AI Credits')}
              value={project.usage.aiCredits}
              max={project.plan.aiCredits}
              icon={<Sparkles className="w-4 h-4  mr-1" />}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {project.usage.nextLimitResetDate && (
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
            )}
          </div>
        </div>
      </div>
      <Separator className="my-1" />
    </div>
  );
});

type UsageProgressProps = {
  value: number;
  max: number | undefined | null;
  name: string;
  icon: React.ReactNode;
};

const UsageProgress = ({ value, max, name, icon }: UsageProgressProps) => {
  return (
    <div className="flex items-center flex-col justify-between gap-2  w-full">
      <div className="w-full flex text-xs justify-between">
        <span className="text-muted-foreground flex items-center gap-1">
          {icon}
          {name}
        </span>
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
        <Progress value={(value / max) * 100} className="h-[6px] bg-gray-200" />
      )}
    </div>
  );
};
UsageLimitsButton.displayName = 'UsageLimitsButton';
export default UsageLimitsButton;
