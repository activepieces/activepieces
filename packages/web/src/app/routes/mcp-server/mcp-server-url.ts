import { ApFlagId } from '@activepieces/shared';

import { flagsHooks } from '@/hooks/flags-hooks';
import { formatUtils } from '@/lib/format-utils';

export function useMcpServerUrl(): {
  serverUrl: string;
  isReachableFromInternet: boolean;
} {
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const base = (publicUrl ?? '').replace(/\/$/, '');
  return {
    serverUrl: `${base}/mcp`,
    isReachableFromInternet: formatUtils.urlIsPubliclyReachable(base),
  };
}
