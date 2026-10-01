import { McpServerType } from '@activepieces/shared';
import { t } from 'i18next';

import { mcpHooks } from '@/app/components/project-settings/mcp-server/utils/mcp-hooks';
import { Page, PageHeader } from '@/components/custom/page';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import { ActivityTab } from './activity/activity-tab';
import { ConnectTab } from './connect/connect-tab';
import { GrantsTab } from './grants/grants-tab';
import { useMcpNav } from './mcp-nav';
import { useMcpServerUrl } from './mcp-server-url';
import { ToolsTab } from './tools/tools-tab';

export default function McpServerPage() {
  const { serverUrl, isReachableFromInternet } = useMcpServerUrl({
    serverType: McpServerType.PLATFORM,
  });
  const nav = useMcpNav();
  const { projectIds: reachableProjectIds } = mcpHooks.useMcpReach();
  piecesHooks.usePrefetchPieces({ skipProjectFilter: true });

  return (
    <Page>
      <PageHeader title={t('MCP')} />
      <Tabs value={nav.tab} onValueChange={nav.showTab}>
        <TabsList variant="line" className="w-full justify-start border-b">
          <TabsTrigger value="connect" className="flex-none">
            {t('Connect')}
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex-none">
            {t('Tools')}
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex-none">
            {t('Connections')}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-none">
            {t('Activity')}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {nav.tab === 'tools' ? (
        <ToolsTab
          projectId={nav.projectId}
          reachableProjectIds={reachableProjectIds}
          segment={nav.segment}
          onSelectProject={nav.selectProject}
          onSelectSegment={nav.selectSegment}
        />
      ) : nav.tab === 'connections' ? (
        <GrantsTab />
      ) : nav.tab === 'activity' ? (
        <ActivityTab />
      ) : (
        <ConnectTab
          serverUrl={serverUrl}
          isReachableFromInternet={isReachableFromInternet}
        />
      )}
    </Page>
  );
}
