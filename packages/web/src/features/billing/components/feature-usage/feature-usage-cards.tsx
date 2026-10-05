import {
  isNil,
  PlanName,
  PlatformBillingInformation,
} from '@activepieces/shared';
import { t } from 'i18next';

import { Panel } from '@/components/custom/panel';
import { Meter } from '@/components/custom/stats';

import { billingUtils } from '../../utils/billing-utils';

const HIDE_WHEN_UNLIMITED = ['active-flows', 'team-projects'];

export function FeatureUsageCards({
  platformSubscription,
}: {
  platformSubscription: PlatformBillingInformation;
}) {
  const metrics = resolveUsageMetrics(platformSubscription);
  return (
    <Panel>
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
        {metrics.map((metric) => (
          <UsageMeter key={metric.key} metric={metric} />
        ))}
      </div>
    </Panel>
  );
}

function UsageMeter({ metric }: { metric: UsageMetric }) {
  const used = metric.used.toLocaleString();
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Meter
        value={isNil(metric.included) ? 0 : metric.used}
        max={metric.included ?? 1}
        label={
          <span>
            <span className="font-medium tabular-nums">{used}</span>{' '}
            {t(metric.label)}
          </span>
        }
        limit={
          isNil(metric.included)
            ? t('No limit on this plan')
            : t('of {total}', { total: metric.included.toLocaleString() })
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
      label: 'credits used',
      used: usage.creditsUsed,
      included: plan.includedCredits > 0 ? plan.includedCredits : null,
    },
    {
      key: 'users',
      label: 'users',
      used: usage.users,
      included: usersLimit,
      note: usersCapBinds ? billingUtils.scheduledCapNotice(info) : undefined,
    },
    {
      key: 'active-flows',
      label: 'active flows',
      used: usage.activeFlows,
      included: plan.activeFlowsLimit ?? null,
    },
    {
      key: 'team-projects',
      label: 'team projects',
      used: usage.teamProjects,
      included: plan.billedTeamProjectsLimit ?? null,
    },
  ];
  if (!isNil(usage.appSumoAiCreditsUsed)) {
    metrics.push({
      key: 'appsumo-ai-credits',
      label:
        plan.plan === PlanName.APPSUMO
          ? 'AppSumo AI credits used'
          : 'AI credits used',
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
  used: number;
  included: number | null;
  note?: string;
};
