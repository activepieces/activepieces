import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { McpToolTierList } from '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tool-tier-list';
import { ActivityFeed } from '@/app/routes/mcp-server/activity/activity-feed';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Page, PageHeader } from '@/components/custom/page';
import { LoadingSpinner } from '@/components/custom/spinner';
import { platformHooks } from '@/hooks/platform-hooks';

import { platformMcpHooks } from './platform-mcp-hooks';

export default function PlatformMcpPage({ section }: PlatformMcpPageProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const isAccess = section === 'access';
  return (
    <Page width={isAccess ? 'narrow' : 'full'}>
      <PageHeader
        title={isAccess ? t('MCP Tools') : t('MCP Activity')}
        description={
          isAccess ? (
            <>
              {t(
                "Choose which tools MCP clients can use in every project and in AI Chat. Clients act with the signed-in user's permissions.",
              )}
              {platform.plan.projectRolesEnabled && (
                <>
                  {' '}
                  <Link
                    to="/platform/users/roles"
                    className="text-accent-11 underline-offset-4 hover:underline"
                  >
                    {t('Manage roles')}
                  </Link>
                </>
              )}
            </>
          ) : (
            t(
              'Piece actions run by MCP clients, like Claude and Cursor. Other tool calls are not logged.',
            )
          )
        }
      />
      {isAccess ? <AccessContent /> : <ActivityContent />}
    </Page>
  );
}

function AccessContent() {
  const {
    data: mcpServer,
    isLoading,
    isError,
    refetch,
  } = platformMcpHooks.usePlatformMcpServer();
  const { mutate: updateTools } = platformMcpHooks.useUpdatePlatformMcpTools();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError || !mcpServer) {
    return (
      <DataFetchErrorState entity={t('the MCP server')} onRetry={refetch} />
    );
  }

  return (
    <McpToolTierList
      disabledTools={mcpServer.disabledTools}
      scope="platform"
      onUpdateDisabledTools={({ tools, onSettled }) =>
        updateTools({ disabledTools: tools }, { onSettled })
      }
    />
  );
}

function ActivityContent() {
  return (
    <ActivityFeed
      emptyStateTitle={t('No activity yet')}
      emptyStateDescription={t(
        'When an MCP client runs a piece action, it appears here.',
      )}
    />
  );
}

type PlatformMcpSection = 'access' | 'activity';

type PlatformMcpPageProps = {
  section: PlatformMcpSection;
};
