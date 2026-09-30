import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { CenteredPage } from '@/app/components/centered-page';
import { McpTools } from '@/app/components/project-settings/mcp-server/mcp-tools';
import { ActivityFeed } from '@/app/routes/mcp-server/activity/activity-feed';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { LoadingSpinner } from '@/components/custom/spinner';
import { flagsHooks } from '@/hooks/flags-hooks';

import { platformMcpHooks } from './platform-mcp-hooks';

export default function PlatformMcpPage({ section }: PlatformMcpPageProps) {
  const {
    data: mcpServer,
    isLoading,
    isError,
    refetch,
  } = platformMcpHooks.usePlatformMcpServer();
  const { mutate: updateTools, isPending: isToolsUpdating } =
    platformMcpHooks.useUpdatePlatformMcpTools();
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);

  if (isLoading) {
    return (
      <CenteredPage
        title={t('Platform MCP Server')}
        description={t(
          'Configure the platform-wide MCP server used by the AI Chat assistant and external MCP clients.',
        )}
      >
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </CenteredPage>
    );
  }

  if (isError) {
    return (
      <CenteredPage
        title={t('Platform MCP Server')}
        description={t(
          'Configure the platform-wide MCP server used by the AI Chat assistant and external MCP clients.',
        )}
      >
        <DataFetchErrorState entity={t('the MCP server')} onRetry={refetch} />
      </CenteredPage>
    );
  }

  const serverUrl = `${(publicUrl ?? '').replace(/\/$/, '')}/mcp/platform`;

  const jsonConfiguration = {
    mcpServers: {
      activepieces: {
        url: serverUrl,
      },
    },
  };

  return (
    <CenteredPage
      widthClassName="max-w-[1198px]"
      title={t('Platform MCP Server')}
      description={t(
        'Configure the platform-wide MCP server used by the AI Chat assistant and external MCP clients.',
      )}
    >
      <div className="space-y-6">
        {!mcpServer ? null : (
          <>
            {section === 'connection' && (
              <div className="pb-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium">
                      {t('Server URL')}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        'Use this URL to connect from Cursor, Windsurf, Claude Desktop, or any MCP-compatible client. Authentication is handled via OAuth.',
                      )}
                    </p>
                    <CopyToClipboardInput
                      textToCopy={serverUrl}
                      useInput={true}
                    />
                  </div>

                  <CollapsibleJson
                    json={jsonConfiguration}
                    label={t('JSON Configuration')}
                    description={t(
                      'Copy this into your MCP client config (Cursor, Windsurf, Claude Desktop, etc.).',
                    )}
                    defaultOpen={false}
                  />
                </div>
              </div>
            )}

            {section === 'tools' && (
              <div className="space-y-6 pb-6">
                <div>
                  <h3 className="font-semibold text-base mb-1">
                    {t('Internal Tools')}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t(
                      'Control which built-in tools are available to the AI Chat and external agents via the platform MCP server.',
                    )}
                  </p>
                  <McpTools
                    disabledTools={mcpServer.disabledTools}
                    isPending={isToolsUpdating}
                    onUpdateDisabledTools={(tools) =>
                      updateTools({ disabledTools: tools })
                    }
                  />
                </div>
              </div>
            )}

            {section === 'activity' && (
              <div className="flex flex-col gap-2 pb-6">
                <ActivityFeed />
              </div>
            )}
          </>
        )}
      </div>
    </CenteredPage>
  );
}

type PlatformMcpSection = 'connection' | 'tools' | 'activity';

type PlatformMcpPageProps = {
  section: PlatformMcpSection;
};
