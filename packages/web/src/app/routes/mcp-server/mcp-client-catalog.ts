import { slugify } from '@activepieces/core-utils';
import { t } from 'i18next';

import { MCP_CLIENT_BRANDING } from './mcp-client-display';

const FALLBACK_SLUG = 'activepieces';
const LOCAL_ICONS_URL = '/mcp-clients';

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

function approveStep(brand: string): SetupStep {
  return {
    body: t(
      'Your browser opens on the first tool call. Sign in to {brand} and approve the project.',
      { brand },
    ),
  };
}

function agentMethod({
  client,
  prompt,
}: {
  client: string;
  prompt: string;
}): SetupMethod {
  return {
    key: 'agent',
    label: t('Ask the agent'),
    hint: t('Paste one prompt and {client} sets itself up.', { client }),
    steps: [
      {
        body: t('Paste this into {client}.', { client }),
        block: { kind: 'prompt', label: t('Prompt'), text: prompt },
      },
      {
        body: t(
          '{client} writes the config, then walks you through signing in.',
          { client },
        ),
      },
    ],
  };
}

function configMethod({
  hint,
  body,
  path,
  snippet,
  brand,
}: {
  hint: string;
  body: string;
  path: string;
  snippet: string;
  brand: string;
}): SetupMethod {
  return {
    key: 'config',
    label: t('Config file'),
    hint,
    steps: [
      { body, block: { kind: 'code', label: path, text: snippet } },
      approveStep(brand),
    ],
  };
}

