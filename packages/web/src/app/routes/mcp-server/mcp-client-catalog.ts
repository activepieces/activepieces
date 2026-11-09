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

function gooseDeepLink({
  serverUrl,
  slug,
  brandName,
}: {
  serverUrl: string;
  slug: string;
  brandName: string;
}): string {
  const params = new URLSearchParams({
    url: serverUrl,
    type: 'streamable_http',
    id: slug,
    name: brandName,
    description: brandName,
  });
  return `goose://extension?${params.toString()}`;
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
  body?: string;
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
    label: t('Custom plugin'),
    install: {
      title: t('Add it as a plugin'),
      body: t(
        'Select +, then Add custom MCP server. Paste this URL and select Create as a plugin.',
      ),
      action: {
        label: t('Open Plugins'),
        href: CHATGPT_PLUGINS_URL,
        requiresInternetReachableUrl: true,
      },
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
      auth: {
        body: t(
          'Run /mcp in Claude Code and select Authenticate, or run this in your terminal. Then select Authorize in your browser.',
        ),
        command: `claude mcp login ${slug}`,
      },
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          install: {
            title: t('Run this in your terminal'),
            body: t('In your project folder.'),
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
          'Select Authorize in the browser that opens. If none opens, run this.',
        ),
        command: `codex mcp login ${slug}`,
      },
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          install: {
            title: t('Run this in your terminal'),
            command: `codex mcp add ${slug} --url ${url}`,
          },
        },
        configMethod({
          path: '~/.codex/config.toml',
          text: `[mcp_servers.${slug}]\nurl = "${url}"`,
        }),
      ],
    },
    {
      key: 'copilot-cli',
      ...MCP_CLIENT_BRANDING['copilot-cli'],
      group: 'terminal',
      agentName: 'Copilot',
      setupHint: t('One command'),
      docsUrl:
        'https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-mcp-servers',
      auth: {
        body: t('Run this, then select Authorize in your browser.'),
        command: `/mcp auth ${slug}`,
      },
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          install: {
            title: t('Run this in your terminal'),
            command: `copilot mcp add --transport http ${slug} ${url}`,
          },
        },
        configMethod({
          path: '~/.copilot/mcp-config.json',
          text: mcpServersJson({ slug, serverConfig: { type: 'http', url } }),
        }),
      ],
    },
    {
      key: 'goose',
      ...MCP_CLIENT_BRANDING.goose,
      group: 'terminal',
      setupHint: t('One-click install'),
      docsUrl: 'https://goose-docs.ai/docs/getting-started/using-extensions',
      methods: [
        {
          key: 'deeplink',
          label: t('One click'),
          install: {
            title: t('Install in one click'),
            action: {
              label: t('Add to goose'),
              href: gooseDeepLink({ serverUrl: url, slug, brandName: name }),
            },
          },
        },
        configMethod({
          path: '~/.config/goose/config.yaml',
          text: `extensions:\n  ${slug}:\n    type: streamable_http\n    name: ${JSON.stringify(
            name,
          )}\n    uri: ${url}\n    enabled: true\n    timeout: 300`,
          body: t('Merge this into your config, then restart goose.'),
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
        body: t('Run this, then select Authorize in your browser.'),
        command: `/mcp auth ${slug}`,
      },
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          install: {
            title: t('Run this in your terminal'),
            body: t('In your project folder.'),
            command: `gemini mcp add --transport http ${slug} ${url}`,
          },
        },
        configMethod({
          path: '~/.gemini/settings.json',
          text: mcpServersJson({ slug, serverConfig: { httpUrl: url } }),
        }),
      ],
    },
    {
      key: 'opencode',
      ...MCP_CLIENT_BRANDING.opencode,
      group: 'terminal',
      setupHint: t('One command'),
      docsUrl: 'https://opencode.ai/docs/mcp-servers/',
      auth: {
        body: t('Run this, then select Authorize in your browser.'),
        command: `opencode mcp auth ${slug}`,
      },
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          install: {
            title: t('Run this in your terminal'),
            command: `opencode mcp add ${slug} --url ${url}`,
          },
        },
        configMethod({
          path: '~/.config/opencode/opencode.json',
          text: prettyJson({
            mcp: { [slug]: { type: 'remote', url } },
          }),
        }),
      ],
    },
    {
      key: 'windsurf',
      ...MCP_CLIENT_BRANDING.windsurf,
      group: 'editors',
      searchTerms: ['windsurf'],
      agentName: 'Devin',
      setupHint: t('Config file'),
      docsUrl: 'https://docs.devin.ai/desktop/devin-local/customizations',
      methods: [
        configMethod({
          path: '~/.config/devin/mcp_config.json',
          text: mcpServersJson({ slug, serverConfig: { url } }),
        }),
      ],
    },
    {
      key: 'cursor',
      ...MCP_CLIENT_BRANDING.cursor,
      group: 'editors',
      setupHint: t('One-click install'),
      docsUrl: hasListings
        ? CURSOR_DIRECTORY_URL
        : 'https://cursor.com/docs/mcp',
      methods: [
        {
          key: 'deeplink',
          label: t('One click'),
          install: {
            title: t('Install in one click'),
            action: {
              label: t('Add to Cursor'),
              href: cursorDeepLink({ serverUrl: url, slug }),
            },
          },
        },
        configMethod({
          path: '~/.cursor/mcp.json',
          text: mcpServersJson({ slug, serverConfig: { url } }),
          body: t('Then reload Cursor.'),
        }),
      ],
    },
    {
      key: 'vscode',
      ...MCP_CLIENT_BRANDING.vscode,
      group: 'editors',
      agentName: 'Copilot',
      setupHint: t('One-click install'),
      docsUrl:
        'https://code.visualstudio.com/docs/agent-customization/mcp-servers',
      methods: [
        {
          key: 'deeplink',
          label: t('One click'),
          install: {
            title: t('Install in one click'),
            action: {
              label: t('Add to VS Code'),
              href: vscodeDeepLink({ serverUrl: url, slug }),
            },
          },
        },
        configMethod({
          path: '.vscode/mcp.json',
          text: prettyJson({ servers: { [slug]: { type: 'http', url } } }),
          body: t('Then select Start above the server entry.'),
        }),
      ],
    },
    {
      key: 'cline',
      ...MCP_CLIENT_BRANDING.cline,
      group: 'editors',
      hasAgentSetup: false,
      setupHint: t('Config file'),
      docsUrl: 'https://docs.cline.bot/mcp/mcp-overview',
      auth: {
        body: t(
          'In MCP Servers, select Authenticate, then Authorize in your browser.',
        ),
      },
      methods: [
        configMethod({
          path: 'cline_mcp_settings.json',
          text: mcpServersJson({
            slug,
            serverConfig: { type: 'streamableHttp', url },
          }),
          body: t('Open it from MCP Servers → Configure MCP Servers.'),
        }),
        {
          key: 'terminal',
          label: t('Terminal'),
          install: {
            title: t('Run this in your terminal'),
            body: t('Needs the Cline CLI.'),
            command: `cline mcp add ${slug} ${url} --transport http --yes`,
          },
        },
      ],
    },
    {
      key: 'zed',
      ...MCP_CLIENT_BRANDING.zed,
      group: 'editors',
      setupHint: t('Config file'),
      docsUrl: 'https://zed.dev/docs/ai/mcp',
      methods: [
        configMethod({
          path: '~/.config/zed/settings.json',
          text: prettyJson({ context_servers: { [slug]: { url } } }),
          body: t('Merge this into your settings.'),
        }),
      ],
    },
    {
      key: 'antigravity',
      ...MCP_CLIENT_BRANDING.antigravity,
      group: 'editors',
      setupHint: t('Config file'),
      docsUrl: 'https://antigravity.google/docs/mcp',
      auth: {
        body: t(
          'In Agent settings → Customizations, select Authenticate. Sign in, then paste the code back.',
        ),
      },
      methods: [
        configMethod({
          path: '~/.gemini/config/mcp_config.json',
          text: mcpServersJson({ slug, serverConfig: { serverUrl: url } }),
          body: t(
            'Open it from MCP Servers → Manage MCP Servers → View raw config.',
          ),
        }),
      ],
    },
    {
      key: 'claude',
      ...MCP_CLIENT_BRANDING.claude,
      group: 'chat',
      setupHint: hasListings ? t('One-click install') : t('Add a connector'),
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
      setupHint: hasListings ? t('One-click install') : t('Add a plugin'),
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
      searchTerms: ['custom', 'remote', 'url', 'http'],
      setupHint: t('Streamable HTTP. Point it at the server URL and it works.'),
      docsUrl:
        'https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-remote-servers',
      methods: [
        {
          key: 'url',
          label: t('Server URL'),
          install: {
            title: t('Paste the server URL'),
            command: url,
          },
        },
        {
          key: 'config',
          label: t('Config file'),
          install: {
            title: t('Add it to the client’s MCP config'),
            snippet: mcpServersJson({ slug, serverConfig: { url } }),
          },
        },
      ],
    },
  ];
}

