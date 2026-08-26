import { t } from 'i18next';

import { MCP_CLIENT_DISPLAY } from './mcp-client-display';

const GENERIC_ICON = MCP_CLIENT_DISPLAY.unknown.icon;

function slugify(websiteName: string): string {
  return (
    websiteName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'activepieces'
  );
}

function claudeDeepLink(serverUrl: string, brandName: string): string {
  const params = new URLSearchParams({
    modal: 'add-custom-connector',
    connectorName: brandName,
    connectorUrl: serverUrl,
  });
  return `https://claude.ai/customize/connectors?${params.toString()}`;
}

function cursorDeepLink(serverUrl: string, slug: string): string {
  const config = btoa(JSON.stringify({ url: serverUrl }));
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${slug}&config=${encodeURIComponent(
    config,
  )}`;
}

function vscodeDeepLink(serverUrl: string, slug: string): string {
  const config = JSON.stringify({ name: slug, type: 'http', url: serverUrl });
  return `vscode:mcp/install?${encodeURIComponent(config)}`;
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function mcpServersJson(slug: string, serverConfig: object): string {
  return prettyJson({ mcpServers: { [slug]: serverConfig } });
}

const CLOUD_LISTINGS = {
  claude: 'https://claude.ai/directory/cloud-activepieces-com',
  cursor:
    'https://cursor.directory/plugins/activepieces-mcp-connector-for-cursor',
};

function catalogEntries(url: string, { name, slug }: Brand): CatalogEntry[] {
  return [
    {
      key: 'claude-code',
      ...MCP_CLIENT_DISPLAY['claude-code'],
      group: 'terminal',
      hint: t('One command'),
      docsUrl: 'https://docs.claude.com/en/docs/claude-code/mcp',
      addStep: {
        body: t('From the folder you want the tools available in.'),
        command: `claude mcp add --transport http ${slug} ${url}`,
      },
      auth: t('Run /mcp inside Claude Code and pick Authenticate.'),
      config: {
        path: '.mcp.json',
        snippet: mcpServersJson(slug, { type: 'http', url }),
      },
    },
    {
      key: 'codex',
      ...MCP_CLIENT_DISPLAY.codex,
      group: 'terminal',
      hint: t('One command'),
      docsUrl: 'https://developers.openai.com/codex/mcp',
      addStep: {
        body: t('From the folder you want the tools available in.'),
        command: `codex mcp add ${slug} --url ${url}`,
      },
      config: {
        path: '~/.codex/config.toml',
        snippet: `[mcp_servers.${slug}]\nurl = "${url}"`,
      },
    },
    {
      key: 'gemini-cli',
      icon: GENERIC_ICON,
      name: 'Gemini CLI',
      group: 'terminal',
      hint: t('One command'),
      docsUrl:
        'https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html',
      addStep: {
        body: t('Pass --scope project to keep it to one repository.'),
        command: `gemini mcp add --transport http ${slug} ${url}`,
      },
      config: {
        path: '~/.gemini/settings.json',
        snippet: mcpServersJson(slug, { httpUrl: url }),
      },
    },
    {
      key: 'goose',
      icon: GENERIC_ICON,
      name: 'goose',
      group: 'terminal',
      hint: t('Config file'),
      docsUrl:
        'https://block.github.io/goose/docs/getting-started/using-extensions',
      config: {
        path: '~/.config/goose/config.yaml',
        snippet: `extensions:\n  ${slug}:\n    enabled: true\n    type: streamable_http\n    name: ${slug}\n    uri: ${url}\n    timeout: 60`,
      },
    },
    {
      key: 'warp',
      icon: GENERIC_ICON,
      name: 'Warp',
      group: 'terminal',
      hint: t('Add in settings'),
      docsUrl: 'https://docs.warp.dev/agent-platform/capabilities/mcp',
      config: { snippet: prettyJson({ [slug]: { url } }) },
    },
    {
      key: 'cursor',
      ...MCP_CLIENT_DISPLAY.cursor,
      group: 'editors',
      hint: t('One click install'),
      docsUrl: 'https://docs.cursor.com/context/mcp',
      addStep: {
        body: t('Opens Cursor and writes the server into ~/.cursor/mcp.json.'),
        action: { label: t('Add to Cursor'), href: cursorDeepLink(url, slug) },
      },
      cloud: {
        docsUrl: CLOUD_LISTINGS.cursor,
        addStep: {
          body: t(
            'Installs the published plugin from the Cursor directory into ~/.cursor/mcp.json.',
          ),
          action: {
            label: t('Add to Cursor'),
            href: cursorDeepLink(url, slug),
          },
        },
      },
      config: {
        path: '~/.cursor/mcp.json',
        snippet: mcpServersJson(slug, { url }),
      },
    },
    {
      key: 'vscode',
      ...MCP_CLIENT_DISPLAY.vscode,
      group: 'editors',
      hint: t('One click install'),
      docsUrl: 'https://code.visualstudio.com/docs/copilot/chat/mcp-servers',
      addStep: {
        body: t(
          'Opens VS Code and writes the server into .vscode/mcp.json for this workspace.',
        ),
        action: { label: t('Add to VS Code'), href: vscodeDeepLink(url, slug) },
      },
      config: {
        path: '.vscode/mcp.json',
        snippet: prettyJson({ servers: { [slug]: { type: 'http', url } } }),
      },
    },
    {
      key: 'windsurf',
      ...MCP_CLIENT_DISPLAY.windsurf,
      group: 'editors',
      hint: t('Config file'),
      docsUrl: 'https://docs.windsurf.com/windsurf/cascade/mcp',
      config: {
        path: '~/.codeium/windsurf/mcp_config.json',
        snippet: mcpServersJson(slug, { serverUrl: url }),
      },
    },
    {
      key: 'cline',
      icon: GENERIC_ICON,
      name: 'Cline',
      group: 'editors',
      formFactor: 'extension',
      hint: t('Add in settings'),
      docsUrl: 'https://docs.cline.bot/mcp/mcp-overview',
      config: {
        path: 'cline_mcp_settings.json',
        snippet: mcpServersJson(slug, { type: 'streamableHttp', url }),
      },
    },
    {
      key: 'zed',
      icon: GENERIC_ICON,
      name: 'Zed',
      group: 'editors',
      hint: t('Config file'),
      docsUrl: 'https://zed.dev/docs/ai/mcp',
      config: {
        path: 'settings.json',
        snippet: prettyJson({ context_servers: { [slug]: { url } } }),
      },
    },
    {
      key: 'jetbrains',
      icon: GENERIC_ICON,
      name: 'JetBrains IDEs',
      group: 'editors',
      hint: t('Add in settings'),
      docsUrl: 'https://www.jetbrains.com/help/ai-assistant/mcp.html',
      config: { snippet: mcpServersJson(slug, { url }) },
    },
    {
      key: 'continue',
      icon: GENERIC_ICON,
      name: 'Continue',
      group: 'editors',
      formFactor: 'extension',
      hint: t('Config file'),
      docsUrl: 'https://docs.continue.dev/customize/deep-dives/mcp',
      config: {
        path: '~/.continue/config.yaml',
        snippet: `mcpServers:\n  - name: ${slug}\n    type: streamable-http\n    url: ${url}`,
      },
    },
    {
      key: 'claude',
      ...MCP_CLIENT_DISPLAY.claude,
      group: 'chat',
      hint: t('Add a connector'),
      docsUrl:
        'https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp',
      addStep: {
        body: t(
          'Paste the server URL as a custom connector. This client dials your server from the internet, so localhost will not reach it.',
        ),
        action: {
          label: t('Add to Claude'),
          href: claudeDeepLink(url, name),
          requiresInternetReachableUrl: true,
        },
      },
      cloud: {
        docsUrl: CLOUD_LISTINGS.claude,
        addStep: {
          body: t(
            'This server is already listed in Claude’s directory — add it there in one click.',
          ),
          action: {
            label: t('Add from the Claude directory'),
            href: CLOUD_LISTINGS.claude,
          },
        },
      },
    },
    {
      key: 'chatgpt',
      ...MCP_CLIENT_DISPLAY.chatgpt,
      group: 'chat',
      hint: t('Add a connector'),
      docsUrl: 'https://platform.openai.com/docs/mcp',
      addStep: {
        body: t(
          'Paste the server URL as a connector. ChatGPT dials your server from the internet, so localhost will not reach it.',
        ),
        command: url,
      },
    },
    {
      key: 'unknown',
      icon: GENERIC_ICON,
      name: t('Any MCP client'),
      group: 'other',
      hint: t('Streamable HTTP or SSE. Point it at the link and it works.'),
      docsUrl: 'https://modelcontextprotocol.io/clients',
      addStep: {
        body: t('Check your client’s docs for where the server URL goes.'),
        command: url,
      },
      config: { snippet: mcpServersJson(slug, { url }) },
    },
  ];
}

function localAuthStepBody(client: string): string {
  return t(
    '{client} opens your browser on the first tool call. Approve the project.',
    { client },
  );
}

const GROUP_ORDER: ClientGroupKey[] = ['terminal', 'editors', 'chat', 'other'];

const GROUP_COPY: Record<ClientGroupKey, GroupCopy> = {
  terminal: {
    label: () => t('Terminal'),
    tagline: () => t('one command, nothing to edit'),
    addStepTitle: () => t('Run this in your terminal'),
    kind: () => t('Terminal · runs locally'),
    authBody: ({ client }) => localAuthStepBody(client),
  },
  editors: {
    label: () => t('Editors'),
    tagline: () => t('we write the config for you'),
    addStepTitle: () => t('Add the server'),
    kind: (entry) =>
      entry.formFactor === 'extension'
        ? t('Editor extension · runs locally')
        : t('Editor · runs locally'),
    authBody: ({ client }) => localAuthStepBody(client),
  },
  chat: {
    label: () => t('Chat apps'),
    tagline: () => t('desktop and web, needs a public HTTPS URL'),
    addStepTitle: () => t('Add the connector'),
    kind: () => t('Desktop and web · needs a public HTTPS address'),
    authBody: ({ client, brand }) =>
      t(
        '{client} opens {brand} in your browser. Approve the project it can reach.',
        { client, brand },
      ),
  },
  other: {
    label: () => t('Anything else'),
    addStepTitle: () => t('Paste the server URL'),
    kind: () => t('Streamable HTTP · OAuth'),
    authBody: () =>
      t(
        'The client opens an OAuth prompt on the first tool call. Approve the project.',
      ),
  },
};

function addStepBody(entry: CatalogEntry): string {
  return (
    entry.addStep?.body ??
    t(
      'Add a Streamable HTTP MCP server pointing at this URL — the {client} docs say where its server list lives.',
      { client: entry.name },
    )
  );
}

function configLabel(config: EntryConfig): string {
  return config.path
    ? t('Or edit {path}', { path: config.path })
    : t('MCP server JSON');
}

function verifyPrompts(brandName: string): string[] {
  return [
    `"${t('What {brand} tools do you have?', { brand: brandName })}"`,
    `"${t('Post a note in Slack that the deploy finished.')}"`,
  ];
}

function toConnectableClient({
  entry,
  url,
  brandName,
}: {
  entry: CatalogEntry;
  url: string;
  brandName: string;
}): ConnectableClient {
  const groupCopy = GROUP_COPY[entry.group];
  return {
    key: entry.key,
    icon: entry.icon,
    name: entry.name,
    group: entry.group,
    hint: entry.hint,
    kind: groupCopy.kind(entry),
    docsUrl: entry.docsUrl,
    config: entry.config && {
      label: configLabel(entry.config),
      snippet: entry.config.snippet,
    },
    steps: [
      {
        title: groupCopy.addStepTitle(),
        body: addStepBody(entry),
        command: entry.addStep ? entry.addStep.command : url,
        action: entry.addStep?.action,
      },
      {
        title: t('Authenticate'),
        body:
          entry.auth ??
          groupCopy.authBody({ client: entry.name, brand: brandName }),
      },
      {
        title: t('Check it works'),
        body: t('If it answers with your tools, you’re set.'),
        prompts: verifyPrompts(brandName),
      },
    ],
  };
}

export const mcpClientCatalog = {
  clients: ({
    serverUrl,
    websiteName,
    isCloud,
  }: {
    serverUrl: string;
    websiteName: string;
    isCloud: boolean;
  }): ConnectableClient[] =>
    catalogEntries(serverUrl, {
      name: websiteName,
      slug: slugify(websiteName),
    })
      .map((entry) =>
        isCloud && entry.cloud ? { ...entry, ...entry.cloud } : entry,
      )
      .map((entry) =>
        toConnectableClient({ entry, url: serverUrl, brandName: websiteName }),
      ),

  groups: (): ClientGroup[] =>
    GROUP_ORDER.map((key) => ({
      key,
      label: GROUP_COPY[key].label(),
      tagline: GROUP_COPY[key].tagline?.(),
    })),
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

type Brand = {
  name: string;
  slug: string;
};

type ConnectAction = {
  label: string;
  href: string;
  requiresInternetReachableUrl?: boolean;
};

type GroupCopy = {
  label: () => string;
  tagline?: () => string;
  addStepTitle: () => string;
  kind: (entry: CatalogEntry) => string;
  authBody: (params: { client: string; brand: string }) => string;
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
  formFactor?: 'extension';
  hint: string;
  docsUrl: string;
  addStep?: {
    body: string;
    command?: string;
    action?: ConnectAction;
  };
  auth?: string;
  config?: EntryConfig;
  cloud?: Pick<CatalogEntry, 'addStep'> & { docsUrl?: string };
};
