import { t } from 'i18next';

import { PageHeader } from '@/components/custom/page-header';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ConnectSteps } from './connect-steps';
import { ConnectionsTab } from './connections/connections-tab';
import { useMcpServerUrl } from './mcp-client-branding';
import { McpTab, useMcpNav } from './mcp-nav';
import { PageBand } from './page-band';
import { ReachTab } from './reach/reach-tab';

export default function McpServerPage() {
  const { serverUrl, isReachableFromInternet } = useMcpServerUrl();
  const nav = useMcpNav();

  const showTab = (tab: string) => {
    switch (tab as McpTab) {
      case 'reach':
        return nav.showReach();
      case 'connections':
        return nav.showConnections();
      case 'connect':
        return nav.showLanding();
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <PageHeader showSidebarToggle={true} title={t('MCP')} />
      <div className="border-b">
        <PageBand className="px-6 lg:px-12">
          <Tabs value={nav.tab} onValueChange={showTab}>
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
            onSelectProject={nav.showProject}
          />
        ) : nav.tab === 'connections' ? (
          <ConnectionsTab />
        ) : (
          <ConnectSteps
            serverUrl={serverUrl}
            isReachableFromInternet={isReachableFromInternet}
          />
        )}
      </div>
    </div>
  );
}
