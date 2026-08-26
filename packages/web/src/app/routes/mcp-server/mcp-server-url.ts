import { ApFlagId } from '@activepieces/shared';

import { flagsHooks } from '@/hooks/flags-hooks';

const PRIVATE_HOST =
  /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/;

function isReachableFromInternet(publicUrl: string | undefined): boolean {
  if (!publicUrl) {
    return false;
  }
  try {
    const url = new URL(publicUrl);
    return url.protocol === 'https:' && !PRIVATE_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

export function useMcpServerUrl(): {
  serverUrl: string;
  isReachableFromInternet: boolean;
} {
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const base = (publicUrl ?? '').replace(/\/$/, '');
  return {
    serverUrl: `${base}/mcp`,
    isReachableFromInternet: isReachableFromInternet(publicUrl ?? undefined),
  };
}
