import { McpOAuthClientKey } from '@activepieces/shared';
import { t } from 'i18next';

import claudeIcon from '@/assets/img/custom/claude.svg';
import cursorIcon from '@/assets/img/custom/cursor.svg';
import mcpIcon from '@/assets/img/custom/mcp-with-background.svg';
import openaiIcon from '@/assets/img/custom/openai.svg';
import vscodeIcon from '@/assets/img/custom/vscode.svg';
import windsurfIcon from '@/assets/img/custom/windsurf.svg';

function icon(key: McpOAuthClientKey): string {
  return MCP_CLIENT_DISPLAY[key].icon;
}

function label(key: McpOAuthClientKey, clientName: string | null): string {
  return key === 'unknown'
    ? clientName ?? t('MCP client')
    : MCP_CLIENT_DISPLAY[key].name;
}

export const mcpClientDisplay = { icon, label };

export const MCP_CLIENT_DISPLAY: Record<
  McpOAuthClientKey,
  { icon: string; name: string }
> = {
  claude: { icon: claudeIcon, name: 'Claude' },
  'claude-code': { icon: claudeIcon, name: 'Claude Code' },
  chatgpt: { icon: openaiIcon, name: 'ChatGPT' },
  codex: { icon: openaiIcon, name: 'Codex' },
  cursor: { icon: cursorIcon, name: 'Cursor' },
  vscode: { icon: vscodeIcon, name: 'VS Code' },
  windsurf: { icon: windsurfIcon, name: 'Windsurf' },
  unknown: { icon: mcpIcon, name: 'MCP client' },
};
