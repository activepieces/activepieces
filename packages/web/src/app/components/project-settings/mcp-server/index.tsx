import { t } from 'i18next';

import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authenticationSession } from '@/lib/authentication-session';

import { McpCredentials } from './mcp-credentials';
import { McpFlows } from './mcp-flows';
import { McpToolTierList } from './tool-tiers/mcp-tool-tier-list';
import { mcpHooks } from './utils/mcp-hooks';

export const McpServerSettings = () => {
  const currentProjectId = authenticationSession.getProjectId();
  const { data: mcpServer, isLoading } = mcpHooks.useMcpServer(
    currentProjectId!,
  );
  const { mutate: updateMcpServer } = mcpHooks.useUpdateMcpServer(
    currentProjectId!,
  );

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center py-20">
        <Spinner className="size-6 text-gray-11" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {mcpServer && (
        <Tabs defaultValue="connection">
          <TabsList>
            <TabsTrigger value="connection">{t('Connection')}</TabsTrigger>
            <TabsTrigger value="tools">{t('Tools')}</TabsTrigger>
          </TabsList>

          <TabsContent value="connection" className="pt-2" tabIndex={-1}>
            <McpCredentials />
          </TabsContent>

          <TabsContent
            value="tools"
            className="flex flex-col gap-8 pt-2"
            tabIndex={-1}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold">
                  {t('Internal tools')}
                </h3>
                <p className="text-xs text-gray-11">
                  {t(
                    'Control which built-in tools are available to agents via this MCP server.',
                  )}
                </p>
              </div>
              <McpToolTierList
                disabledTools={mcpServer.disabledTools}
                platformDisabledTools={mcpServer.platformDisabledTools}
                scope="project"
                onUpdateDisabledTools={({ tools, onSettled }) =>
                  updateMcpServer({ disabledTools: tools }, { onSettled })
                }
              />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold">{t('Your flows')}</h3>
                <p className="text-xs text-gray-11">
                  {t(
                    'Flows with the MCP Trigger are exposed as tools on this server.',
                  )}
                </p>
              </div>
              <McpFlows mcpServer={mcpServer} />
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

McpServerSettings.displayName = 'McpServerSettings';
