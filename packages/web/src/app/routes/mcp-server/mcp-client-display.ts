import { McpOAuthClientKey } from '@activepieces/shared';
import { t } from 'i18next';

const CDN_ICONS_URL = 'https://cdn.activepieces.com/icons';

function icon(key: McpOAuthClientKey): string {
  return MCP_CLIENT_BRANDING[key].icon;
}

function label({ key, clientName }: LabelParams): string {
  return key === 'unknown'
    ? clientName ?? t('MCP client')
    : MCP_CLIENT_BRANDING[key].name;
}

export const mcpClientDisplay = { icon, label };

export const MCP_CLIENT_BRANDING: Record<
  McpOAuthClientKey,
  { icon: string; name: string }
> = {
  claude: { icon: `${CDN_ICONS_URL}/claude.svg`, name: 'Claude' },
  'claude-code': {
    icon: `${CDN_ICONS_URL}/claude-code.svg`,
    name: 'Claude Code',
  },
  chatgpt: { icon: `${CDN_ICONS_URL}/openai.svg`, name: 'ChatGPT' },
  codex: { icon: `${CDN_ICONS_URL}/codex.svg`, name: 'Codex' },
  'gemini-cli': { icon: `${CDN_ICONS_URL}/gemini.svg`, name: 'Gemini CLI' },
  opencode: { icon: `${CDN_ICONS_URL}/opencode.svg`, name: 'OpenCode' },
  cursor: { icon: `${CDN_ICONS_URL}/cursor.svg`, name: 'Cursor' },
  vscode: { icon: `${CDN_ICONS_URL}/vscode.svg`, name: 'VS Code' },
  windsurf: { icon: `${CDN_ICONS_URL}/windsurf.svg`, name: 'Windsurf' },
  unknown: {
    icon: `${CDN_ICONS_URL}/mcp-with-background.svg`,
    name: 'MCP client',
  },
};

type LabelParams = {
  key: McpOAuthClientKey;
  clientName: string | null;
};
