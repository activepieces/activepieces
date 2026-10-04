import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { McpToolTierList } from '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tool-tier-list';
import { ActivityFeed } from '@/app/routes/mcp-server/activity/activity-feed';
import { AdminTabs } from '@/app/routes/platform/admin-tabs';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Page, PageHeader } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { Skeleton } from '@/components/ui/skeleton';
import { platformHooks } from '@/hooks/platform-hooks';

import { platformMcpHooks } from './platform-mcp-hooks';

export default function PlatformMcpPage({ section }: PlatformMcpPageProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  const isAccess = section === 'access';
  return (
    <Page>
      <PageHeader
        title={t('MCP server')}
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
      <AdminTabs section="mcp" />
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

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : isError || !mcpServer ? (
        <Panel flush>
          <DataFetchErrorState entity={t('the MCP server')} onRetry={refetch} />
        </Panel>
      ) : (
        <McpToolTierList
          disabledTools={mcpServer.disabledTools}
          scope="platform"
          onUpdateDisabledTools={({ tools, onSettled }) =>
            updateTools({ disabledTools: tools }, { onSettled })
          }
        />
      )}
    </div>
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
