import { ApFlagId, McpOAuthClientKey } from '@activepieces/shared';
import { t } from 'i18next';

import { flagsHooks } from '@/hooks/flags-hooks';

import { mcpClientCatalog } from './mcp-client-catalog';

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

function brandingFor(key: McpOAuthClientKey) {
  return mcpClientCatalog.branding()[key];
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

export const mcpClientBranding = {
  icon: (key: McpOAuthClientKey): string => brandingFor(key).icon,

  label: (key: McpOAuthClientKey, clientName: string | null): string =>
    key === 'unknown' ? clientName ?? t('MCP client') : brandingFor(key).name,
};