const GROUP_ORDER: ClientGroupKey[] = ['chat', 'terminal', 'editors', 'other'];

const GROUP_COPY: Record<ClientGroupKey, GroupCopy> = {
  terminal: {
    label: () => t('Terminal'),
  },
  editors: {
    label: () => t('Editors'),
  },
  chat: {
    label: () => t('Chat apps'),
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
          t('Sign in and select Authorize when your browser opens.'),
        command: entry.auth?.command,
      },
      {
        title: t('Check it works'),
        body: t('Ask this. If it lists your tools, you’re set.'),
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
  if (
    (entry.group !== 'terminal' && entry.group !== 'editors') ||
    entry.hasAgentSetup === false
  ) {
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
      body: t('You may need to restart {client} after.', {
        client: entry.name,
      }),
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
  const install = methods.find(
    (method) => method.install.command || method.install.snippet,
  )?.install;
  const command = install?.command;
  if (command) {
    return {
      intro: t('Add the {brand} MCP server for me by running this command:', {
        brand: brandName,
      }),
      code: command,
      outro: t('Then tell me how to sign in.'),
    };
  }
  if (install?.snippet && install.path) {
    return {
      intro: t(
        'Add the {brand} MCP server for me. Merge this into {path} and keep any servers that are already there. Create the file if it doesn’t exist:',
        { brand: brandName, path: install.path },
      ),
      code: install.snippet,
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
    searchTerms: entry.searchTerms ?? [],
    methods: withAgentMethod({ entry, brandName }).map((method) =>
      toMethod({ entry, method, brandName }),
    ),
  };
}

function serverSlug(websiteName: string): string {
  return slugify(websiteName) || FALLBACK_SLUG;
}

export const mcpClientCatalog = {
  serverSlug,
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
      brand: { name: websiteName, slug: serverSlug(websiteName) },
      isCloud,
    }).map((entry) => toCatalogClient({ entry, brandName: websiteName })),

  groups: (): ClientGroup[] =>
    GROUP_ORDER.map((key) => ({
      key,
      label: GROUP_COPY[key].label(),
    })),
};

const LISTED_BRAND_NAME = 'Activepieces';
const CLAUDE_DIRECTORY_URL =
  'https://claude.ai/directory/cloud-activepieces-com';
const CURSOR_DIRECTORY_URL =
  'https://cursor.directory/plugins/activepieces-mcp-connector-for-cursor';
const CHATGPT_APP_URL =
  'https://chatgpt.com/plugins/plugin_asdk_app_6abd993104c481919ffbfd1c90241e27';
const CHATGPT_PLUGINS_URL = 'https://chatgpt.com/plugins';
export type ClientGroupKey = 'terminal' | 'editors' | 'chat' | 'other';

export type ClientGroup = {
  key: ClientGroupKey;
  label: string;
};

export type SetupInstruction = {
  title: string;
  body?: string;
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
  searchTerms: string[];
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
};

type MethodEntry = {
  key: string;
  label: string;
  install: {
    title: string;
    body?: string;
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
  searchTerms?: string[];
  auth?: { body: string; command?: string };
  agentName?: string;
  hasAgentSetup?: boolean;
  methods: MethodEntry[];
};

export type AgentPrompt = {
  intro: string;
  code: string;
  outro: string;
};
