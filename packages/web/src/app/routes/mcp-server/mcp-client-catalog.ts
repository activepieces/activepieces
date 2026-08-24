import { t } from 'i18next';

import claudeIcon from '@/assets/img/custom/claude.svg';
import cursorIcon from '@/assets/img/custom/cursor.svg';
import mcpIcon from '@/assets/img/custom/mcp-with-background.svg';
import openaiIcon from '@/assets/img/custom/openai.svg';
import vscodeIcon from '@/assets/img/custom/vscode.svg';
import windsurfIcon from '@/assets/img/custom/windsurf.svg';

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

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function mcpServersJson(activepieces: object): string {
  return json({ mcpServers: { activepieces } });
}

function entries(url: string): CatalogEntry[] {
  return [
    {
      key: 'claude-code',
      icon: claudeIcon,
      name: 'Claude Code',
      group: 'terminal',
      setup: 'fast',
      hint: t('One command'),
      docsUrl: 'https://docs.claude.com/en/docs/claude-code/mcp',
      add: {
        body: t('From the folder you want the tools available in.'),
        command: `claude mcp add --transport http activepieces ${url}`,
      },
      auth: t('Run /mcp inside Claude Code and pick Authenticate.'),
      config: {
        path: '.mcp.json',
        snippet: mcpServersJson({ type: 'http', url }),
      },
    },
    {
      key: 'codex',
      icon: openaiIcon,
      name: 'Codex',
      group: 'terminal',
      setup: 'fast',
      hint: t('One command'),
      docsUrl: 'https://developers.openai.com/codex/mcp',
      add: {
        body: t('From the folder you want the tools available in.'),
        command: `codex mcp add activepieces --url ${url}`,
      },
      config: {
        path: '~/.codex/config.toml',
        snippet: `[mcp_servers.activepieces]\nurl = "${url}"`,
      },
    },
    {
      key: 'gemini-cli',
      icon: mcpIcon,
      name: 'Gemini CLI',
      group: 'terminal',
      setup: 'fast',
      hint: t('Settings file'),
      docsUrl:
        'https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html',
      add: {
        body: t('Pass --scope project to keep it to one repository.'),
        command: `gemini mcp add --transport http activepieces ${url}`,
      },
      config: {
        path: '~/.gemini/settings.json',
        snippet: mcpServersJson({ httpUrl: url }),
      },
    },
    {
      key: 'goose',
      icon: mcpIcon,
      name: 'goose',
      group: 'terminal',
      setup: 'slow',
      hint: t('Extension config'),
      docsUrl:
        'https://block.github.io/goose/docs/getting-started/using-extensions',
      add: {
        title: t('Add the extension'),
        body: t(
          'Run goose configure, pick Add Extension → Remote Extension (Streamable HTTP), and paste the server URL.',
        ),
        command: url,
      },
      config: {
        path: '~/.config/goose/config.yaml',
        snippet: `extensions:\n  activepieces:\n    enabled: true\n    type: streamable_http\n    name: activepieces\n    uri: ${url}\n    timeout: 60`,
      },
    },
    {
      key: 'warp',
      icon: mcpIcon,
      name: 'Warp',
      group: 'terminal',
      setup: 'slow',
      hint: t('Add in settings'),
      docsUrl: 'https://docs.warp.dev/agent-platform/capabilities/mcp',
      add: {
        title: t('Add the server'),
        body: t(
          'Settings → AI → MCP servers → + Add, choose CLI Server or paste the JSON below.',
        ),
      },
      auth: t(
        'Start the server from the MCP panel and approve the sign-in prompt.',
      ),
      verify: t('The MCP panel lists activepieces as running.'),
      config: { snippet: json({ activepieces: { url } }) },
    },
    {
      key: 'cursor',
      icon: cursorIcon,
      name: 'Cursor',
      group: 'editors',
      setup: 'fast',
      hint: t('One click install'),
      docsUrl: 'https://docs.cursor.com/context/mcp',
      add: {
        body: t(
          'Opens Cursor and writes the server into ~/.cursor/mcp.json. You can also edit that file by hand.',
        ),
        action: { label: t('Add to Cursor'), href: cursorDeepLink(url) },
      },
      auth: t(
        'Cursor prompts you to sign in on first use. Approve the project.',
      ),
      verify: t('Settings → MCP shows activepieces with its tool count.'),
      config: { path: '~/.cursor/mcp.json', snippet: mcpServersJson({ url }) },
    },
    {
      key: 'vscode',
      icon: vscodeIcon,
      name: 'VS Code',
      group: 'editors',
      setup: 'fast',
      hint: t('One click install'),
      docsUrl: 'https://code.visualstudio.com/docs/copilot/chat/mcp-servers',
      add: {
        body: t(
          'Opens VS Code and writes the server into .vscode/mcp.json for this workspace.',
        ),
        action: { label: t('Add to VS Code'), href: vscodeDeepLink(url) },
      },
      auth: t(
        'Start the server from the MCP panel and approve the sign-in prompt.',
      ),
      verify: t('The MCP panel lists activepieces as running.'),
      config: {
        path: '.vscode/mcp.json',
        snippet: json({ servers: { activepieces: { type: 'http', url } } }),
      },
    },
    {
      key: 'windsurf',
      icon: windsurfIcon,
      name: 'Windsurf',
      group: 'editors',
      setup: 'slow',
      hint: t('Config file'),
      docsUrl: 'https://docs.windsurf.com/windsurf/cascade/mcp',
      add: {
        body: t(
          'Cascade → Plugins → View raw config, then add the server to ~/.codeium/windsurf/mcp_config.json.',
        ),
      },
      auth: t(
        'Hit Refresh in the Plugins panel, then approve the sign-in prompt.',
      ),
      verify: t('The Plugins panel lists activepieces with its tool count.'),
      config: {
        path: '~/.codeium/windsurf/mcp_config.json',
        snippet: mcpServersJson({ serverUrl: url }),
      },
    },
    {
      key: 'cline',
      icon: mcpIcon,
      name: 'Cline',
      group: 'editors',
      setup: 'slow',
      form: 'extension',
      hint: t('Add in settings'),
      docsUrl: 'https://docs.cline.bot/mcp/mcp-overview',
      add: {
        body: t(
          'MCP Servers → Remote Servers → Add, or edit cline_mcp_settings.json directly. The type must be streamableHttp.',
        ),
        command: url,
      },
      verify: t('The MCP Servers panel lists activepieces with its tools.'),
      config: {
        path: 'cline_mcp_settings.json',
        snippet: mcpServersJson({ type: 'streamableHttp', url }),
      },
    },
    {
      key: 'zed',
      icon: mcpIcon,
      name: 'Zed',
      group: 'editors',
      setup: 'slow',
      hint: t('Config file'),
      docsUrl: 'https://zed.dev/docs/ai/mcp',
      add: {
        body: t(
          'Settings → AI → MCP Servers → Add Custom Server, or add it to your settings.json.',
        ),
      },
      verify: t('The Agent Panel shows activepieces with its tool count.'),
      config: {
        path: 'settings.json',
        snippet: json({ context_servers: { activepieces: { url } } }),
      },
    },
    {
      key: 'jetbrains',
      icon: mcpIcon,
      name: 'JetBrains IDEs',
      group: 'editors',
      setup: 'slow',
      hint: t('Add in settings'),
      docsUrl: 'https://www.jetbrains.com/help/ai-assistant/mcp.html',
      add: {
        body: t(
          'Settings → Tools → AI Assistant → Model Context Protocol → Add, then paste the JSON below.',
        ),
      },
      auth: t(
        'The IDE opens your browser on the first tool call. Approve the project.',
      ),
      verify: t('The MCP settings page lists activepieces as connected.'),
      config: { snippet: mcpServersJson({ url }) },
    },
    {
      key: 'continue',
      icon: mcpIcon,
      name: 'Continue',
      group: 'editors',
      setup: 'slow',
      form: 'extension',
      hint: t('Config file'),
      docsUrl: 'https://docs.continue.dev/customize/deep-dives/mcp',
      add: {
        body: t(
          'Add the server to ~/.continue/config.yaml, or drop the same block in .continue/mcpServers/activepieces.yaml.',
        ),
      },
      verify: t('The Agent mode tool list shows the Activepieces tools.'),
      config: {
        path: '~/.continue/config.yaml',
        snippet: `mcpServers:\n  - name: activepieces\n    type: streamable-http\n    url: ${url}`,
      },
    },
    {
      key: 'claude',
      icon: claudeIcon,
      name: 'Claude',
      group: 'chat',
      hint: t('Add a connector'),
      docsUrl:
        'https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp',
      add: {
        body: t(
          'Customize → Connectors → + → Add custom connector, then paste the server URL. This client dials your server from the internet, so localhost will not reach it.',
        ),
        action: {
          label: t('Add to Claude'),
          href: claudeDeepLink(url),
          requiresInternetReachableUrl: true,
        },
      },
    },
    {
      key: 'chatgpt',
      icon: openaiIcon,
      name: 'ChatGPT',
      group: 'chat',
      hint: t('Add a connector'),
      docsUrl: 'https://platform.openai.com/docs/mcp',
      add: {
        body: t(
          'Settings → Connectors → Create, then paste the server URL. ChatGPT dials your server from the internet, so localhost will not reach it.',
        ),
        command: url,
      },
    },
    {
      key: 'unknown',
      icon: mcpIcon,
      name: t('Any MCP client'),
      group: 'other',
      hint: t('Streamable HTTP or SSE. Point it at the link and it works.'),
      docsUrl: 'https://modelcontextprotocol.io/clients',
      add: {
        body: t('Check your client’s docs for where the server URL goes.'),
        command: url,
      },
      verify: t(
        'The client should list this project’s tools. If it does not, confirm it supports streamable HTTP.',
      ),
      config: { snippet: mcpServersJson({ url }) },
    },
  ];
}

