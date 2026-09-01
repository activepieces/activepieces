import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import { ConnectTab } from './connect/connect-tab';
import { useMcpServerUrl } from './mcp-server-url';

export default function McpServerPage() {
  const { serverUrl, isReachableFromInternet } = useMcpServerUrl();
  piecesHooks.usePrefetchPieces({ skipProjectFilter: true });

  return (
    <div className="flex min-h-full w-full flex-col">
      <ConnectTab
        serverUrl={serverUrl}
        isReachableFromInternet={isReachableFromInternet}
      />
    </div>
  );
}
