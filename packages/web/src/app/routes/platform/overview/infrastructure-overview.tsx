import { isNil } from '@activepieces/core-utils';
import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import semver from 'semver';

import { healthQueries, workersQueries } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { ADMIN_PAGES, adminPagesUtils } from '../admin-pages';

import {
  AdminOverview,
  OverviewCard,
  OverviewCards,
  OverviewRow,
  OverviewRows,
  OverviewSection,
} from './overview-shell';

export function InfrastructureOverview() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const {
    data: health,
    isLoading: isLoadingHealth,
    isError: isHealthError,
    refetch: refetchHealth,
  } = healthQueries.useSystemHealth();
  const {
    data: workers,
    isLoading: isLoadingWorkers,
    isError: isWorkersError,
    refetch: refetchWorkers,
  } = workersQueries.useWorkerMachines();
  const infrastructurePage = ADMIN_PAGES.find(
    (page) => page.id === 'infrastructure',
  );
  const showConfigurations =
    infrastructurePage !== undefined &&
    adminPagesUtils
      .visibleTabs({
        page: infrastructurePage,
        context: { plan: platform.plan, edition },
      })
      .some((tab) => tab.id === 'configurations');
  const statusError =
    isHealthError || isWorkersError
      ? {
          entity: t('infrastructure status'),
          onRetry: () => Promise.all([refetchHealth(), refetchWorkers()]),
        }
      : undefined;

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

  const workerChecksReported =
    !isNil(health?.workerRam) && !isNil(health?.workerCpu);
  const workerChecksPassed =
    health?.workerRam === true && health?.workerCpu === true;
  const needsAttention =
    !isUpToDate ||
    !appChecksPassed ||
    mismatched > 0 ||
    (workerChecksReported && !workerChecksPassed);

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
          isError={isHealthError}
          errorEntity={t('health checks')}
          description={
            health === undefined
              ? ''
              : !needsAttention
              ? t('All checks passed')
              : !isUpToDate
              ? t('Version behind latest; see release notes')
              : t('Some checks are failing')
          }
        />
        <OverviewCard
          to="/platform/infrastructure?tab=workers"
          title={t('Workers')}
          value={workerCount}
          isLoading={isLoadingWorkers}
          isError={isWorkersError}
          errorEntity={t('workers')}
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
        {showConfigurations && (
          <OverviewCard
            to="/platform/infrastructure?tab=configurations"
            title={t('Configurations')}
            value={t('Runtime')}
            description={t('Runtime settings for this instance')}
          />
        )}
      </OverviewCards>

      <OverviewSection
        title={t('Status')}
        isLoading={isLoadingHealth || isLoadingWorkers}
        error={statusError}
      >
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
            tone={
              !workerChecksReported ? 'off' : workerChecksPassed ? 'ok' : 'warn'
            }
            label={
              !workerChecksReported
                ? t('Worker hardware checks unavailable')
                : workerChecksPassed
                ? t('Workers: RAM and CPU checks passed')
                : t('Workers: one or more hardware checks failed')
            }
          />
        </OverviewRows>
      </OverviewSection>
    </AdminOverview>
  );
}
