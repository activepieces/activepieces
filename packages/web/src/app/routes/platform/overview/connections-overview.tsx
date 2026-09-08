import { AppConnectionStatus } from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';

import { globalConnectionsQueries } from '@/features/connections';
import { platformAppConnectionsApi } from '@/features/platform-admin/api/platform-app-connections-api';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';

import {
  AdminOverview,
  OverviewCard,
  OverviewCards,
  OverviewEmpty,
  OverviewRow,
  OverviewRows,
  OverviewSection,
} from './overview-shell';

export function ConnectionsOverview() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: connections, isLoading } = useQuery({
    queryKey: ['platform-app-connections', 'overview'],
    queryFn: () => platformAppConnectionsApi.list({ limit: 1000 }),
  });
  const { data: globalConnections, isLoading: isLoadingGlobal } =
    globalConnectionsQueries.useGlobalConnections({
      request: { limit: 1000 },
      extraKeys: ['overview'],
    });
  const { data: projects } = projectCollectionUtils.useAllPlatformProjects();

  const rows = connections?.data ?? [];
  const unhealthy = rows.filter(
    (connection) => connection.status === AppConnectionStatus.ERROR,
  );
  const byPiece = rows.reduce<Record<string, number>>(
    (counts, connection) => ({
      ...counts,
      [connection.pieceName]: (counts[connection.pieceName] ?? 0) + 1,
    }),
    {},
  );
  const topPieces: [string, number][] = Object.entries(byPiece)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);

  return (
    <AdminOverview
      title={t('Connections')}
      description={t(
        'Every app credential in use across the platform, whether owned by a project or shared globally.',
      )}
    >
      <OverviewCards>
        <OverviewCard
          to="/platform/connections?tab=project"
          title={t('Project connections')}
          value={rows.length}
          isLoading={isLoading}
          description={t(
            'Across {count, plural, =1 {# project} other {# projects}}',
            { count: projects?.length ?? 0 },
          )}
        />
        <OverviewCard
          to="/platform/connections?tab=global"
          title={t('Global connections')}
          tier="team"
          value={
            platform.plan.globalConnectionsEnabled
              ? globalConnections?.data.length ?? 0
              : t('Locked')
          }
          isLoading={isLoadingGlobal}
          description={t('Shared credentials available to multiple projects')}
        />
      </OverviewCards>

      <OverviewSection
        title={t('Needs attention')}
        description={t(
          'Connections across every project that are expired, revoked or failing.',
        )}
      >
        {unhealthy.length === 0 ? (
          <OverviewEmpty>{t('All connections are healthy')}</OverviewEmpty>
        ) : (
          <OverviewRows>
            {unhealthy.map((connection) => (
              <OverviewRow
                key={connection.id}
                tone="error"
                label={connection.displayName}
              >
                {connection.pieceName}
              </OverviewRow>
            ))}
          </OverviewRows>
        )}
      </OverviewSection>

      <OverviewSection
        title={t('Most used pieces')}
        description={t('Which apps your projects connect to most.')}
      >
        {topPieces.length === 0 ? (
          <OverviewEmpty>{t('No connections yet')}</OverviewEmpty>
        ) : (
          <OverviewRows>
            {topPieces.map(([pieceName, count]) => (
              <OverviewRow key={pieceName} tone="ok" label={pieceName}>
                {t('{count, plural, =1 {# connection} other {# connections}}', {
                  count,
                })}
              </OverviewRow>
            ))}
          </OverviewRows>
        )}
      </OverviewSection>
    </AdminOverview>
  );
}
