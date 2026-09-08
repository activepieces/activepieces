import { ApFlagId } from '@activepieces/shared';

import { flagsHooks } from '@/hooks/flags-hooks';
import { formatUtils } from '@/lib/format-utils';

export function useMcpServerUrl(): {
  serverUrl: string;
  isReachableFromInternet: boolean;
} {
  const { data: mcpUrl } = flagsHooks.useFlag<string>(ApFlagId.MCP_URL);
  const base = (mcpUrl ?? '').replace(/\/$/, '');
  return {
    serverUrl: `${base}/mcp`,
    isReachableFromInternet: formatUtils.urlIsPubliclyReachable(base),
  };
}
