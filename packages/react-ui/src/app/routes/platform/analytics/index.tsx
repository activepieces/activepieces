import { t } from 'i18next';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { platformHooks } from '@/hooks/platform-hooks';
import { Metrics } from '@/app/routes/platform/analytics/metrics';
import { TaskUsage } from '@/app/routes/platform/analytics/task-usage';
import { Reports } from '@/app/routes/platform/analytics/reports';

export default function AnalyticsPage() {
  const { platform } = platformHooks.useCurrentPlatform();

  const isEnabled = platform.manageProjectsEnabled;
  return (
    <LockedFeatureGuard
      featureKey="PROJECTS"
      locked={!isEnabled}
      lockTitle={t('Unlock Projects')}
      lockDescription={t(
        'Orchestrate your automation teams across projects with their own flows, connections and usage quotas',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/projects.mp4"
    >
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between flex-row">
          <span className="text-3xl font-bold">{t('Analytics')}</span>
        </div>
        <div className="mt-8 flex gap-8 flex-col">
          <Metrics />
          <TaskUsage />
          <div>
            <h2 className="text-2xl font-semibold mb-4">{t('Reports')}</h2>
            <Reports />
          </div>
        </div>
      </div>
    </LockedFeatureGuard>
  );
}
