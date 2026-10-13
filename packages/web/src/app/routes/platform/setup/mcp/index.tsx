import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useRef } from 'react';
import { Link } from 'react-router-dom';

import {
  AdminPage,
  AdminPageHeader,
  AdminQueryState,
  adminPageResources,
} from '@/app/components/admin';
import { McpToolTierList } from '@/app/components/project-settings/mcp-server/tool-tiers/mcp-tool-tier-list';
import { ActivityFeed } from '@/app/routes/mcp-server/activity/activity-feed';
import { SkeletonList } from '@/components/ui/skeleton';
import { platformHooks } from '@/hooks/platform-hooks';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { platformMcpApi } from './platform-mcp-api';
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
  const queryClient = useQueryClient();
  const undoing = useRef(false);
  const { mutate: updateTools, mutateAsync: updateToolsAsync } =
    platformMcpHooks.useUpdatePlatformMcpTools();

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError || (!isLoading && !mcpServer)}
      hasData={mcpServer !== undefined && mcpServer !== null}
      onRetry={refetch}
      entity={t('the MCP server')}
      skeleton={<SkeletonList numberOfItems={4} className="h-24 rounded-xl" />}
    >
      {mcpServer && (
        <McpToolTierList
          disabledTools={mcpServer.disabledTools}
          scope="platform"
          onUpdateDisabledTools={({ tools, onSettled }) => {
            const previous = mcpServer.disabledTools ?? [];
            const disabled = tools.filter((tool) => !previous.includes(tool));
            const enabled = previous.filter((tool) => !tools.includes(tool));
            updateTools(
              { disabledTools: tools },
              {
                onSettled,
                onSuccess: () =>
                  mutationFeedback.undo({
                    message: t('Changes saved'),
                    onUndo: async () => {
                      if (
                        undoing.current ||
                        queryClient.isMutating({
                          predicate: (mutation) =>
                            mutation.options.scope?.id === MCP_TOOLS_SCOPE,
                        }) > 0
                      ) {
                        throw mutationFeedback.userError(
                          t(
                            'Wait for the current change to finish, then undo.',
                          ),
                        );
                      }
                      undoing.current = true;
                      try {
                        const current = await platformMcpApi.get();
                        const currentTools = current.disabledTools ?? [];
                        await updateToolsAsync({
                          disabledTools: [
                            ...currentTools.filter(
                              (tool) => !disabled.includes(tool),
                            ),
                            ...enabled.filter(
                              (tool) => !currentTools.includes(tool),
                            ),
                          ],
                        });
                      } finally {
                        undoing.current = false;
                      }
                    },
                  }),
              },
            );
          }}
        />
      )}
    </AdminQueryState>
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

const MCP_TOOLS_SCOPE = 'platform-mcp-server-tools';

type PlatformMcpSection = 'access' | 'activity';

type PlatformMcpPageProps = {
  section: PlatformMcpSection;
};
