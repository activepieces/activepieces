import { ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import React from 'react';

import { McpTools } from '@/app/components/project-settings/mcp-server/mcp-tools';
import { ActivityFeed } from '@/app/routes/mcp-server/activity/activity-feed';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsPlatformAdmin } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';

import { platformMcpHooks } from './platform-mcp-hooks';

export default function PlatformMcpPage() {
  const {
    data: mcpServer,
    isLoading,
    isError,
    refetch,
  } = platformMcpHooks.usePlatformMcpServer();
  const { mutate: updateTools, isPending: isToolsUpdating } =
    platformMcpHooks.useUpdatePlatformMcpTools();
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const isPlatformAdmin = useIsPlatformAdmin();

  if (isLoading) {
    return (
      <McpSection
        description={t(
          'Configure the platform-wide MCP server used by the AI Chat assistant and external MCP clients.',
        )}
      >
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </McpSection>
    );
  }

  if (isError) {
    return (
      <McpSection
        description={t(
          'Configure the platform-wide MCP server used by the AI Chat assistant and external MCP clients.',
        )}
      >
        <DataFetchErrorState entity={t('the MCP server')} onRetry={refetch} />
      </McpSection>
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
    <McpSection
      description={t(
        'Configure the platform-wide MCP server used by the AI Chat assistant and external MCP clients.',
      )}
    >
      <div className="space-y-6">
        {mcpServer && (
          <Tabs defaultValue="connection">
            <TabsList>
              <TabsTrigger value="connection">{t('Connection')}</TabsTrigger>
              <TabsTrigger value="tools">{t('Tools')}</TabsTrigger>
              <TabsTrigger value="activity">{t('Activity')}</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="mt-4 pb-6" tabIndex={-1}>
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
            </TabsContent>

            <TabsContent
              value="tools"
              className="mt-4 space-y-6 pb-6"
              tabIndex={-1}
            >
              <div>
                <h3 className="font-semibold text-base mb-1">
                  {t('Internal Tools')}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t(
                    'Switching a tool off here switches it off everywhere on this platform: the AI Chat, external agents, and every project MCP server.',
                  )}
                </p>
                <McpTools
                  disabledTools={mcpServer.disabledTools}
                  canWrite={isPlatformAdmin}
                  isPending={isToolsUpdating}
                  onUpdateDisabledTools={(tools) =>
                    updateTools({ disabledTools: tools })
                  }
                />
              </div>
            </TabsContent>

            <TabsContent
              value="activity"
              className="mt-4 flex flex-col gap-2 pb-6"
              tabIndex={-1}
            >
              <ActivityFeed />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </McpSection>
  );
}

function McpSection({
  description,
  children,
}: {
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full mx-auto max-w-page-band py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">{t('Platform MCP Server')}</h1>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      <Separator className="my-4" />
      {children}
    </div>
  );
}
