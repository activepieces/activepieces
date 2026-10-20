import { slugify } from '@activepieces/core-utils';
import { t } from 'i18next';

import { MCP_CLIENT_BRANDING } from './mcp-client-display';

const GENERIC_ICON = MCP_CLIENT_BRANDING.unknown.icon;
const FALLBACK_SLUG = 'activepieces';

function claudeDeepLink({
  serverUrl,
  brandName,
}: {
  serverUrl: string;
  brandName: string;
}): string {
  const params = new URLSearchParams({
    modal: 'add-custom-connector',
    connectorName: brandName,
    connectorUrl: serverUrl,
  });
  return `https://claude.ai/customize/connectors?${params.toString()}`;
}

function cursorDeepLink({
  serverUrl,
  slug,
}: {
  serverUrl: string;
  slug: string;
}): string {
  const config = btoa(JSON.stringify({ url: serverUrl }));
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${slug}&config=${encodeURIComponent(
    config,
  )}`;
}

function vscodeDeepLink({
  serverUrl,
  slug,
}: {
  serverUrl: string;
  slug: string;
}): string {
  const config = JSON.stringify({ name: slug, type: 'http', url: serverUrl });
  return `vscode:mcp/install?${encodeURIComponent(config)}`;
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function mcpServersJson({
  slug,
  serverConfig,
}: {
  slug: string;
  serverConfig: object;
}): string {
  return prettyJson({ mcpServers: { [slug]: serverConfig } });
}

function configMethod({
  path,
  text,
  body,
}: {
  path: string;
  text: string;
  body: string;
}): MethodEntry {
  return {
    key: 'config',
    label: t('Config file'),
    install: {
      title: t('Add it to {path}', { path }),
      body,
      snippet: text,
      path,
    },
  };
}

function catalogEntries({
  url,
  brand: { name, slug },
  isCloud,
}: {
  url: string;
  brand: Brand;
  isCloud: boolean;
}): CatalogEntry[] {
  const hasListings = isCloud && name === LISTED_BRAND_NAME;
  const claudeConnector: MethodEntry = {
    key: 'connector',
    label: t('Custom connector'),
    install: {
      title: t('Add a custom connector'),
      body: t(
        'Opens Claude with the connector filled in. You can also paste the server URL yourself.',
      ),
      action: {
        label: t('Add to Claude'),
        href: claudeDeepLink({ serverUrl: url, brandName: name }),
        requiresInternetReachableUrl: true,
      },
      command: url,
    },
  };
  const chatgptConnector: MethodEntry = {
    key: 'connector',
    label: t('Custom connector'),
    install: {
      title: t('Add a custom connector'),
      body: t('In ChatGPT settings, create a connector with this URL.'),
      command: url,
    },
  };

  return [
    {
      key: 'claude-code',
      ...MCP_CLIENT_BRANDING['claude-code'],
      group: 'terminal',
      setupHint: t('One command'),
      docsUrl: 'https://code.claude.com/docs/en/mcp',
      auth: { body: t('Run /mcp inside Claude Code and pick Authenticate.') },
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          install: {
            title: t('Run this in your terminal'),
            body: t('From the folder you want the tools available in.'),
            command: `claude mcp add --transport http ${slug} ${url}`,
          },
        },
        configMethod({
          path: '.mcp.json',
          text: mcpServersJson({ slug, serverConfig: { type: 'http', url } }),
          body: t('At the root of the project.'),
        }),
      ],
    },
    {
      key: 'codex',
      ...MCP_CLIENT_BRANDING.codex,
      group: 'terminal',
      setupHint: t('One command'),
      docsUrl: 'https://learn.chatgpt.com/docs/extend/mcp?surface=cli',
      auth: {
        body: t(
          'Run this to sign in, then approve the project in your browser.',
        ),
        command: `codex mcp login ${slug}`,
      },
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          install: {
            title: t('Run this in your terminal'),
            body: t('From the folder you want the tools available in.'),
            command: `codex mcp add ${slug} --url ${url}`,
          },
        },
        configMethod({
          path: '~/.codex/config.toml',
          text: `[mcp_servers.${slug}]\nurl = "${url}"`,
          body: t('Create the file if it doesn’t exist.'),
        }),
      ],
    },
    {
      key: 'gemini-cli',
      ...MCP_CLIENT_BRANDING['gemini-cli'],
      group: 'terminal',
      setupHint: t('One command'),
      docsUrl: 'https://geminicli.com/docs/tools/mcp-server/',
      auth: {
        body: t(
          'Run this inside Gemini CLI, then approve the project in your browser.',
        ),
        command: `/mcp auth ${slug}`,
      },
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          install: {
            title: t('Run this in your terminal'),
            body: t('From the folder you want the tools available in.'),
            command: `gemini mcp add --transport http ${slug} ${url}`,
          },
        },
        configMethod({
          path: '~/.gemini/settings.json',
          text: mcpServersJson({ slug, serverConfig: { httpUrl: url } }),
          body: t('Create the file if it doesn’t exist.'),
        }),
      ],
    },
    {
      key: 'opencode',
      ...MCP_CLIENT_BRANDING.opencode,
      group: 'terminal',
      setupHint: t('Config file'),
      docsUrl: 'https://opencode.ai/docs/mcp-servers/',
      auth: {
        body: t(
          'Run this to sign in, then approve the project in your browser.',
        ),
        command: `opencode mcp auth ${slug}`,
      },
      methods: [
        configMethod({
          path: '~/.config/opencode/opencode.json',
          text: prettyJson({
            mcp: { [slug]: { type: 'remote', url, oauth: {} } },
          }),
          body: t('Create the file if it doesn’t exist.'),
        }),
      ],
    },
    {
      key: 'windsurf',
      ...MCP_CLIENT_BRANDING.windsurf,
      group: 'editors',
      agentName: 'Cascade',
      setupHint: t('Config file'),
      docsUrl: 'https://docs.windsurf.com/windsurf/cascade/mcp',
      methods: [
        configMethod({
          path: '~/.codeium/windsurf/mcp_config.json',
          text: mcpServersJson({ slug, serverConfig: { serverUrl: url } }),
          body: t(
            'Open Cascade, click the plugins icon, then Manage plugins → View raw config.',
          ),
        }),
      ],
    },
    {
      key: 'cursor',
      ...MCP_CLIENT_BRANDING.cursor,
      group: 'editors',
      setupHint: t('One click install'),
      docsUrl: hasListings
        ? CURSOR_DIRECTORY_URL
        : 'https://cursor.com/docs/mcp',
      methods: [
        {
          key: 'deeplink',
          label: t('One click'),
          install: {
            title: t('Install in one click'),
            body: t(
              'Opens Cursor and writes the server into ~/.cursor/mcp.json.',
            ),
            action: {
              label: t('Add to Cursor'),
              href: cursorDeepLink({ serverUrl: url, slug }),
            },
          },
        },
        configMethod({
          path: '~/.cursor/mcp.json',
          text: mcpServersJson({ slug, serverConfig: { url } }),
          body: t('Save the file, then reload Cursor.'),
        }),
      ],
    },
    {
      key: 'vscode',
      ...MCP_CLIENT_BRANDING.vscode,
      group: 'editors',
      agentName: 'Copilot',
      setupHint: t('One click install'),
      docsUrl:
        'https://code.visualstudio.com/docs/agent-customization/mcp-servers',
      methods: [
        {
          key: 'deeplink',
          label: t('One click'),
          install: {
            title: t('Install in one click'),
            body: t(
              'Opens VS Code and writes the server into .vscode/mcp.json for this workspace.',
            ),
            action: {
              label: t('Add to VS Code'),
              href: vscodeDeepLink({ serverUrl: url, slug }),
            },
          },
        },
        configMethod({
          path: '.vscode/mcp.json',
          text: prettyJson({ servers: { [slug]: { type: 'http', url } } }),
          body: t('Save the file, then select Start above the server entry.'),
        }),
      ],
    },
    {
      key: 'claude',
      ...MCP_CLIENT_BRANDING.claude,
      group: 'chat',
      setupHint: hasListings ? t('One click install') : t('Add a connector'),
      docsUrl: hasListings
        ? CLAUDE_DIRECTORY_URL
        : 'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
      methods: hasListings
        ? [
            {
              key: 'directory',
              label: t('One click'),
              install: {
                title: t('Add it from the Claude directory'),
                body: t('{brand} is already listed there.', { brand: name }),
                action: {
                  label: t('Open the directory'),
                  href: CLAUDE_DIRECTORY_URL,
                },
              },
            },
            claudeConnector,
          ]
        : [claudeConnector],
    },
    {
      key: 'chatgpt',
      ...MCP_CLIENT_BRANDING.chatgpt,
      group: 'chat',
      setupHint: hasListings ? t('One click install') : t('Add a connector'),
      docsUrl: 'https://developers.openai.com/plugins/deploy/connect-chatgpt',
      methods: hasListings
        ? [
            {
              key: 'app',
              label: t('One click'),
              install: {
                title: t('Open the app in ChatGPT'),
                body: t('Select Connect on the {brand} app.', { brand: name }),
                action: { label: t('Open in ChatGPT'), href: CHATGPT_APP_URL },
              },
            },
            chatgptConnector,
          ]
        : [chatgptConnector],
    },
    {
      key: 'unknown',
      icon: GENERIC_ICON,
      name: t('Any MCP client'),
      group: 'other',
      setupHint: t(
        'Streamable HTTP or SSE. Point it at the link and it works.',
      ),
      docsUrl:
        'https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-remote-servers',
      methods: [
        {
          key: 'url',
          label: t('Server URL'),
          install: {
            title: t('Paste the server URL'),
            body: t('Check your client’s docs for where the server URL goes.'),
            command: url,
          },
        },
        {
          key: 'config',
          label: t('Config file'),
          install: {
            title: t('Add it to the client’s MCP config'),
            body: t('For clients configured with an mcpServers file.'),
            snippet: mcpServersJson({ slug, serverConfig: { url } }),
          },
        },
      ],
    },
  ];
}

function defaultAuthBody({
  group,
  client,
  brand,
}: {
  group: ClientGroupKey;
  client: string;
  brand: string;
}): string {
  switch (group) {
    case 'chat':
      return t(
        '{client} opens {brand} in your browser. Sign in and approve the project.',
        { client, brand },
      );
    case 'other':
      return t(
        'Your client opens a sign-in page on the first tool call. Sign in and approve the project.',
      );
    case 'terminal':
    case 'editors':
      return t(
        'Your browser opens on the first tool call. Sign in and approve the project.',
      );
  }
}

const GROUP_ORDER: ClientGroupKey[] = ['terminal', 'editors', 'chat', 'other'];

const GROUP_COPY: Record<ClientGroupKey, GroupCopy> = {
  terminal: {
    label: () => t('Terminal'),
    tagline: () => t('one command, nothing to edit'),
  },
  editors: {
    label: () => t('Editors'),
    tagline: () => t('we write the config for you'),
  },
  chat: {
    label: () => t('Chat apps'),
    tagline: () => t('desktop and web, needs a public HTTPS URL'),
  },
  other: {
    label: () => t('Anything else'),
  },
};

function toMethod({
  entry,
  method,
  brandName,
}: {
  entry: CatalogEntry;
  method: MethodEntry;
  brandName: string;
}): SetupMethod {
  return {
    key: method.key,
    label: method.label,
    instructions: [
      {
        title: method.install.title,
        body: method.install.body,
        command: method.install.command,
        snippet: method.install.snippet,
        agentPrompt: method.install.agentPrompt,
        action: method.install.action,
      },
      {
        title: t('Sign in'),
        body:
          entry.auth?.body ??
          defaultAuthBody({
            group: entry.group,
            client: entry.name,
            brand: brandName,
          }),
        command: entry.auth?.command,
      },
      {
        title: t('Check it works'),
        body: t('Ask this. If it answers with your tools, you’re set.'),
        prompt: t('What {brand} tools do you have?', { brand: brandName }),
      },
    ],
  };
}

function withAgentMethod({
  entry,
  brandName,
}: {
  entry: CatalogEntry;
  brandName: string;
}): MethodEntry[] {
  if (entry.group !== 'terminal' && entry.group !== 'editors') {
    return entry.methods;
  }
  const prompt = agentPrompt({ methods: entry.methods, brandName });
  if (prompt === null) {
    return entry.methods;
  }
  const agent = entry.agentName ?? entry.name;
  const agentMethod: MethodEntry = {
    key: 'agent',
    label: t('Ask the agent'),
    install: {
      title: t('Paste this into {agent}', { agent }),
      body: t(
        'It adds the server for you. You may need to restart {client} after.',
        { client: entry.name },
      ),
      agentPrompt: prompt,
    },
  };
  const [first, ...rest] = entry.methods;
  return [first, agentMethod, ...rest];
}

function agentPrompt({
  methods,
  brandName,
}: {
  methods: MethodEntry[];
  brandName: string;
}): AgentPrompt | null {
  const command = methods.find((method) => method.install.command)?.install
    .command;
  if (command) {
    return {
      intro: t('Add the {brand} MCP server for me by running this command:', {
        brand: brandName,
      }),
      code: command,
      outro: t('Then tell me how to sign in.'),
    };
  }
  const config = methods.find((method) => method.install.snippet)?.install;
  if (config?.snippet && config.path) {
    return {
      intro: t(
        'Add the {brand} MCP server for me. Put this in {path}, and create the file if it doesn’t exist:',
        { brand: brandName, path: config.path },
      ),
      code: config.snippet,
      outro: t('Then tell me if I need to reload, and how to sign in.'),
    };
  }
  return null;
}

function toCatalogClient({
  entry,
  brandName,
}: {
  entry: CatalogEntry;
  brandName: string;
}): CatalogClient {
  return {
    key: entry.key,
    icon: entry.icon,
    name: entry.name,
    group: entry.group,
    setupHint: entry.setupHint,
    docsUrl: entry.docsUrl,
    methods: withAgentMethod({ entry, brandName }).map((method) =>
      toMethod({ entry, method, brandName }),
    ),
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
  }): CatalogClient[] =>
    catalogEntries({
      url: serverUrl,
      brand: { name: websiteName, slug: slugify(websiteName) || FALLBACK_SLUG },
      isCloud,
    }).map((entry) => toCatalogClient({ entry, brandName: websiteName })),

  groups: (): ClientGroup[] =>
    GROUP_ORDER.map((key) => ({
      key,
      label: GROUP_COPY[key].label(),
      tagline: GROUP_COPY[key].tagline?.(),
    })),
};

const LISTED_BRAND_NAME = 'Activepieces';
const CLAUDE_DIRECTORY_URL =
  'https://claude.ai/directory/cloud-activepieces-com';
const CURSOR_DIRECTORY_URL =
  'https://cursor.directory/plugins/activepieces-mcp-connector-for-cursor';
const CHATGPT_APP_URL =
  'https://chatgpt.com/plugins/plugin_asdk_app_6abd993104c481919ffbfd1c90241e27';
export type ClientGroupKey = 'terminal' | 'editors' | 'chat' | 'other';

export type ClientGroup = {
  key: ClientGroupKey;
  label: string;
  tagline?: string;
};

export type SetupInstruction = {
  title: string;
  body: string;
  command?: string;
  snippet?: string;
  prompt?: string;
  agentPrompt?: AgentPrompt;
  action?: SetupLink;
};

export type SetupMethod = {
  key: string;
  label: string;
  instructions: SetupInstruction[];
};

export type CatalogClient = {
  key: string;
  icon: string;
  name: string;
  group: ClientGroupKey;
  setupHint: string;
  docsUrl: string;
  methods: SetupMethod[];
};

type Brand = {
  name: string;
  slug: string;
};

type SetupLink = {
  label: string;
  href: string;
  requiresInternetReachableUrl?: boolean;
};

type GroupCopy = {
  label: () => string;
  tagline?: () => string;
};

type MethodEntry = {
  key: string;
  label: string;
  install: {
    title: string;
    body: string;
    command?: string;
    action?: SetupLink;
    snippet?: string;
    path?: string;
    agentPrompt?: AgentPrompt;
  };
};

type CatalogEntry = {
  key: string;
  icon: string;
  name: string;
  group: ClientGroupKey;
  setupHint: string;
  docsUrl: string;
  auth?: { body: string; command?: string };
  agentName?: string;
  methods: MethodEntry[];
};

export type AgentPrompt = {
  intro: string;
  code: string;
  outro: string;
};
