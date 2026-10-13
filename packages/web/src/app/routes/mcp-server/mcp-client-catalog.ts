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

const CLOUD_LISTINGS = {
  claude: 'https://claude.ai/directory/cloud-activepieces-com',
  cursor:
    'https://cursor.directory/plugins/activepieces-mcp-connector-for-cursor',
};

const SELF_HOSTED_SETUP_VIDEOS = {
  claude:
    'https://cdn.activepieces.com/videos/mcp-tutorials/Claude%20MCP%20-%20Step%201.mp4',
  chatgpt:
    'https://cdn.activepieces.com/videos/mcp-tutorials/ChatGPT%20MCP%20-%20Step%201.mp4',
};

function catalogEntries({
  url,
  brand: { name, slug },
}: {
  url: string;
  brand: Brand;
}): CatalogEntry[] {
  return [
    {
      key: 'claude-code',
      ...MCP_CLIENT_BRANDING['claude-code'],
      group: 'terminal',
      setupHint: t('One command'),
      docsUrl: 'https://docs.claude.com/en/docs/claude-code/mcp',
      install: {
        body: t('From the folder you want the tools available in.'),
        command: `claude mcp add --transport http ${slug} ${url}`,
      },
      auth: t('Run /mcp inside Claude Code and pick Authenticate.'),
      config: {
        path: '.mcp.json',
        snippet: mcpServersJson({ slug, serverConfig: { type: 'http', url } }),
      },
    },
    {
      key: 'codex',
      ...MCP_CLIENT_BRANDING.codex,
      group: 'terminal',
      setupHint: t('One command'),
      docsUrl: 'https://developers.openai.com/codex/mcp',
      install: {
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
      ...MCP_CLIENT_BRANDING['gemini-cli'],
      group: 'terminal',
      setupHint: t('One command'),
      docsUrl:
        'https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html',
      install: {
        body: t('Pass --scope project to keep it to one repository.'),
        command: `gemini mcp add --transport http ${slug} ${url}`,
      },
      config: {
        path: '~/.gemini/settings.json',
        snippet: mcpServersJson({ slug, serverConfig: { httpUrl: url } }),
      },
    },
    {
      key: 'opencode',
      ...MCP_CLIENT_BRANDING.opencode,
      group: 'terminal',
      setupHint: t('Config file'),
      docsUrl: 'https://opencode.ai/docs/mcp-servers/',
      config: {
        path: '~/.config/opencode/opencode.json',
        snippet: prettyJson({
          mcp: { [slug]: { type: 'remote', url, enabled: true } },
        }),
      },
    },
    {
      key: 'windsurf',
      ...MCP_CLIENT_BRANDING.windsurf,
      group: 'editors',
      setupHint: t('Config file'),
      docsUrl: 'https://docs.windsurf.com/windsurf/cascade/mcp',
      install: {
        body: t(
          'Open Cascade, click the plugins icon, then Manage plugins → View raw config.',
        ),
        command: url,
      },
      config: {
        path: '~/.codeium/windsurf/mcp_config.json',
        snippet: mcpServersJson({ slug, serverConfig: { serverUrl: url } }),
      },
    },
    {
      key: 'cursor',
      ...MCP_CLIENT_BRANDING.cursor,
      group: 'editors',
      setupHint: t('One click install'),
      docsUrl: 'https://docs.cursor.com/context/mcp',
      install: {
        body: t('Opens Cursor and writes the server into ~/.cursor/mcp.json.'),
        action: {
          label: t('Add to Cursor'),
          href: cursorDeepLink({ serverUrl: url, slug }),
        },
      },
      cloud: { docsUrl: CLOUD_LISTINGS.cursor },
      config: {
        path: '~/.cursor/mcp.json',
        snippet: mcpServersJson({ slug, serverConfig: { url } }),
      },
    },
    {
      key: 'vscode',
      ...MCP_CLIENT_BRANDING.vscode,
      group: 'editors',
      setupHint: t('One click install'),
      docsUrl: 'https://code.visualstudio.com/docs/copilot/chat/mcp-servers',
      install: {
        body: t(
          'Opens VS Code and writes the server into .vscode/mcp.json for this workspace.',
        ),
        action: {
          label: t('Add to VS Code'),
          href: vscodeDeepLink({ serverUrl: url, slug }),
        },
      },
      config: {
        path: '.vscode/mcp.json',
        snippet: prettyJson({ servers: { [slug]: { type: 'http', url } } }),
      },
    },
    {
      key: 'claude',
      ...MCP_CLIENT_BRANDING.claude,
      group: 'chat',
      setupHint: t('Add a connector'),
      selfHostedVideoUrl: SELF_HOSTED_SETUP_VIDEOS.claude,
      docsUrl:
        'https://support.claude.com/en/articles/11175166-getting-started-with-custom-connectors-using-remote-mcp',
      install: {
        body: t(
          'Paste the server URL as a custom connector. This client dials your server from the internet, so localhost will not reach it.',
        ),
        action: {
          label: t('Add to Claude'),
          href: claudeDeepLink({ serverUrl: url, brandName: name }),
          requiresInternetReachableUrl: true,
        },
      },
      cloud: {
        docsUrl: CLOUD_LISTINGS.claude,
        install: {
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
      ...MCP_CLIENT_BRANDING.chatgpt,
      group: 'chat',
      setupHint: t('Add a connector'),
      selfHostedVideoUrl: SELF_HOSTED_SETUP_VIDEOS.chatgpt,
      docsUrl: 'https://platform.openai.com/docs/mcp',
      install: {
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
      setupHint: t(
        'Streamable HTTP or SSE. Point it at the link and it works.',
      ),
      docsUrl: 'https://modelcontextprotocol.io/clients',
      install: {
        body: t('Check your client’s docs for where the server URL goes.'),
        command: url,
      },
      config: { snippet: mcpServersJson({ slug, serverConfig: { url } }) },
    },
  ];
}

function localAuthBody(client: string): string {
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
    installTitle: () => t('Run this in your terminal'),
    subtitle: () => t('Terminal · runs locally'),
    authBody: ({ client }) => localAuthBody(client),
  },
  editors: {
    label: () => t('Editors'),
    tagline: () => t('we write the config for you'),
    installTitle: () => t('Add the server'),
    subtitle: () => t('Editor · runs locally'),
    authBody: ({ client }) => localAuthBody(client),
  },
  chat: {
    label: () => t('Chat apps'),
    tagline: () => t('desktop and web, needs a public HTTPS URL'),
    installTitle: () => t('Add the connector'),
    subtitle: () => t('Desktop and web · needs a public HTTPS address'),
    authBody: ({ client, brand }) =>
      t(
        '{client} opens {brand} in your browser. Approve the project it can reach.',
        { client, brand },
      ),
  },
  other: {
    label: () => t('Anything else'),
    installTitle: () => t('Paste the server URL'),
    subtitle: () => t('Streamable HTTP · OAuth'),
    authBody: () =>
      t(
        'The client opens an OAuth prompt on the first tool call. Approve the project.',
      ),
  },
};

function installBody(entry: CatalogEntry): string {
  return (
    entry.install?.body ??
    t(
      'Add a Streamable HTTP MCP server pointing at this URL — the {client} docs say where its server list lives.',
      { client: entry.name },
    )
  );
}

function configLabel(config: ConfigSnippet): string {
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

function toCatalogClient({
  entry,
  url,
  brandName,
  isCloud,
}: {
  entry: CatalogEntry;
  url: string;
  brandName: string;
  isCloud: boolean;
}): CatalogClient {
  const groupCopy = GROUP_COPY[entry.group];
  return {
    key: entry.key,
    icon: entry.icon,
    name: entry.name,
    group: entry.group,
    setupHint: entry.setupHint,
    subtitle: groupCopy.subtitle(),
    docsUrl: entry.docsUrl,
    setupVideoUrl: isCloud ? undefined : entry.selfHostedVideoUrl,
    config: entry.config && {
      label: configLabel(entry.config),
      snippet: entry.config.snippet,
    },
    instructions: [
      {
        title: groupCopy.installTitle(),
        body: installBody(entry),
        command: entry.install ? entry.install.command : url,
        action: entry.install?.action,
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
  }): CatalogClient[] =>
    catalogEntries({
      url: serverUrl,
      brand: { name: websiteName, slug: slugify(websiteName) || FALLBACK_SLUG },
    })
      .map((entry) =>
        isCloud && entry.cloud ? { ...entry, ...entry.cloud } : entry,
      )
      .map((entry) =>
        toCatalogClient({
          entry,
          url: serverUrl,
          brandName: websiteName,
          isCloud,
        }),
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

export type SetupInstruction = {
  title: string;
  body: string;
  command?: string;
  prompts?: string[];
  action?: SetupLink;
};

export type CatalogClient = {
  key: string;
  icon: string;
  name: string;
  group: ClientGroupKey;
  setupHint: string;
  subtitle: string;
  docsUrl: string;
  setupVideoUrl?: string;
  config?: {
    label: string;
    snippet: string;
  };
  instructions: SetupInstruction[];
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
  installTitle: () => string;
  subtitle: () => string;
  authBody: (params: { client: string; brand: string }) => string;
};

type ConfigSnippet = {
  path?: string;
  snippet: string;
};

type CatalogEntry = {
  key: string;
  icon: string;
  name: string;
  group: ClientGroupKey;
  setupHint: string;
  docsUrl: string;
  install?: {
    body: string;
    command?: string;
    action?: SetupLink;
  };
  auth?: string;
  selfHostedVideoUrl?: string;
  config?: ConfigSnippet;
  cloud?: Pick<CatalogEntry, 'install'> & { docsUrl?: string };
};
