import { t } from 'i18next';

import { PageHeader } from '@/components/custom/page-header';

import { ConnectSteps } from './connect-steps';
import { ConnectedClients } from './connected-clients';
import { useMcpServerUrl } from './mcp-client-branding';
import { useMcpNav } from './mcp-nav';

export default function McpServerPage() {
  const { serverUrl, isReachableFromInternet } = useMcpServerUrl();
  const { view } = useMcpNav();

  return (
    <div className="flex w-full flex-col gap-2">
      <PageHeader showSidebarToggle={true} title={t('MCP')} />
      <div className="w-full">
        {view === 'connected' ? (
          <ConnectedClients />
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
