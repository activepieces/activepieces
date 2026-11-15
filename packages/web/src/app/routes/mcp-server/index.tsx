import { McpServerType } from '@activepieces/shared';
import { t } from 'i18next';
import { Navigate, useParams } from 'react-router-dom';

import { mcpHooks } from '@/app/components/project-settings/mcp-server/utils/mcp-hooks';
import { PageHeader } from '@/components/custom/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import { ConnectTab } from './connect/connect-tab';
import { GrantsTab } from './grants/grants-tab';
import { useMcpNav } from './mcp-nav';
import { useMcpServerUrl } from './mcp-server-url';
import { PageBand } from './page-band';
import { ToolsTab } from './tools/tools-tab';

export default function McpServerPage() {
  const { serverUrl, isReachableFromInternet } = useMcpServerUrl({
    serverType: McpServerType.PLATFORM,
  });
  const nav = useMcpNav();
  const { tab } = useParams();
  const { projectIds: reachableProjectIds } = mcpHooks.useMcpReach();
  piecesHooks.usePrefetchPieces({ skipProjectFilter: true });

  if (tab !== undefined && tab !== nav.tab) {
    return <Navigate to="/mcp-server" replace />;
  }

  return (
    <div className="flex min-h-full w-full flex-col gap-2">
      <PageHeader title={t('MCP')} />
      <div className="border-b">
        <PageBand>
          <Tabs value={nav.tab} onValueChange={nav.showTab}>
            <TabsList variant="outline">
              <TabsTrigger variant="outline" value="connect">
                {t('Connect')}
              </TabsTrigger>
              <TabsTrigger variant="outline" value="tools">
                {t('Tools')}
              </TabsTrigger>
              <TabsTrigger variant="outline" value="connections">
                {t('Connections')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </PageBand>
      </div>
      <div className="w-full">
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
        ) : (
          <ConnectTab
            serverUrl={serverUrl}
            isReachableFromInternet={isReachableFromInternet}
          />
        )}
      </div>
    </div>
  );
}
