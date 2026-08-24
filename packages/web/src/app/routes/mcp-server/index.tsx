import { t } from 'i18next';
import { useState } from 'react';

import { PageHeader } from '@/components/custom/page-header';

import { ConnectSteps } from './connect-steps';
import { ConnectedClients } from './connected-clients';
import { useMcpServerUrl } from './mcp-client-identity';

export default function McpServerPage() {
  const { serverUrl, isPublic } = useMcpServerUrl();
  const [isManagingConnections, setIsManagingConnections] = useState(false);

  return (
    <div className="flex w-full flex-col gap-2">
      <PageHeader showSidebarToggle={true} title={t('MCP')} />
      <div className="w-full">
        {isManagingConnections ? (
          <ConnectedClients onBack={() => setIsManagingConnections(false)} />
        ) : (
          <ConnectSteps
            serverUrl={serverUrl}
            isPublicUrl={isPublic}
            onManageConnections={() => setIsManagingConnections(true)}
          />
        )}
      </div>
    </div>
  );
}
