import dayjs from 'dayjs';
import { t } from 'i18next';
import { ClipboardCheck, Sparkles, CreditCard, Clock } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress-circle';
import { Separator } from '@/components/ui/separator';
import {
  billingMutations,
  billingQueries,
} from '@/features/billing/lib/billing-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { cn, formatUtils } from '@/lib/utils';
import { ApSubscriptionStatus } from '@activepieces/ee-shared';
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

const getTrialDaysRemaining = (trialEndDate: string) => {
  const now = dayjs();
  const trialEnd = dayjs(trialEndDate);
  const diffInDays = trialEnd.diff(now, 'days');
  return Math.max(0, diffInDays);
};

const getTrialProgress = (trialEndDate: string) => {
  const now = dayjs();
  const trialEnd = dayjs(trialEndDate);

  const trialDurationDays = 14;
  const trialStart = trialEnd.subtract(trialDurationDays, 'days');

  const totalDays = trialEnd.diff(trialStart, 'days');
  const elapsedDays = now.diff(trialStart, 'days');
  return Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
};

const UsageLimitsButton = React.memo(() => {
  const { project } = projectHooks.useCurrentProject();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: platformSubscription } = billingQueries.usePlatformSubscription(
    platform.id,
  );
  const { mutate: redirectToSetupSession } =
    billingMutations.useGetSetupSessionLink();

  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);

  const status = platformSubscription?.plan.stripeSubscriptionStatus;
  const isTrial = status === ApSubscriptionStatus.TRIALING;

  if (edition === ApEdition.COMMUNITY) {
    return null;
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

          {isTrial && project.usage.nextLimitResetDate && (
            <div className="flex flex-col gap-4">
              <TrialProgress trialEndDate={project.usage.nextLimitResetDate} />
              <FlagGuard flag={ApFlagId.SHOW_BILLING}>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => redirectToSetupSession()}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t('Add Payment Method')}
                </Button>
              </FlagGuard>
            </div>
          )}
        </div>
        {project.usage.nextLimitResetDate && !isTrial && (
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
    </div>
  );
});

const TrialProgress = ({ trialEndDate }: { trialEndDate: string }) => {
  const daysRemaining = getTrialDaysRemaining(trialEndDate);
  const progressPercentage = getTrialProgress(trialEndDate);

  return (
    <div className="flex items-center flex-col justify-between gap-3 w-full">
      <div className="w-full flex text-xs justify-between">
        <span className="text-muted-foreground flex items-center gap-1">
          <Clock className="w-4 h-4 mr-1" />
          {t('Free Trial')}
        </span>
        <div className="text-xs">
          <span className="text-orange-600 font-medium">
            {daysRemaining}{' '}
            {daysRemaining === 1 ? t('day left') : t('days left')}
          </span>
        </div>
      </div>
      <Progress
        value={progressPercentage}
        className="w-full h-[6px] bg-orange-100"
      />
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
