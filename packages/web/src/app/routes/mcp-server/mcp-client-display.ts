import { McpOAuthClientKey } from '@activepieces/shared';
import { t } from 'i18next';

const LOGOS_URL = '/client-logos';

function icon(key: McpOAuthClientKey | null): string {
  return ((key && MCP_CLIENT_BRANDING[key]) ?? MCP_CLIENT_BRANDING.unknown)
    .icon;
}

function label({ key, clientName }: LabelParams): string {
  const known = key && key !== 'unknown' ? MCP_CLIENT_BRANDING[key] : undefined;
  return known?.name ?? clientName ?? t('MCP client');
}

export const mcpClientDisplay = { icon, label };

export const MCP_CLIENT_BRANDING: Record<
  McpOAuthClientKey,
  { icon: string; name: string }
> = {
  claude: {
    icon: `${LOGOS_URL}/claude.svg`,
    name: 'Claude',
  },
  'claude-code': {
    icon: `${LOGOS_URL}/claude-code.svg`,
    name: 'Claude Code',
  },
  chatgpt: {
    icon: `${LOGOS_URL}/chatgpt.svg`,
    name: 'ChatGPT',
  },
  codex: {
    icon: `${LOGOS_URL}/codex.svg`,
    name: 'Codex',
  },
  'gemini-cli': {
    icon: `${LOGOS_URL}/gemini-cli.svg`,
    name: 'Gemini CLI',
  },
  opencode: {
    icon: `${LOGOS_URL}/opencode.svg`,
    name: 'OpenCode',
  },
  cursor: {
    icon: `${LOGOS_URL}/cursor.svg`,
    name: 'Cursor',
  },
  vscode: {
    icon: `${LOGOS_URL}/vscode.svg`,
    name: 'VS Code',
  },
  windsurf: {
    icon: `${LOGOS_URL}/devin.svg`,
    name: 'Devin',
  },
  'copilot-cli': {
    icon: `${LOGOS_URL}/copilot-cli.svg`,
    name: 'Copilot CLI',
  },
  antigravity: {
    icon: `${LOGOS_URL}/antigravity.svg`,
    name: 'Antigravity',
  },
  zed: {
    icon: `${LOGOS_URL}/zed.svg`,
    name: 'Zed',
  },
  cline: {
    icon: `${LOGOS_URL}/cline.svg`,
    name: 'Cline',
  },
  goose: {
    icon: `${LOGOS_URL}/goose.svg`,
    name: 'goose',
  },
  unknown: {
    icon: `${LOGOS_URL}/mcp.svg`,
    name: 'MCP client',
  },
};

type LabelParams = {
  key: McpOAuthClientKey | null;
  clientName: string | null;
};
