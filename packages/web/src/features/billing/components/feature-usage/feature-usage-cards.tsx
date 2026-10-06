import {
  isNil,
  PlanName,
  PlatformBillingInformation,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

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
  const used = metric.used.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
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
      {!isNil(metric.over) && (
        <span className="text-xs text-gray-11">
          {metric.over.message}{' '}
          {metric.over.link && (
            <Link
              to={metric.over.link.to}
              className="font-medium text-accent-11 underline-offset-4 hover:underline"
            >
              {metric.over.link.label}
            </Link>
          )}
        </span>
      )}
    </div>
  );
}

function overLimit({
  key,
  used,
  included,
}: Pick<UsageMetric, 'key' | 'used' | 'included'>): OverLimit | undefined {
  if (isNil(included) || used <= included) {
    return undefined;
  }
  switch (key) {
    case 'users':
      return {
        message: t(
          '{count, plural, =1 {1 user over the limit.} other {# users over the limit.}} Deactivate people who no longer need access, or add seats.',
          { count: used - included },
        ),
        link: { to: '/platform/users', label: t('Manage users') },
      };
    case 'team-projects':
      return {
        message:
          included === 0
            ? t(
                "Your plan doesn't include team projects. Existing ones keep working, but you can't add more.",
              )
            : t(
                "Over the limit. Existing projects keep working, but you can't add more.",
              ),
        link: { to: '/platform/projects', label: t('Manage projects') },
      };
    case 'active-flows':
      return {
        message: t('Over the limit. Turn off flows you no longer need.'),
      };
    default:
      return undefined;
  }
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
  return metrics
    .filter(
      (metric) =>
        !(HIDE_WHEN_UNLIMITED.includes(metric.key) && isNil(metric.included)),
    )
    .map((metric) => ({ ...metric, over: overLimit(metric) }));
}

type UsageMetric = {
  key: string;
  label: string;
  used: number;
  included: number | null;
  note?: string;
  over?: OverLimit;
};

type OverLimit = {
  message: string;
  link?: { to: string; label: string };
};
