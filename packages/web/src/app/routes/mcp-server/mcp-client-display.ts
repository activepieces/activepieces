import { McpOAuthClientKey } from '@activepieces/shared';
import { t } from 'i18next';

const LOGOS_URL = '/client-logos';

function icon(key: McpOAuthClientKey | null): string {
  return MCP_CLIENT_BRANDING[key ?? 'unknown'].icon;
}

function label({ key, clientName }: LabelParams): string {
  return key === null || key === 'unknown'
    ? clientName ?? t('MCP client')
    : MCP_CLIENT_BRANDING[key].name;
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
    icon: `${LOGOS_URL}/windsurf.svg`,
    name: 'Windsurf',
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
