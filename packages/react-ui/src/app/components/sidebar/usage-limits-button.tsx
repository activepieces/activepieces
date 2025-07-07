import dayjs from 'dayjs';
import { t } from 'i18next';
import { ClipboardCheck, Sparkles, Clock, Rocket } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress-circle';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ManagePlanDialog } from '@/features/billing/components/manage-plan-dialog';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { cn, formatUtils } from '@/lib/utils';
import { ApSubscriptionStatus } from '@activepieces/ee-shared';
import { ApEdition, ApFlagId, isNil } from '@activepieces/shared';

import { FlagGuard } from '../flag-guard';

const getTimeUntilNextReset = (nextResetDate: number) => {
  const date = dayjs.unix(nextResetDate).toISOString();

  const now = dayjs();
  const nextReset = dayjs(date);
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

const getTrialProgress = (trialEndDate: number) => {
  const date = dayjs.unix(trialEndDate).toISOString();
  const now = dayjs();
  const trialEnd = dayjs(date);

  const trialDurationDays = 14;
  const trialStart = trialEnd.subtract(trialDurationDays, 'days');

  const totalDays = trialEnd.diff(trialStart, 'days');
  const elapsedDays = now.diff(trialStart, 'days');
  return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
};

const UsageLimitsButton = React.memo(() => {
  const [managePlanOpen, setManagePlanOpen] = useState(false);

  const { project, isPending } = projectHooks.useCurrentProject();

  const { platform } = platformHooks.useCurrentPlatform();

  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const status = platform.plan.stripeSubscriptionStatus;
  const isTrial = status === ApSubscriptionStatus.TRIALING;

  if (edition === ApEdition.COMMUNITY) {
    return null;
  }

  if (isPending || isNil(project)) {
    return (
      <div className="flex flex-col gap-2 w-full px-2">
        <Separator className="my-1.5" />
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
    <div className="flex flex-col gap-2 w-full px-2">
      <Separator className="my-1.5" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
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

          {isTrial && platform.plan.stripeSubscriptionEndDate && (
            <div className="flex flex-col gap-4">
              <TrialProgress
                trialEndDate={platform.plan.stripeSubscriptionEndDate}
              />
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => setManagePlanOpen(true)}
              >
                <Rocket className="w-4 h-4 mr-2" />
                {t('Upgrade Plan')}
              </Button>
            </div>
          )}
        </div>
        {!isTrial && (
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
      <Separator className="my-1.5" />
      <ManagePlanDialog open={managePlanOpen} setOpen={setManagePlanOpen} />
    </div>
  );
});

const TrialProgress = ({ trialEndDate }: { trialEndDate: number }) => {
  const progressPercentage = getTrialProgress(trialEndDate);

  return (
    <div className="flex items-center flex-col justify-between gap-3 w-full">
      <div className="w-full flex text-xs justify-between">
        <span className="text-muted-foreground flex items-center gap-1">
          <Clock className="w-4 h-4 mr-1" />
          {t('Trial Ends in')}
        </span>
        <div className="text-xs">
          <span className="text-orange-600 font-medium">
            {getTimeUntilNextReset(trialEndDate)}
          </span>
        </div>
      </div>
      <Progress value={progressPercentage} className="w-full h-[6px]" />
    </div>
  );
};

type UsageProgressProps = {
  value: number;
  max: number | undefined | null;
  name: string;
  icon: React.ReactNode;
};

const UsageProgress = ({ value, max, name, icon }: UsageProgressProps) => {
  const isUnlimited = isNil(max);
  const usagePercentage = isUnlimited ? 0 : (value / max) * 100;

  return (
    <div className="flex items-center flex-col justify-between gap-3  w-full">
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

      <Progress
        value={usagePercentage}
        className={cn('w-full h-[6px]', isUnlimited && 'bg-primary/40')}
      />
    </div>
  );
};

UsageLimitsButton.displayName = 'UsageLimitsButton';
export default UsageLimitsButton;
