import {
  isNil,
  PlanName,
  PlatformBillingInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Coins, Folder, LucideIcon, Sparkles, Users, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Progress,
  usageIndicatorClass,
  usageTrackClass,
} from '@/components/ui/progress';

import { billingUtils } from '../../utils/billing-utils';

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
  const percent = billingUtils.percentUsed({
    used: metric.used,
    total: metric.included,
  });

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-gray-3/30 p-5">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md border bg-gray-1 text-gray-11">
          <Icon className="size-4" />
        </span>
        <span className="text-sm font-medium text-gray-12">
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
          <span className="text-xs text-gray-11">{t('Used')}</span>
          <span className="text-2xl font-semibold text-gray-12">
            {metric.used.toLocaleString()}
          </span>
        </div>
        {!isUnlimited && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-11">{t('Limit')}</span>
            <span className="text-2xl font-semibold text-gray-12">
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
          <div className="flex items-center text-xs text-gray-11">
            <span>{t('{percent}% used', { percent })}</span>
          </div>
        </div>
      )}

      {!isNil(metric.note) && (
        <span className="text-xs text-gray-11">{metric.note}</span>
      )}
    </div>
  );
}

function resolveUsageMetrics(info: PlatformBillingInformation): UsageMetric[] {
  const { plan, usage } = info;
  const { capBinds: usersCapBinds, effectiveLimit: usersLimit } =
    billingUtils.resolveSeatCap(info);
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
      included: usersLimit,
      note: usersCapBinds ? billingUtils.scheduledCapNotice(info) : undefined,
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
      included: plan.billedTeamProjectsLimit ?? null,
    },
  ];
  if (!isNil(usage.appSumoAiCreditsUsed)) {
    metrics.push({
      key: 'appsumo-ai-credits',
      label:
        plan.plan === PlanName.APPSUMO ? 'AppSumo AI Credits' : 'AI Credits',
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
