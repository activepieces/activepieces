import { t } from 'i18next';
import { Link } from 'react-router-dom';

import {
  AdminPage,
  AdminPageHeader,
  adminPageResources,
} from '@/app/components/admin';
import { McpToolTierList } from '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tool-tier-list';
import { ActivityFeed } from '@/app/routes/mcp-server/activity/activity-feed';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { LoadingSpinner } from '@/components/custom/spinner';
import { platformHooks } from '@/hooks/platform-hooks';

import { platformMcpHooks } from './platform-mcp-hooks';

export default function PlatformMcpPage({ section }: PlatformMcpPageProps) {
  const { platform } = platformHooks.useCurrentPlatform();
  return (
    <AdminPage width={section === 'activity' ? 'full' : 'content'}>
      <AdminPageHeader
        title={section === 'access' ? t('MCP Tools') : t('MCP Activity')}
        resources={adminPageResources.mcp}
        description={
          section === 'access' ? (
            <>
              {t(
                "Choose which tools MCP clients can use in every project and in AI Chat. Clients act with the signed-in user's permissions.",
              )}
              {platform.plan.projectRolesEnabled && (
                <>
                  {' '}
                  <Link
                    to="/platform/users/roles"
                    className="text-accent-11 underline underline-offset-4"
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
      {section === 'access' ? <AccessContent /> : <ActivityContent />}
    </AdminPage>
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
    <div className="flex flex-col">
      <ActivityFeed
        emptyStateTitle={t('No activity yet')}
        emptyStateDescription={t(
          'When an MCP client runs a piece action, it appears here.',
        )}
      />
    </div>
  );
}

type PlatformMcpSection = 'access' | 'activity';

type PlatformMcpPageProps = {
  section: PlatformMcpSection;
};