function addTitle(entry: CatalogEntry): string {
  const byGroup = {
    terminal: () => t('Run this in your terminal'),
    editors: () => t('Add the server'),
    chat: () => t('Add the connector'),
    other: () => t('Paste the server URL'),
  };
  return entry.add.title ?? byGroup[entry.group]();
}

function localAuth(client: string): string {
  return t(
    '{client} opens your browser on the first tool call. Approve the project.',
    { client },
  );
}

function authBody(entry: CatalogEntry): string {
  const byGroup = {
    chat: () =>
      t(
        '{client} opens Activepieces in your browser. Approve the project it can reach.',
        { client: entry.name },
      ),
    other: () =>
      t(
        'The client opens an OAuth prompt on the first tool call. Approve the project.',
      ),
    terminal: () => localAuth(entry.name),
    editors: () => localAuth(entry.name),
  };
  return entry.auth ?? byGroup[entry.group]();
}

function kindLabel(entry: CatalogEntry): string {
  const byGroup = {
    terminal: () => t('Terminal · runs locally'),
    editors: () =>
      entry.form === 'extension'
        ? t('Editor extension · runs locally')
        : t('Editor · runs locally'),
    chat: () => t('Desktop and web · needs a public HTTPS address'),
    other: () => t('Streamable HTTP · OAuth'),
  };
  if (!entry.setup) {
    return byGroup[entry.group]();
  }
  const duration =
    entry.setup === 'fast' ? t('about 30 seconds') : t('about 1 minute');
  return `${byGroup[entry.group]()} · ${duration}`;
}

