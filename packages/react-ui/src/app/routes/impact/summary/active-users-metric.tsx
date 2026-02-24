import { t } from 'i18next';
import { Users } from 'lucide-react';

import { PlatformAnalyticsReport, UserStatus } from '@activepieces/shared';

import { MetricCard, MetricCardSkeleton } from './metric-card';

type ActiveUsersMetricProps = {
  report?: PlatformAnalyticsReport;
};

export const ActiveUsersMetric = ({ report }: ActiveUsersMetricProps) => {
  if (!report) {
    return <MetricCardSkeleton />;
  }

  const activeUsers = report.users.filter(
    (user) => user.status === UserStatus.ACTIVE,
  ).length;
  const totalUsers = report.users.length;

  const adoptionRate =
    totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;

  return (
    <MetricCard
      icon={Users}
      title={t('Active Users')}
      value={activeUsers.toLocaleString()}
      description={t(
        'Team members actively using automations in the last 30 days. Higher adoption means greater ROI on your automation investment.',
      )}
      subtitle={t('{rate}% adoption rate ({total} total users)', {
        rate: adoptionRate,
        total: totalUsers.toLocaleString(),
      })}
      iconColor="text-indigo-600"
    />
  );
};