function catalogEntries({
  url,
  brand,
  slug,
}: {
  url: string;
  brand: string;
  slug: string;
}): CatalogEntry[] {
  const urlBlock: SetupBlock = {
    kind: 'url',
    label: t('Server URL'),
    text: url,
  };
  return [
    {
      key: 'claude',
      ...MCP_CLIENT_BRANDING.claude,
      popular: true,
      needsPublicUrl: true,
      hint: t('Add a connector'),
      selfHostedVideoUrl: SELF_HOSTED_SETUP_VIDEOS.claude,
      docsUrl:
        'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
      methods: [
        {
          key: 'deeplink',
          label: t('One click'),
          hint: t('Opens Claude with the connector filled in.'),
          steps: [
            {
              body: t(
                'This opens Claude’s connector settings with your server URL filled in.',
              ),
              action: {
                label: t('Add to Claude'),
                href: claudeDeepLink({ serverUrl: url, brandName: brand }),
              },
            },
            {
              body: t(
                'Hit Add, then sign in to {brand} and approve the project.',
                { brand },
              ),
            },
          ],
        },
        {
          key: 'connector',
          label: t('Custom connector'),
          hint: t('Works on Claude, Claude Desktop and Cowork.'),
          steps: [
            {
              body: t(
                'Open Settings → Connectors → Add custom connector, then paste this URL.',
              ),
              block: urlBlock,
            },
            {
              body: t(
                'Hit Add, then sign in to {brand} and approve the project.',
                { brand },
              ),
            },
          ],
        },
      ],
      cloudMethods: [
        {
          key: 'directory',
          label: t('Claude directory'),
          hint: t('This server is already listed in Claude’s directory.'),
          steps: [
            {
              body: t('Open the listing and add it to Claude in one click.'),
              action: {
                label: t('Add from the Claude directory'),
                href: CLOUD_LISTINGS.claude,
              },
            },
            {
              body: t(
                'Hit Add, then sign in to {brand} and approve the project.',
                { brand },
              ),
            },
          ],
        },
      ],
      cloudDocsUrl: CLOUD_LISTINGS.claude,
    },
    {
      key: 'claude-code',
      ...MCP_CLIENT_BRANDING['claude-code'],
      popular: true,
      hint: t('One command'),
      docsUrl: 'https://code.claude.com/docs/en/mcp',
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          hint: t('One line from the folder you want the tools in.'),
          steps: [
            {
              body: t(
                'Run this from the folder you want the tools available in.',
              ),
              block: {
                kind: 'terminal',
                label: t('Terminal'),
                text: `claude mcp add --transport http ${slug} ${url}`,
              },
            },
            {
              body: t(
                'Run /mcp inside Claude Code and pick Authenticate, or run claude mcp login {slug}.',
                { slug },
              ),
            },
          ],
        },
        agentMethod({
          client: 'Claude Code',
          prompt: t(
            'Set up the {brand} MCP server for me by running: {command} and then tell me to run /mcp and authenticate.',
            {
              brand,
              command: `claude mcp add --transport http ${slug} ${url}`,
            },
          ),
        }),
      ],
    },
    {
      key: 'cursor',
      ...MCP_CLIENT_BRANDING.cursor,
      popular: true,
      hint: t('One click install'),
      docsUrl: 'https://cursor.com/docs/mcp',
      cloudDocsUrl: CLOUD_LISTINGS.cursor,
      methods: [
        {
          key: 'deeplink',
          label: t('One click'),
          hint: t('Opens Cursor and writes the config for you.'),
          steps: [
            {
              body: t(
                'This opens Cursor and writes the server into ~/.cursor/mcp.json.',
              ),
              action: {
                label: t('Add to Cursor'),
                href: cursorDeepLink({ serverUrl: url, slug }),
              },
            },
            approveStep(brand),
          ],
        },
        agentMethod({
          client: 'Cursor',
          prompt: t(
            'Add the {brand} MCP server to my Cursor config. In ~/.cursor/mcp.json, add a "{slug}" entry under mcpServers with the url {url}. Then tell me how to reload Cursor and authenticate.',
            { brand, slug, url },
          ),
        }),
        configMethod({
          hint: t('Edit the config yourself if the deep link is blocked.'),
          body: t('Add the server to your Cursor config, then reload Cursor.'),
          path: '~/.cursor/mcp.json',
          snippet: mcpServersJson({ slug, serverConfig: { url } }),
          brand,
        }),
      ],
    },
    {
      key: 'vscode',
      ...MCP_CLIENT_BRANDING.vscode,
      popular: true,
      hint: t('Works in Copilot'),
      docsUrl:
        'https://code.visualstudio.com/docs/agent-customization/mcp-servers',
      methods: [
        {
          key: 'deeplink',
          label: t('One click'),
          hint: t('Opens VS Code and writes the config for you.'),
          steps: [
            {
              body: t(
                'This opens VS Code and adds the server for this workspace.',
              ),
              action: {
                label: t('Add to VS Code'),
                href: vscodeDeepLink({ serverUrl: url, slug }),
              },
            },
            approveStep(brand),
          ],
        },
        {
          key: 'config',
          label: t('Config file'),
          hint: t('Add it to the workspace yourself, then hit Start.'),
          steps: [
            {
              body: t(
                'Create .vscode/mcp.json, then click Start above the server entry.',
              ),
              block: {
                kind: 'code',
                label: '.vscode/mcp.json',
                text: prettyJson({
                  servers: { [slug]: { type: 'http', url } },
                }),
              },
            },
            {
              body: t(
                'VS Code runs the sign-in in your browser. Approve the project.',
              ),
            },
          ],
        },
        agentMethod({
          client: 'Copilot',
          prompt: t(
            'Add the {brand} MCP server to this workspace. In .vscode/mcp.json, add a "{slug}" entry under servers with type "http" and the url {url}. Then tell me how to start it and authenticate.',
            { brand, slug, url },
          ),
        }),
      ],
    },
    {
      key: 'chatgpt',
      ...MCP_CLIENT_BRANDING.chatgpt,
      popular: true,
      needsPublicUrl: true,
      hint: t('Add a connector'),
      selfHostedVideoUrl: SELF_HOSTED_SETUP_VIDEOS.chatgpt,
      docsUrl: 'https://learn.chatgpt.com/docs/extend/mcp?surface=chatgpt',
      methods: [
        {
          key: 'connector',
          label: t('Connector'),
          hint: t('Add {brand} as a custom connector in settings.', { brand }),
          steps: [
            {
              body: t(
                'In ChatGPT, open Settings → Connectors → Create, then paste this server URL.',
              ),
              block: urlBlock,
            },
            {
              body: t(
                'Hit Connect and sign in to {brand}. Approve the project it can reach.',
                { brand },
              ),
            },
          ],
        },
      ],
    },
    {
      key: 'codex',
      ...MCP_CLIENT_BRANDING.codex,
      name: 'Codex CLI',
      hint: t('One command'),
      docsUrl: 'https://learn.chatgpt.com/docs/extend/mcp?surface=cli',
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          hint: t('Add the server, then log in once.'),
          steps: [
            {
              body: t(
                'Run this from the folder you want the tools available in.',
              ),
              block: {
                kind: 'terminal',
                label: t('Terminal'),
                text: `codex mcp add ${slug} --url ${url}`,
              },
            },
            {
              body: t('Log in to {brand} and approve the project.', { brand }),
              block: {
                kind: 'terminal',
                label: t('Terminal'),
                text: `codex mcp login ${slug}`,
              },
            },
          ],
        },
        agentMethod({
          client: 'Codex',
          prompt: t(
            'Set up the {brand} MCP server for me by running: {command} and then run {login} and walk me through approving the project.',
            {
              brand,
              command: `codex mcp add ${slug} --url ${url}`,
              login: `codex mcp login ${slug}`,
            },
          ),
        }),
      ],
    },
    {
      key: 'cline',
      icon: `${LOCAL_ICONS_URL}/cline.svg`,
      name: 'Cline',
      hint: t('VS Code & JetBrains'),
      docsUrl: 'https://docs.cline.bot/mcp/mcp-overview',
      methods: [
        configMethod({
          hint: t('Cline panel → MCP Servers → Configure MCP Servers.'),
          body: t(
            'Add the server to cline_mcp_settings.json. The type has to be streamableHttp exactly, or Cline falls back to SSE and the connection fails.',
          ),
          path: 'cline_mcp_settings.json',
          snippet: mcpServersJson({
            slug,
            serverConfig: { type: 'streamableHttp', url },
          }),
          brand,
        }),
        agentMethod({
          client: 'Cline',
          prompt: t(
            'Add the {brand} MCP server to my Cline config. In cline_mcp_settings.json, add a "{slug}" entry under mcpServers with type "streamableHttp" and the url {url}. Then walk me through authenticating.',
            { brand, slug, url },
          ),
        }),
      ],
    },
    {
      key: 'antigravity',
      icon: `${LOCAL_ICONS_URL}/antigravity.png`,
      name: 'Antigravity',
      hint: t('Config file'),
      docsUrl: 'https://antigravity.google/docs/mcp/',
      methods: [
        configMethod({
          hint: t('One config covers Antigravity 2.0, the IDE and the CLI.'),
          body: t(
            'Add the server to your Antigravity config. Remote servers use serverUrl, not url.',
          ),
          path: '~/.gemini/config/mcp_config.json',
          snippet: mcpServersJson({ slug, serverConfig: { serverUrl: url } }),
          brand,
        }),
        agentMethod({
          client: 'Antigravity',
          prompt: t(
            'Add the {brand} MCP server to my Antigravity config. In ~/.gemini/config/mcp_config.json, add a "{slug}" entry under mcpServers with serverUrl {url}. Then walk me through authenticating.',
            { brand, slug, url },
          ),
        }),
      ],
    },
    {
      key: 'devin',
      icon: `${LOCAL_ICONS_URL}/devin.svg`,
      name: 'Devin Desktop',
      hint: t('Formerly Windsurf'),
      docsUrl: 'https://docs.devin.ai/desktop/cascade/mcp',
      methods: [
        configMethod({
          hint: t('Devin Settings → Cascade → MCP Servers.'),
          body: t(
            'Add the server to your config, then refresh the server list in Devin.',
          ),
          path: '~/.codeium/windsurf/mcp_config.json',
          snippet: mcpServersJson({ slug, serverConfig: { serverUrl: url } }),
          brand,
        }),
        agentMethod({
          client: 'Devin',
          prompt: t(
            'Add the {brand} MCP server to my Devin Desktop config. In ~/.codeium/windsurf/mcp_config.json, add a "{slug}" entry under mcpServers with serverUrl {url}. Then walk me through authenticating.',
            { brand, slug, url },
          ),
        }),
      ],
    },
    {
      key: 'gemini-cli',
      ...MCP_CLIENT_BRANDING['gemini-cli'],
      hint: t('One command'),
      docsUrl:
        'https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html',
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          hint: t('Pass --scope project to keep it to one repository.'),
          steps: [
            {
              body: t(
                'Run this from the folder you want the tools available in.',
              ),
              block: {
                kind: 'terminal',
                label: t('Terminal'),
                text: `gemini mcp add --transport http ${slug} ${url}`,
              },
            },
            approveStep(brand),
          ],
        },
        configMethod({
          hint: t('Edit the settings file yourself.'),
          body: t('Add the server to your Gemini CLI settings.'),
          path: '~/.gemini/settings.json',
          snippet: mcpServersJson({ slug, serverConfig: { httpUrl: url } }),
          brand,
        }),
      ],
    },
    {
      key: 'opencode',
      ...MCP_CLIENT_BRANDING.opencode,
      hint: t('Config file'),
      docsUrl: 'https://opencode.ai/docs/mcp-servers/',
      methods: [
        configMethod({
          hint: t('Add a remote server to your OpenCode config.'),
          body: t('Add the server to your OpenCode config.'),
          path: '~/.config/opencode/opencode.json',
          snippet: prettyJson({
            mcp: { [slug]: { type: 'remote', url, enabled: true } },
          }),
          brand,
        }),
        agentMethod({
          client: 'OpenCode',
          prompt: t(
            'Add the {brand} MCP server to my OpenCode config. In ~/.config/opencode/opencode.json, add a "{slug}" entry under mcp with type "remote", enabled true, and the url {url}. Then walk me through authenticating.',
            { brand, slug, url },
          ),
        }),
      ],
    },
    {
      key: 'unknown',
      icon: MCP_CLIENT_BRANDING.unknown.icon,
      name: t('Any MCP client'),
      hint: t('Streamable HTTP'),
      docsUrl:
        'https://modelcontextprotocol.io/docs/develop/connect-remote-servers',
      methods: [
        {
          key: 'url',
          label: t('Server URL'),
          hint: t('Works with any client that speaks Streamable HTTP.'),
          steps: [
            {
              body: t(
                'Add a Streamable HTTP MCP server pointing at this URL. Your client’s docs say where its server list lives.',
              ),
              block: urlBlock,
            },
            {
              body: t(
                'The server advertises OAuth and supports dynamic client registration, so a compliant client prompts you to sign in with no extra setup.',
              ),
            },
          ],
        },
      ],
    },
  ];
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
  }): CatalogClient[] => {
    return catalogEntries({
      url: serverUrl,
      brand: websiteName,
      slug: slugify(websiteName) || FALLBACK_SLUG,
    }).map(
      ({
        cloudMethods,
        cloudDocsUrl,
        selfHostedVideoUrl,
        popular,
        needsPublicUrl,
        methods,
        docsUrl,
        ...entry
      }) => ({
        ...entry,
        popular: popular === true,
        needsPublicUrl: needsPublicUrl === true,
        docsUrl: isCloud && cloudDocsUrl ? cloudDocsUrl : docsUrl,
        methods:
          isCloud && cloudMethods ? [...cloudMethods, ...methods] : methods,
        setupVideoUrl: isCloud ? undefined : selfHostedVideoUrl,
      }),
    );
  },
};

export type SetupBlock = {
  kind: 'terminal' | 'code' | 'url' | 'prompt';
  label: string;
  text: string;
};

export type SetupLink = {
  label: string;
  href: string;
};

export type SetupStep = {
  body: string;
  block?: SetupBlock;
  action?: SetupLink;
};

export type SetupMethod = {
  key: string;
  label: string;
  hint: string;
  steps: SetupStep[];
};

export type CatalogClient = {
  key: string;
  icon: string;
  name: string;
  hint: string;
  docsUrl: string;
  popular: boolean;
  needsPublicUrl: boolean;
  setupVideoUrl?: string;
  methods: SetupMethod[];
};

type CatalogEntry = {
  key: string;
  icon: string;
  name: string;
  hint: string;
  docsUrl: string;
  popular?: boolean;
  needsPublicUrl?: boolean;
  selfHostedVideoUrl?: string;
  methods: SetupMethod[];
  cloudMethods?: SetupMethod[];
  cloudDocsUrl?: string;
};
