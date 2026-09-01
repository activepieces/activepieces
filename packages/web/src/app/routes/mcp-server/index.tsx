import { t } from 'i18next';

import { PageHeader } from '@/components/custom/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import { ConnectTab } from './connect/connect-tab';
import { GrantsTab } from './grants/grants-tab';
import { useMcpNav } from './mcp-nav';
import { useMcpServerUrl } from './mcp-server-url';
import { PageBand } from './page-band';
import { ReachTab } from './reach/reach-tab';

export default function McpServerPage() {
  const { serverUrl, isReachableFromInternet } = useMcpServerUrl();
  const nav = useMcpNav();
  piecesHooks.usePrefetchPieces({ skipProjectFilter: true });

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
              <TabsTrigger variant="outline" value="reach">
                {t('Reach')}
              </TabsTrigger>
              <TabsTrigger variant="outline" value="connections">
                {t('Connections')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </PageBand>
      </div>
      <div className="w-full">
        {nav.tab === 'reach' ? (
          <ReachTab
            projectId={nav.projectId}
            onSelectProject={nav.selectProject}
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
