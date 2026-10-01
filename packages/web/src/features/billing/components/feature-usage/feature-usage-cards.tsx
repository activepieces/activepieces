import {
  isNil,
  PlanName,
  PlatformBillingInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Coins, Folder, LucideIcon, Sparkles, Users, Zap } from 'lucide-react';

import { Meter } from '@/components/custom/stats';
import { Card } from '@/components/ui/card';

import { billingUtils } from '../../utils/billing-utils';

const HIDE_WHEN_UNLIMITED = ['active-flows', 'team-projects'];

export function FeatureUsageCards({
  platformSubscription,
}: {
  platformSubscription: PlatformBillingInformation;
}) {
  const metrics = resolveUsageMetrics(platformSubscription);
  return (
    <Card className="grid grid-cols-1 gap-x-8 gap-y-6 px-4 sm:grid-cols-2">
      {metrics.map((metric) => (
        <UsageMeter key={metric.key} metric={metric} />
      ))}
    </Card>
  );
}

function UsageMeter({ metric }: { metric: UsageMetric }) {
  const Icon = metric.icon;
  const used = metric.used.toLocaleString();
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Meter
        value={isNil(metric.included) ? 0 : metric.used}
        max={metric.included ?? 1}
        label={
          <>
            <Icon className="text-gray-11" />
            {t(metric.label)}
          </>
        }
        limit={
          isNil(metric.included)
            ? `${used} · ${t('Unlimited')}`
            : t('{current} of {total}', {
                current: used,
                total: metric.included.toLocaleString(),
              })
        }
      />
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
