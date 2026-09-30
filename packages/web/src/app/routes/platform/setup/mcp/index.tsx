import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';

import { McpTools } from '@/app/components/project-settings/mcp-server/mcp-tools';
import { ActivityFeed } from '@/app/routes/mcp-server/activity/activity-feed';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Label } from '@/components/ui/label';
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
  const { data: mcpUrl } = flagsHooks.useFlag<string>(ApFlagId.MCP_URL);

  const header = (
    <PageHeader
      title={t('Platform MCP Server')}
      description={t(
        'Configure the platform-wide MCP server used by the AI Chat assistant and external MCP clients.',
      )}
    />
  );

  if (isLoading) {
    return (
      <Page>
        {header}
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </Page>
    );
  }

  if (isError) {
    return (
      <Page>
        {header}
        <DataFetchErrorState entity={t('the MCP server')} onRetry={refetch} />
      </Page>
    );
  }

  const serverUrl = `${(mcpUrl ?? '').replace(/\/$/, '')}/mcp/platform`;

  const jsonConfiguration = {
    mcpServers: {
      activepieces: {
        url: serverUrl,
      },
    },
  };

  return (
    <Page>
      {header}
      {mcpServer && section === 'connection' && (
        <Panel>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Label>{t('Server URL')}</Label>
              <p className="text-sm text-gray-11">
                {t(
                  'Use this URL to connect from Cursor, Windsurf, Claude Desktop, or any MCP-compatible client. Authentication is handled via OAuth.',
                )}
              </p>
              <CopyToClipboardInput textToCopy={serverUrl} useInput={true} />
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
        </Panel>
      )}

      {mcpServer && section === 'tools' && (
        <PageSection
          title={t('Internal Tools')}
          description={t(
            'Switching a tool off here switches it off everywhere on this platform: the AI Chat, external agents, and every project MCP server.',
          )}
        >
          <McpTools
            disabledTools={mcpServer.disabledTools}
            isPending={isToolsUpdating}
            onUpdateDisabledTools={(tools) =>
              updateTools({ disabledTools: tools })
            }
          />
        </PageSection>
      )}

      {mcpServer && section === 'activity' && <ActivityFeed />}
    </Page>
  );
}

type PlatformMcpSection = 'connection' | 'tools' | 'activity';

type PlatformMcpPageProps = {
  section: PlatformMcpSection;
};
