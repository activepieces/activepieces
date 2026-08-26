import { McpOAuthClientKey } from '@activepieces/shared';
import { t } from 'i18next';

import claudeCodeIcon from '@/assets/img/custom/claude-code.svg';
import claudeIcon from '@/assets/img/custom/claude.svg';
import codexIcon from '@/assets/img/custom/codex.svg';
import cursorIcon from '@/assets/img/custom/cursor.svg';
import geminiIcon from '@/assets/img/custom/gemini.svg';
import mcpIcon from '@/assets/img/custom/mcp-with-background.svg';
import openaiIcon from '@/assets/img/custom/openai.svg';
import opencodeIcon from '@/assets/img/custom/opencode.svg';
import vscodeIcon from '@/assets/img/custom/vscode.svg';
import windsurfIcon from '@/assets/img/custom/windsurf.svg';

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
  claude: { icon: claudeIcon, name: 'Claude' },
  'claude-code': { icon: claudeCodeIcon, name: 'Claude Code' },
  chatgpt: { icon: openaiIcon, name: 'ChatGPT' },
  codex: { icon: codexIcon, name: 'Codex' },
  'gemini-cli': { icon: geminiIcon, name: 'Gemini CLI' },
  opencode: { icon: opencodeIcon, name: 'OpenCode' },
  cursor: { icon: cursorIcon, name: 'Cursor' },
  vscode: { icon: vscodeIcon, name: 'VS Code' },
  windsurf: { icon: windsurfIcon, name: 'Windsurf' },
  unknown: { icon: mcpIcon, name: 'MCP client' },
};

type LabelParams = {
  key: McpOAuthClientKey;
  clientName: string | null;
};
