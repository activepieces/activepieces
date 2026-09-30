import { ApFlagId, McpServerType } from '@activepieces/shared';

import { flagsHooks } from '@/hooks/flags-hooks';
import { formatUtils } from '@/lib/format-utils';

export function useMcpServerUrl({
  serverType,
}: {
  serverType: McpServerType;
}): {
  serverUrl: string;
  isReachableFromInternet: boolean;
} {
  const { data: mcpUrl } = flagsHooks.useFlag<string>(ApFlagId.MCP_URL);
  const base = (mcpUrl ?? '').replace(/\/$/, '');
  const path = serverType === McpServerType.PLATFORM ? '/mcp/platform' : '/mcp';
  return {
    serverUrl: `${base}${path}`,
    isReachableFromInternet: formatUtils.urlIsPubliclyReachable(base),
  };
}