function configLabel(config: EntryConfig): string {
  return config.path
    ? t('Or edit {path}', { path: config.path })
    : t('MCP server JSON');
}

function toClient(entry: CatalogEntry): ConnectableClient {
  return {
    key: entry.key,
    icon: entry.icon,
    name: entry.name,
    group: entry.group,
    hint: entry.hint,
    kind: kindLabel(entry),
    docsUrl: entry.docsUrl,
    config: entry.config && {
      label: configLabel(entry.config),
      snippet: entry.config.snippet,
    },
    steps: [
      {
        title: addTitle(entry),
        body: entry.add.body,
        command: entry.add.command,
        action: entry.add.action,
      },
      { title: t('Authenticate'), body: authBody(entry) },
      {
        title: t('Check it works'),
        body: entry.verify ?? t('If it answers with your tools, you’re set.'),
        prompts: VERIFY_PROMPTS,
      },
    ],
  };
}

const VERIFY_PROMPTS = [
  '"What Activepieces tools do you have?"',
  '"Post a note in Slack that the deploy finished."',
];

export const mcpClientCatalog = {
  build: (serverUrl: string): ConnectableClient[] =>
    entries(serverUrl).map(toClient),

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
  action?: ConnectAction;
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

type ConnectAction = {
  label: string;
  href: string;
  requiresInternetReachableUrl?: boolean;
};

type EntryConfig = {
  path?: string;
  snippet: string;
};

type CatalogEntry = {
  key: string;
  icon: string;
  name: string;
  group: ClientGroupKey;
  setup?: 'fast' | 'slow';
  form?: 'extension';
  hint: string;
  docsUrl: string;
  add: {
    title?: string;
    body: string;
    command?: string;
    action?: ConnectAction;
  };
  auth?: string;
  verify?: string;
  config?: EntryConfig;
};
