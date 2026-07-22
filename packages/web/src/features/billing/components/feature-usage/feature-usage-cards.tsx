import { isNil, PlatformBillingInformation } from '@activepieces/shared';
import dayjs from 'dayjs';
import { t } from 'i18next';
import { Coins, Folder, LucideIcon, Sparkles, Users, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Progress,
  usageIndicatorClass,
  usageTrackClass,
} from '@/components/ui/progress';

const HIDE_WHEN_UNLIMITED = ['active-flows', 'team-projects'];

export function FeatureUsageCards({
  platformSubscription,
}: {
  platformSubscription: PlatformBillingInformation;
}) {
  const metrics = resolveUsageMetrics(platformSubscription);
  return (
    <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
      {metrics.map((metric) => (
        <UsageMetricCard key={metric.key} metric={metric} />
      ))}
    </div>
  );
}

function UsageMetricCard({ metric }: { metric: UsageMetric }) {
  const Icon = metric.icon;
  const isUnlimited = isNil(metric.included);
  const percent =
    isUnlimited || metric.included! <= 0
      ? 0
      : Math.min(100, Math.round((metric.used / metric.included!) * 100));

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-muted/30 p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md border bg-background text-muted-foreground">
          <Icon className="size-4" />
        </span>
        <span className="text-sm font-medium text-foreground">
          {t(metric.label)}
        </span>
        {isUnlimited && (
          <Badge variant="secondary" className="rounded-sm font-normal">
            {t('Unlimited')}
          </Badge>
        )}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{t('Used')}</span>
          <span className="text-2xl font-semibold text-foreground">
            {metric.used.toLocaleString()}
          </span>
        </div>
        {!isUnlimited && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground">{t('Limit')}</span>
            <span className="text-2xl font-semibold text-foreground">
              {metric.included!.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {!isUnlimited && (
        <div className="flex flex-col gap-1.5">
          <Progress
            value={percent}
            className={usageTrackClass(percent / 100)}
            indicatorClassName={usageIndicatorClass(percent / 100)}
          />
          <div className="flex items-center text-xs text-muted-foreground">
            <span>{t('{percent}% used', { percent })}</span>
          </div>
        </div>
      )}

      {!isNil(metric.note) && (
        <span className="text-xs text-muted-foreground">{metric.note}</span>
      )}
    </div>
  );
}

function resolveUsageMetrics(info: PlatformBillingInformation): UsageMetric[] {
  const { plan, usage } = info;
  const scheduledCap = plan.scheduledUsersLimit;
  const usersCapBinds =
    !isNil(scheduledCap) &&
    (isNil(plan.usersLimit) || scheduledCap < plan.usersLimit);
  const metrics: UsageMetric[] = [
    {
      key: 'credits',
      label: 'Credits',
      icon: Coins,
      used: usage.creditsUsed,
      included: plan.includedCredits > 0 ? plan.includedCredits : null,
    },
    {
      key: 'users',
      label: 'Users',
      icon: Users,
      used: usage.users,
      included: usersCapBinds ? scheduledCap : plan.usersLimit ?? null,
      note: usersCapBinds
        ? t(
            "You're downgrading to the {plan} plan on {date} — the seat limit shown comes from your scheduled plan.",
            {
              plan: info.scheduledPlanName ?? t('Free'),
              date: dayjs(info.cancelAt).format('MMM D, YYYY'),
            },
          )
        : undefined,
    },
    {
      key: 'active-flows',
      label: 'Active Flows',
      icon: Zap,
      used: usage.activeFlows,
      included: plan.activeFlowsLimit ?? null,
    },
    {
      key: 'team-projects',
      label: 'Team Projects',
      icon: Folder,
      used: usage.teamProjects,
      included: plan.teamProjectsLimit ?? null,
    },
  ];
  if (!isNil(usage.appSumoAiCreditsUsed)) {
    metrics.push({
      key: 'appsumo-ai-credits',
      label: 'AppSumo AI Credits',
      icon: Sparkles,
      used: usage.appSumoAiCreditsUsed,
      included:
        usage.appSumoAiCreditsUsed + (usage.appSumoAiCreditsRemaining ?? 0),
    });
  }
  return metrics.filter(
    (metric) =>
      !(HIDE_WHEN_UNLIMITED.includes(metric.key) && isNil(metric.included)),
  );
}

type UsageMetric = {
  key: string;
  label: string;
  icon: LucideIcon;
  used: number;
  included: number | null;
  note?: string;
};
