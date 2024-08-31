import { t } from 'i18next';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { platformHooks } from '@/hooks/platform-hooks';
import { Metrics } from '@/app/routes/platform/analytics/metrics';
import { TaskUsage } from '@/app/routes/platform/analytics/task-usage';
import { Reports } from '@/app/routes/platform/analytics/reports';
import { analyticsApi } from '@/features/platform-admin-panel/lib/analytics-api';
import { useQuery } from '@tanstack/react-query';
import { Separator } from '@/components/ui/seperator';

export default function AnalyticsPage() {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsApi.get,  
    staleTime: 60 * 1000,
  });

  const isEnabled = platform.analyticsEnabled;

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="text-xl font-semibold">{t('Hold on, this may take a little longer')}</span>
      </div>
    );
  }

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
        <div className="flex items-center justify-between flex-row">
          <span className="text-3xl font-bold">{t('Platform Overview')}</span>
        </div>
        <div className="mt-8 flex gap-8 flex-col">
          <Metrics report={data} />
          <Separator/>
          <TaskUsage report={data} />
          <Separator/>
          <Reports report={data} />
        </div>
      </div>
    </LockedFeatureGuard>
  );
}
