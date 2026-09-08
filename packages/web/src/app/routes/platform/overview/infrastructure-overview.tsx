import { isNil } from '@activepieces/core-utils';
import { t } from 'i18next';
import semver from 'semver';

import { healthQueries, workersQueries } from '@/features/platform-admin';

import {
  AdminOverview,
  OverviewCard,
  OverviewCards,
  OverviewRow,
  OverviewRows,
  OverviewSection,
} from './overview-shell';

export function InfrastructureOverview() {
  const { data: health, isLoading: isLoadingHealth } =
    healthQueries.useSystemHealth();
  const { data: workers, isLoading: isLoadingWorkers } =
    workersQueries.useWorkerMachines();

  const currentVersion = health?.release?.current;
  const latestVersion = health?.latestVersion;
  const isUpToDate =
    currentVersion !== undefined &&
    latestVersion !== undefined &&
    semver.gte(currentVersion, latestVersion);
  const appChecksPassed =
    health?.disk === true && health?.appRam === true && health?.appCpu === true;
  const workerCount = workers?.length ?? 0;
  const mismatched = health?.release?.workers.versionMismatched ?? 0;

  const needsAttention = !isUpToDate || !appChecksPassed || mismatched > 0;

  return (
    <AdminOverview
      title={t('Infrastructure')}
      description={t(
        'Health of the app, workers, queues and triggers running your automations.',
      )}
    >
      <OverviewCards>
        <OverviewCard
          to="/platform/infrastructure?tab=health"
          title={t('Health')}
          value={needsAttention ? t('Attention') : t('Healthy')}
          isLoading={isLoadingHealth}
          description={
            isUpToDate
              ? t('All checks passed')
              : t('Version behind latest; see release notes')
          }
        />
        <OverviewCard
          to="/platform/infrastructure?tab=workers"
          title={t('Workers')}
          value={workerCount}
          isLoading={isLoadingWorkers}
          description={
            workerCount === 0
              ? t('No workers connected')
              : t(
                  '{count, plural, =1 {# machine} other {# machines}} connected',
                  {
                    count: workerCount,
                  },
                )
          }
        />
        <OverviewCard
          to="/platform/infrastructure?tab=triggers"
          title={t('Triggers')}
          value="—"
          description={t('Trigger health across the last 14 days')}
        />
        <OverviewCard
          to="/platform/infrastructure?tab=configurations"
          title={t('Configurations')}
          value={t('Runtime')}
          description={t('Runtime settings for this instance')}
        />
      </OverviewCards>

      <OverviewSection title={t('Status')}>
        <OverviewRows>
          <OverviewRow
            tone={isUpToDate ? 'ok' : 'error'}
            label={
              currentVersion === undefined
                ? t('Version unknown')
                : t('Version {current} · latest is {latest}', {
                    current: currentVersion,
                    latest: latestVersion ?? t('unknown'),
                  })
            }
          >
            <a
              href="https://github.com/activepieces/activepieces/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t('Release notes')}
            </a>
          </OverviewRow>
          <OverviewRow
            tone={appChecksPassed ? 'ok' : 'warn'}
            label={
              appChecksPassed
                ? t('App: disk, RAM and CPU checks passed')
                : t('App: one or more hardware checks failed')
            }
          />
          <OverviewRow
            tone={workerCount === 0 ? 'off' : mismatched > 0 ? 'warn' : 'ok'}
            label={
              workerCount === 0
                ? t('No workers connected')
                : mismatched > 0
                ? t(
                    '{count, plural, =1 {# worker is} other {# workers are}} on an incompatible version',
                    { count: mismatched },
                  )
                : t('All connected workers match the app release')
            }
          />
          <OverviewRow
            tone={isNil(health?.workerRam) ? 'off' : 'ok'}
            label={
              isNil(health?.workerRam)
                ? t('Worker hardware checks unavailable')
                : t('Workers: RAM and CPU checks passed')
            }
          />
        </OverviewRows>
      </OverviewSection>
    </AdminOverview>
  );
}
