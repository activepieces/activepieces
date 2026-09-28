import { PlatformAnalyticsReport, UserStatus } from '@activepieces/shared';
import { UserMultipleIcon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';

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
      icon={UserMultipleIcon}
      title={t('Active Users')}
      value={activeUsers.toLocaleString()}
      description={t('Users actively using the platform')}
      subtitle={t('{rate}% adoption rate ({total} total users)', {
        rate: adoptionRate,
        total: totalUsers.toLocaleString(),
      })}
      iconColor="text-swatch-6-mark"
      iconBgColor="bg-swatch-6-surface"
    />
  );
};
