import { t } from 'i18next';

import claudeIcon from '@/assets/img/custom/claude.svg';
import cursorIcon from '@/assets/img/custom/cursor.svg';
import mcpIcon from '@/assets/img/custom/mcp-with-background.svg';
import openaiIcon from '@/assets/img/custom/openai.svg';
import vscodeIcon from '@/assets/img/custom/vscode.svg';
import windsurfIcon from '@/assets/img/custom/windsurf.svg';

const VERIFY_PROMPTS = [
  '"What Activepieces tools do you have?"',
  '"Post a note in Slack that the deploy finished."',
];

function claudeDeepLink(serverUrl: string): string {
  const params = new URLSearchParams({
    modal: 'add-custom-connector',
    connectorName: 'Activepieces',
    connectorUrl: serverUrl,
  });
  return `https://claude.ai/customize/connectors?${params.toString()}`;
}

function cursorDeepLink(serverUrl: string): string {
  const config = btoa(JSON.stringify({ url: serverUrl }));
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=activepieces&config=${encodeURIComponent(
    config,
  )}`;
}

function vscodeDeepLink(serverUrl: string): string {
  const config = JSON.stringify({
    name: 'activepieces',
    type: 'http',
    url: serverUrl,
  });
  return `vscode:mcp/install?${encodeURIComponent(config)}`;
}

function buildClients(serverUrl: string): ConnectableClient[] {
  return [
    {
      key: 'claude-code',
      icon: claudeIcon,
      name: 'Claude Code',
      group: 'terminal',
      hint: t('One command'),
      kind: t('Terminal · runs locally · about 30 seconds'),
      docsUrl: 'https://docs.claude.com/en/docs/claude-code/mcp',
      config: {
        label: t('Or edit .mcp.json'),
        snippet: JSON.stringify(
          { mcpServers: { activepieces: { type: 'http', url: serverUrl } } },
          null,
          2,
        ),
      },
      steps: [
        {
          title: t('Run this in your terminal'),
          body: t('From the folder you want the tools available in.'),
          command: `claude mcp add --transport http activepieces ${serverUrl}`,
        },
        {
          title: t('Authenticate'),
          body: t('Run /mcp inside Claude Code and pick Authenticate.'),
        },
        {
          title: t('Ask it something'),
          body: t('If it answers with your tools, you’re set.'),
          prompts: VERIFY_PROMPTS,
        },
      ],
    },
    {
      key: 'codex',
      icon: openaiIcon,
      name: 'Codex',
      group: 'terminal',
      hint: t('One command'),
      kind: t('Terminal · runs locally · about 30 seconds'),
      docsUrl: 'https://developers.openai.com/codex/mcp',
      config: {
        label: t('Or edit ~/.codex/config.toml'),
        snippet: `[mcp_servers.activepieces]\nurl = "${serverUrl}"`,
      },
      steps: [
        {
          title: t('Run this in your terminal'),
          body: t('From the folder you want the tools available in.'),
          command: `codex mcp add activepieces --url ${serverUrl}`,
        },
        {
          title: t('Authenticate'),
          body: t(
            'Codex opens your browser on the first tool call. Approve the project.',
          ),
        },
        {
          title: t('Ask it something'),
          body: t('If it answers with your tools, you’re set.'),
          prompts: VERIFY_PROMPTS,
        },
      ],
    },
    {
      key: 'gemini-cli',
      icon: mcpIcon,
      name: 'Gemini CLI',
      group: 'terminal',
      hint: t('Settings file'),
      kind: t('Terminal · runs locally · about 30 seconds'),
      docsUrl:
        'https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html',
      config: {
        label: t('Or edit ~/.gemini/settings.json'),
        snippet: JSON.stringify(
          { mcpServers: { activepieces: { httpUrl: serverUrl } } },
          null,
          2,
        ),
      },
      steps: [
        {
          title: t('Run this in your terminal'),
          body: t('Pass --scope project to keep it to one repository.'),
          command: `gemini mcp add --transport http activepieces ${serverUrl}`,
        },
        {
          title: t('Authenticate'),
          body: t(
            'Gemini CLI opens your browser on the first tool call. Approve the project.',
          ),
        },
        {
          title: t('Ask it something'),
          body: t('If it answers with your tools, you’re set.'),
          prompts: VERIFY_PROMPTS,
        },
      ],
    },
    {
      key: 'goose',
      icon: mcpIcon,
      name: 'goose',
      group: 'terminal',
      hint: t('Extension config'),
      kind: t('Terminal · runs locally · about 1 minute'),
      docsUrl:
        'https://block.github.io/goose/docs/getting-started/using-extensions',
      config: {
        label: t('Or edit ~/.config/goose/config.yaml'),
        snippet: `extensions:\n  activepieces:\n    enabled: true\n    type: streamable_http\n    name: activepieces\n    uri: ${serverUrl}\n    timeout: 60`,
      },
      steps: [
        {
          title: t('Add the extension'),
          body: t(
            'Run goose configure, pick Add Extension → Remote Extension (Streamable HTTP), and paste the server URL.',
          ),
          command: serverUrl,
        },
        {
          title: t('Authenticate'),
          body: t(
            'goose opens your browser on the first tool call. Approve the project.',
          ),
        },
        {
          title: t('Ask it something'),
          body: t('If it answers with your tools, you’re set.'),
          prompts: VERIFY_PROMPTS,
        },
      ],
    },
    {
      key: 'warp',
      icon: mcpIcon,
      name: 'Warp',
      group: 'terminal',
      hint: t('Add in settings'),
      kind: t('Terminal · runs locally · about 1 minute'),
      docsUrl: 'https://docs.warp.dev/agent-platform/capabilities/mcp',
      config: {
        label: t('MCP server JSON'),
        snippet: JSON.stringify({ activepieces: { url: serverUrl } }, null, 2),
      },
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'Settings → AI → MCP servers → + Add, choose CLI Server or paste the JSON below.',
          ),
        },
        {
          title: t('Authenticate'),
          body: t(
            'Start the server from the MCP panel and approve the sign-in prompt.',
          ),
        },
        {
          title: t('Check it works'),
          body: t('The MCP panel lists activepieces as running.'),
        },
      ],
    },
    {
      key: 'cursor',
      icon: cursorIcon,
      name: 'Cursor',
      group: 'editors',
      hint: t('One click install'),
      kind: t('Editor · runs locally · about 30 seconds'),
      docsUrl: 'https://docs.cursor.com/context/mcp',
      config: {
        label: t('Or edit ~/.cursor/mcp.json'),
        snippet: JSON.stringify(
          { mcpServers: { activepieces: { url: serverUrl } } },
          null,
          2,
        ),
      },
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'Opens Cursor and writes the server into ~/.cursor/mcp.json. You can also edit that file by hand.',
          ),
          action: {
            label: t('Add to Cursor'),
            href: cursorDeepLink(serverUrl),
          },
        },
        {
          title: t('Authenticate'),
          body: t(
            'Cursor prompts you to sign in on first use. Approve the project.',
          ),
        },
        {
          title: t('Check it works'),
          body: t('Settings → MCP shows activepieces with its tool count.'),
        },
      ],
    },
    {
      key: 'vscode',
      icon: vscodeIcon,
      name: 'VS Code',
      group: 'editors',
      hint: t('One click install'),
      kind: t('Editor · runs locally · about 30 seconds'),
      docsUrl: 'https://code.visualstudio.com/docs/copilot/chat/mcp-servers',
      config: {
        label: t('Or edit .vscode/mcp.json'),
        snippet: JSON.stringify(
          { servers: { activepieces: { type: 'http', url: serverUrl } } },
          null,
          2,
        ),
      },
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'Opens VS Code and writes the server into .vscode/mcp.json for this workspace.',
          ),
          action: {
            label: t('Add to VS Code'),
            href: vscodeDeepLink(serverUrl),
          },
        },
        {
          title: t('Authenticate'),
          body: t(
            'Start the server from the MCP panel and approve the sign-in prompt.',
          ),
        },
        {
          title: t('Check it works'),
          body: t('The MCP panel lists activepieces as running.'),
        },
      ],
    },
    {
      key: 'windsurf',
      icon: windsurfIcon,
      name: 'Windsurf',
      group: 'editors',
      hint: t('Config file'),
      kind: t('Editor · runs locally · about 1 minute'),
      docsUrl: 'https://docs.windsurf.com/windsurf/cascade/mcp',
      config: {
        label: t('Or edit ~/.codeium/windsurf/mcp_config.json'),
        snippet: JSON.stringify(
          { mcpServers: { activepieces: { serverUrl } } },
          null,
          2,
        ),
      },
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'Cascade → Plugins → View raw config, then add the server to ~/.codeium/windsurf/mcp_config.json.',
          ),
        },
        {
          title: t('Authenticate'),
          body: t(
            'Hit Refresh in the Plugins panel, then approve the sign-in prompt.',
          ),
        },
        {
          title: t('Check it works'),
          body: t('The Plugins panel lists activepieces with its tool count.'),
        },
      ],
    },
    {
      key: 'cline',
      icon: mcpIcon,
      name: 'Cline',
      group: 'editors',
      hint: t('Add in settings'),
      kind: t('Editor extension · runs locally · about 1 minute'),
      docsUrl: 'https://docs.cline.bot/mcp/mcp-overview',
      config: {
        label: t('Or edit cline_mcp_settings.json'),
        snippet: JSON.stringify(
          {
            mcpServers: {
              activepieces: { type: 'streamableHttp', url: serverUrl },
            },
          },
          null,
          2,
        ),
      },
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'MCP Servers → Remote Servers → Add, or edit cline_mcp_settings.json directly. The type must be streamableHttp.',
          ),
          command: serverUrl,
        },
        {
          title: t('Authenticate'),
          body: t(
            'Cline opens your browser on the first tool call. Approve the project.',
          ),
        },
        {
          title: t('Check it works'),
          body: t('The MCP Servers panel lists activepieces with its tools.'),
        },
      ],
    },
    {
      key: 'zed',
      icon: mcpIcon,
      name: 'Zed',
      group: 'editors',
      hint: t('Config file'),
      kind: t('Editor · runs locally · about 1 minute'),
      docsUrl: 'https://zed.dev/docs/ai/mcp',
      config: {
        label: t('Or edit settings.json'),
        snippet: JSON.stringify(
          { context_servers: { activepieces: { url: serverUrl } } },
          null,
          2,
        ),
      },
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'Settings → AI → MCP Servers → Add Custom Server, or add it to your settings.json.',
          ),
        },
        {
          title: t('Authenticate'),
          body: t(
            'Zed opens your browser on the first tool call. Approve the project.',
          ),
        },
        {
          title: t('Check it works'),
          body: t('The Agent Panel shows activepieces with its tool count.'),
        },
      ],
    },
    {
      key: 'jetbrains',
      icon: mcpIcon,
      name: 'JetBrains IDEs',
      group: 'editors',
      hint: t('Add in settings'),
      kind: t('Editor · runs locally · about 1 minute'),
      docsUrl: 'https://www.jetbrains.com/help/ai-assistant/mcp.html',
      config: {
        label: t('MCP server JSON'),
        snippet: JSON.stringify(
          { mcpServers: { activepieces: { url: serverUrl } } },
          null,
          2,
        ),
      },
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'Settings → Tools → AI Assistant → Model Context Protocol → Add, then paste the JSON below.',
          ),
        },
        {
          title: t('Authenticate'),
          body: t(
            'The IDE opens your browser on the first tool call. Approve the project.',
          ),
        },
        {
          title: t('Check it works'),
          body: t('The MCP settings page lists activepieces as connected.'),
        },
      ],
    },
    {
      key: 'continue',
      icon: mcpIcon,
      name: 'Continue',
      group: 'editors',
      hint: t('Config file'),
      kind: t('Editor extension · runs locally · about 1 minute'),
      docsUrl: 'https://docs.continue.dev/customize/deep-dives/mcp',
      config: {
        label: t('Or edit ~/.continue/config.yaml'),
        snippet: `mcpServers:\n  - name: activepieces\n    type: streamable-http\n    url: ${serverUrl}`,
      },
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'Add the server to ~/.continue/config.yaml, or drop the same block in .continue/mcpServers/activepieces.yaml.',
          ),
        },
        {
          title: t('Authenticate'),
          body: t(
            'Continue opens your browser on the first tool call. Approve the project.',
          ),
        },
        {
          title: t('Check it works'),
          body: t('The Agent mode tool list shows the Activepieces tools.'),
        },
      ],
    },
    {
      key: 'claude',
      icon: claudeIcon,
      name: 'Claude',
      group: 'chat',
      hint: t('Add a connector'),
      kind: t('Desktop and web · needs a public HTTPS address'),
      docsUrl:
        'https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp',
      steps: [
        {
          title: t('Add the connector'),
          body: t(
            'Customize → Connectors → + → Add custom connector, then paste the server URL. This client dials your server from the internet, so localhost will not reach it.',
          ),
          action: {
            label: t('Add to Claude'),
            href: claudeDeepLink(serverUrl),
            requiresPublicUrl: true,
          },
        },
        {
          title: t('Sign in'),
          body: t(
            'Claude opens Activepieces in your browser. Approve the project it can reach.',
          ),
        },
        {
          title: t('Ask it something'),
          body: t('If it answers with your tools, you’re set.'),
          prompts: VERIFY_PROMPTS,
        },
      ],
    },
    {
      key: 'chatgpt',
      icon: openaiIcon,
      name: 'ChatGPT',
      group: 'chat',
      hint: t('Add a connector'),
      kind: t('Desktop and web · needs a public HTTPS address'),
      docsUrl: 'https://platform.openai.com/docs/mcp',
      steps: [
        {
          title: t('Add the connector'),
          body: t(
            'Settings → Connectors → Create, then paste the server URL. ChatGPT dials your server from the internet, so localhost will not reach it.',
          ),
          command: serverUrl,
        },
        {
          title: t('Authenticate'),
          body: t(
            'ChatGPT opens Activepieces in your browser. Approve the project it can reach.',
          ),
        },
        {
          title: t('Ask it something'),
          body: t('If it answers with your tools, you’re set.'),
          prompts: VERIFY_PROMPTS,
        },
      ],
    },
    {
      key: 'unknown',
      icon: mcpIcon,
      name: t('Any MCP client'),
      group: 'other',
      hint: t('Streamable HTTP or SSE. Point it at the link and it works.'),
      kind: t('Streamable HTTP · OAuth'),
      docsUrl: 'https://modelcontextprotocol.io/clients',
      config: {
        label: t('MCP server JSON'),
        snippet: JSON.stringify(
          { mcpServers: { activepieces: { url: serverUrl } } },
          null,
          2,
        ),
      },
      steps: [
        {
          title: t('Paste the server URL'),
          body: t('Check your client’s docs for where the server URL goes.'),
          command: serverUrl,
        },
        {
          title: t('Authenticate'),
          body: t(
            'The client opens an OAuth prompt on the first tool call. Approve the project.',
          ),
        },
        {
          title: t('Check it works'),
          body: t(
            'The client should list this project’s tools. If it does not, confirm it supports streamable HTTP.',
          ),
        },
      ],
    },
  ];
}

export const mcpClientCatalog = {
  build: buildClients,

  groups: (): ClientGroup[] => [
    {
      key: 'terminal',
      label: t('Terminal'),
      tagline: t('one command, nothing to edit'),
    },
    {
      key: 'editors',
      label: t('Editors'),
      tagline: t('we write the config for you'),
    },
    {
      key: 'chat',
      label: t('Chat apps'),
      tagline: t('desktop and web, needs a public HTTPS URL'),
    },
    { key: 'other', label: t('Anything else') },
  ],
};

export const POPULAR_CLIENT_KEYS = ['claude-code', 'cursor', 'claude'];

export type ClientGroupKey = 'terminal' | 'editors' | 'chat' | 'other';

export type ClientGroup = {
  key: ClientGroupKey;
  label: string;
  tagline?: string;
};

export type ConnectStep = {
  title: string;
  body: string;
  command?: string;
  prompts?: string[];
  action?: {
    label: string;
    href: string;
    requiresPublicUrl?: boolean;
  };
};

export type ConnectableClient = {
  key: string;
  icon: string;
  name: string;
  group: ClientGroupKey;
  hint: string;
  kind: string;
  docsUrl: string;
  config?: {
    label: string;
    snippet: string;
  };
  steps: ConnectStep[];
};
