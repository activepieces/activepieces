import { McpServerType } from '@activepieces/shared';
import { t } from 'i18next';
import { Navigate, useLocation, useParams } from 'react-router-dom';

import { PageTitle } from '@/app/components/page-title';
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
  const { tab } = useParams();
  const { search } = useLocation();

  if (tab !== undefined && !TABS.some((option) => option.value === tab)) {
    return <Navigate to={{ pathname: '/mcp-server', search }} replace />;
  }

  return (
    <PageTitle
      title={TABS.find((option) => option.value === nav.tab)?.title ?? ''}
    >
      <Page>
        <PageHeader
          title={t('MCP server')}
          description={t(
            'Let Claude, ChatGPT, Cursor and other AI clients build and run your flows, signed in as you.',
          )}
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
    </PageTitle>
  );
}

const TABS: { value: McpTab; label: string; title: string }[] = [
  { value: 'connect', label: 'Connect', title: 'Connect MCP' },
  { value: 'tools', label: 'Tools', title: 'MCP tools' },
  { value: 'connections', label: 'Connections', title: 'MCP connections' },
  { value: 'activity', label: 'Activity', title: 'MCP activity' },
];
