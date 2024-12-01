import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { Metrics } from '@/app/routes/platform/analytics/metrics';
import { Reports } from '@/app/routes/platform/analytics/reports';
import { TaskUsage } from '@/app/routes/platform/analytics/task-usage';
import { Separator } from '@/components/ui/separator';
import { analyticsApi } from '@/features/platform-admin-panel/lib/analytics-api';
import { platformHooks } from '@/hooks/platform-hooks';

export default function AnalyticsPage() {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsApi.get,
    staleTime: 60 * 1000,
    enabled: platform.analyticsEnabled,
  });

  const isEnabled = platform.analyticsEnabled;
  return (
    <LockedFeatureGuard
      featureKey="ANALYTICS"
      locked={!isEnabled}
      lockTitle={t('Unlock Analytics')}
      lockDescription={t(
        'Get insights into your platform usage and performance with our analytics dashboard',
      )}
    >
      <div className="flex flex-col w-full">
        <div className="mt-8 flex gap-8 flex-col">
          <Metrics report={isLoading ? undefined : data} />
          <Separator />
          <TaskUsage report={isLoading ? undefined : data} />
          <Separator />
          <Separator />
          <Reports report={isLoading ? undefined : data} />
        </div>
      </div>
    </LockedFeatureGuard>
  );
}
