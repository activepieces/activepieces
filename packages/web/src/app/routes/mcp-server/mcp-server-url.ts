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
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const base = (publicUrl ?? '').replace(/\/$/, '');
  const path = serverType === McpServerType.PLATFORM ? '/mcp/platform' : '/mcp';
  return {
    serverUrl: `${base}${path}`,
    isReachableFromInternet: formatUtils.urlIsPubliclyReachable(base),
  };
}
