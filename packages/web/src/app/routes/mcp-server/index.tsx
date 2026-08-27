import { t } from 'i18next';

import { PageHeader } from '@/components/custom/page-header';

import { ConnectTab } from './connect/connect-tab';
import { useMcpServerUrl } from './mcp-server-url';

export default function McpServerPage() {
  const { serverUrl, isReachableFromInternet } = useMcpServerUrl();

  return (
    <div className="flex min-h-full w-full flex-col gap-2">
      <PageHeader title={t('MCP')} />
      <ConnectTab
        serverUrl={serverUrl}
        isReachableFromInternet={isReachableFromInternet}
      />
    </div>
  );
}
