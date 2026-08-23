import { ApFlagId, McpOAuthClientKey } from '@activepieces/shared';
import { t } from 'i18next';

import claudeIcon from '@/assets/img/custom/claude.svg';
import cursorIcon from '@/assets/img/custom/cursor.svg';
import mcpIcon from '@/assets/img/custom/mcp-with-background.svg';
import openaiIcon from '@/assets/img/custom/openai.svg';
import vscodeIcon from '@/assets/img/custom/vscode.svg';
import windsurfIcon from '@/assets/img/custom/windsurf.svg';
import { flagsHooks } from '@/hooks/flags-hooks';

const ICONS: Record<McpOAuthClientKey, string> = {
  claude: claudeIcon,
  'claude-code': claudeIcon,
  chatgpt: openaiIcon,
  cursor: cursorIcon,
  vscode: vscodeIcon,
  codex: openaiIcon,
  windsurf: windsurfIcon,
  unknown: mcpIcon,
};

const LABELS: Record<Exclude<McpOAuthClientKey, 'unknown'>, string> = {
  claude: 'Claude',
  'claude-code': 'Claude Code',
  chatgpt: 'ChatGPT',
  cursor: 'Cursor',
  vscode: 'VS Code',
  codex: 'Codex',
  windsurf: 'Windsurf',
};

const PRIVATE_HOST =
  /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/;

function isPubliclyReachable(publicUrl: string | undefined): boolean {
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

export function useMcpServerUrl(): { serverUrl: string; isPublic: boolean } {
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const base = (publicUrl ?? '').replace(/\/$/, '');
  return {
    serverUrl: `${base}/mcp`,
    isPublic: isPubliclyReachable(publicUrl ?? undefined),
  };
}

export const mcpClientIdentity = {
  icon: (key: McpOAuthClientKey): string => ICONS[key],

  label: (key: McpOAuthClientKey, clientName: string | null): string =>
    key === 'unknown' ? clientName ?? t('MCP client') : LABELS[key],
};
