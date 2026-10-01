import { McpServerType } from '@activepieces/shared';
import { t } from 'i18next';

import { mcpHooks } from '@/app/components/project-settings/mcp-server/utils/mcp-hooks';
import { Page, PageHeader } from '@/components/custom/page';
import { PageTabs } from '@/components/custom/page-tabs';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import { ActivityTab } from './activity/activity-tab';
import { ConnectTab } from './connect/connect-tab';
import { GrantsTab } from './grants/grants-tab';
import { McpTab, useMcpNav } from './mcp-nav';
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
      <PageHeader
        title={t('MCP server')}
        description={t('One link for every AI client you use.')}
      />
      <PageTabs
        tabs={[
          TABS.map((tab) => ({
            to: `/mcp-server/${tab.value}`,
            label: t(tab.label),
            active: nav.tab === tab.value,
          })),
        ]}
      />
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

const TABS: { value: McpTab; label: string }[] = [
  { value: 'connect', label: 'Connect' },
  { value: 'tools', label: 'Tools' },
  { value: 'connections', label: 'Connections' },
  { value: 'activity', label: 'Activity' },
];
