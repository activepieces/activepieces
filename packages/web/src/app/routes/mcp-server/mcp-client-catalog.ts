import { slugify } from '@activepieces/core-utils';
import { McpOAuthClientKey } from '@activepieces/shared';
import { t } from 'i18next';

import { MCP_CLIENT_BRANDING } from './mcp-client-display';

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

function terminal(text: string): SetupBlock {
  return { kind: 'terminal', label: t('Terminal'), text };
}

function code({ label, text }: { label: string; text: string }): SetupBlock {
  return { kind: 'code', label, text };
}

function urlBlock(url: string): SetupBlock {
  return { kind: 'url', label: t('Server URL'), text: url };
}

function agentMethod({
  agent,
  prompt,
}: {
  agent: string;
  prompt: string;
}): SetupMethod {
  return {
    key: 'agent',
    label: t('Ask the agent'),
    hint: t('Paste one prompt and {agent} sets itself up.', { agent }),
    steps: [
      {
        body: t('Paste this into {agent}.', { agent }),
        block: { kind: 'prompt', label: t('Prompt'), text: prompt },
      },
      {
        body: t(
          '{agent} writes the config, then walks you through signing in.',
          { agent },
        ),
      },
    ],
  };
}

function approveStep(brand: string): SetupStep {
  return {
    body: t(
      'Your browser opens on the first tool call. Sign in to {brand} and approve the project.',
      { brand },
    ),
  };
}

function catalogEntries({
  url,
  brand,
  slug,
  isCloud,
}: {
  url: string;
  brand: string;
  slug: string;
  isCloud: boolean;
}): CatalogClient[] {
  const claudeConnector: SetupMethod = {
    key: 'connector',
    label: t('Custom connector'),
    hint: t('Works in Claude on the web, Claude Desktop and Cowork.'),
    steps: [
      {
        body: t(
          'Open Settings → Connectors → Add custom connector, then paste this URL.',
        ),
        block: urlBlock(url),
        action: {
          label: t('Open Claude connectors'),
          href: claudeDeepLink({ serverUrl: url, brandName: brand }),
          requiresInternetReachableUrl: true,
        },
      },
      {
        body: t(
          'Select Add, then sign in to {brand} and approve the project.',
          {
            brand,
          },
        ),
      },
    ],
  };
  const claudeDirectory: SetupMethod = {
    key: 'directory',
    label: t('One click'),
    hint: t('{brand} is listed in the Claude directory.', { brand }),
    steps: [
      {
        body: t('Open the listing and add it to Claude.'),
        action: {
          label: t('Add from the Claude directory'),
          href: CLAUDE_DIRECTORY_URL,
        },
      },
      {
        body: t(
          'Claude opens {brand} in your browser. Approve the project it can reach.',
          { brand },
        ),
      },
    ],
  };

  return [
    {
      key: 'claude',
      grantKey: 'claude',
      ...MCP_CLIENT_BRANDING.claude,
      kind: 'chat',
      docsUrl:
        'https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp',
      setupVideoUrl: isCloud ? undefined : SELF_HOSTED_SETUP_VIDEOS.claude,
      methods: isCloud ? [claudeDirectory, claudeConnector] : [claudeConnector],
    },
    {
      key: 'chatgpt',
      grantKey: 'chatgpt',
      ...MCP_CLIENT_BRANDING.chatgpt,
      kind: 'chat',
      docsUrl: 'https://developers.openai.com/apps-sdk/deploy/connect-chatgpt',
      setupVideoUrl: isCloud ? undefined : SELF_HOSTED_SETUP_VIDEOS.chatgpt,
      methods: [
        {
          key: 'custom',
          label: t('Custom MCP server'),
          hint: t('Add {brand} as a custom server in ChatGPT Plugins.', {
            brand,
          }),
          steps: [
            {
              body: t(
                'In ChatGPT, open Plugins, select +, then Add custom MCP server. Paste this URL under Connection.',
              ),
              block: urlBlock(url),
              action: {
                label: t('Open ChatGPT Plugins'),
                href: CHATGPT_PLUGINS_URL,
                requiresInternetReachableUrl: true,
              },
            },
            {
              body: t(
                'Choose OAuth, select Create as a plugin, then sign in to {brand} and approve the project.',
                { brand },
              ),
            },
          ],
        },
      ],
    },
    {
      key: 'claude-code',
      grantKey: 'claude-code',
      ...MCP_CLIENT_BRANDING['claude-code'],
      kind: 'agent',
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
              block: terminal(`claude mcp add --transport http ${slug} ${url}`),
            },
            {
              body: t(
                'Sign in once. You can also run /mcp inside Claude Code.',
              ),
              block: terminal(`claude mcp login ${slug}`),
            },
          ],
        },
        agentMethod({
          agent: 'Claude Code',
          prompt: t(
            'Set up the {brand} MCP server for me by running: claude mcp add --transport http {slug} {url}. Then run claude mcp login {slug} so I can approve the project.',
            { brand, slug, url },
          ),
        }),
        {
          key: 'config',
          label: t('Config file'),
          hint: t('Share the server with your team through the repository.'),
          steps: [
            {
              body: t(
                'Add the server to .mcp.json at the root of the project.',
              ),
              block: code({
                label: '.mcp.json',
                text: prettyJson({
                  mcpServers: { [slug]: { type: 'http', url } },
                }),
              }),
            },
            {
              body: t('Sign in once.'),
              block: terminal(`claude mcp login ${slug}`),
            },
          ],
        },
      ],
    },
    {
      key: 'codex',
      grantKey: 'codex',
      ...MCP_CLIENT_BRANDING.codex,
      name: 'Codex CLI',
      kind: 'agent',
      docsUrl: 'https://learn.chatgpt.com/docs/extend/mcp?surface=cli',
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          hint: t('Add the server, then log in once.'),
          steps: [
            {
              body: t('Add the server.'),
              block: terminal(`codex mcp add ${slug} --url ${url}`),
            },
            {
              body: t('Log in to {brand} and approve the project.', { brand }),
              block: terminal(`codex mcp login ${slug}`),
            },
          ],
        },
        agentMethod({
          agent: 'Codex',
          prompt: t(
            'Set up the {brand} MCP server for me by running: codex mcp add {slug} --url {url}. Then run codex mcp login {slug} and walk me through approving the project.',
            { brand, slug, url },
          ),
        }),
        {
          key: 'config',
          label: t('Config file'),
          hint: t('Edit the Codex config yourself.'),
          steps: [
            {
              body: t('Add the server to your Codex config.'),
              block: code({
                label: '~/.codex/config.toml',
                text: `[mcp_servers.${slug}]\nurl = "${url}"`,
              }),
            },
            {
              body: t('Log in to {brand} and approve the project.', { brand }),
              block: terminal(`codex mcp login ${slug}`),
            },
          ],
        },
      ],
    },
    {
      key: 'cursor',
      grantKey: 'cursor',
      ...MCP_CLIENT_BRANDING.cursor,
      kind: 'editor',
      docsUrl: isCloud ? CURSOR_DIRECTORY_URL : 'https://cursor.com/docs/mcp',
      methods: [
        {
          key: 'deeplink',
          label: t('One click'),
          hint: t('Opens Cursor and writes the config for you.'),
          steps: [
            {
              body: t(
                'This opens Cursor and adds the server to ~/.cursor/mcp.json.',
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
          agent: 'Cursor',
          prompt: t(
            'Add the {brand} MCP server to my Cursor config. In ~/.cursor/mcp.json, add a "{slug}" entry under mcpServers with the url {url}. Then tell me how to reload Cursor and sign in.',
            { brand, slug, url },
          ),
        }),
        {
          key: 'config',
          label: t('Config file'),
          hint: t('Edit the config yourself if the link is blocked.'),
          steps: [
            {
              body: t(
                'Add the server to your Cursor config, then reload Cursor.',
              ),
              block: code({
                label: '~/.cursor/mcp.json',
                text: prettyJson({ mcpServers: { [slug]: { url } } }),
              }),
            },
            approveStep(brand),
          ],
        },
      ],
    },
    {
      key: 'vscode',
      grantKey: 'vscode',
      ...MCP_CLIENT_BRANDING.vscode,
      kind: 'editor',
      docsUrl:
        'https://code.visualstudio.com/docs/agent-customization/mcp-servers',
      methods: [
        {
          key: 'deeplink',
          label: t('One click'),
          hint: t('Opens VS Code and writes the config for you.'),
          steps: [
            {
              body: t('This opens VS Code and adds the server.'),
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
          hint: t('Add it to the workspace yourself, then select Start.'),
          steps: [
            {
              body: t(
                'Create .vscode/mcp.json, then select Start above the server entry.',
              ),
              block: code({
                label: '.vscode/mcp.json',
                text: prettyJson({
                  servers: { [slug]: { type: 'http', url } },
                }),
              }),
            },
            approveStep(brand),
          ],
        },
        agentMethod({
          agent: 'Copilot',
          prompt: t(
            'Add the {brand} MCP server to this workspace. In .vscode/mcp.json, add a "{slug}" entry under servers with type "http" and the url {url}. Then tell me how to start it and sign in.',
            { brand, slug, url },
          ),
        }),
      ],
    },
    {
      key: 'gemini-cli',
      grantKey: 'gemini-cli',
      ...MCP_CLIENT_BRANDING['gemini-cli'],
      kind: 'agent',
      docsUrl: 'https://geminicli.com/docs/tools/mcp-server/',
      methods: [
        {
          key: 'terminal',
          label: t('Terminal'),
          hint: t('Add the server, then sign in from inside Gemini CLI.'),
          steps: [
            {
              body: t(
                'Run this from the project folder. Add --scope user to use it everywhere.',
              ),
              block: terminal(`gemini mcp add --transport http ${slug} ${url}`),
            },
            {
              body: t('Inside Gemini CLI, sign in and approve the project.'),
              block: terminal(`/mcp auth ${slug}`),
            },
          ],
        },
        agentMethod({
          agent: 'Gemini CLI',
          prompt: t(
            'Set up the {brand} MCP server for me by running: gemini mcp add --transport http {slug} {url}. Then tell me to run /mcp auth {slug} to sign in.',
            { brand, slug, url },
          ),
        }),
        {
          key: 'config',
          label: t('Config file'),
          hint: t('Edit the Gemini CLI settings yourself.'),
          steps: [
            {
              body: t('Add the server to your Gemini CLI settings.'),
              block: code({
                label: '~/.gemini/settings.json',
                text: prettyJson({ mcpServers: { [slug]: { httpUrl: url } } }),
              }),
            },
            {
              body: t('Inside Gemini CLI, sign in and approve the project.'),
              block: terminal(`/mcp auth ${slug}`),
            },
          ],
        },
      ],
    },
    {
      key: 'devin',
      grantKey: 'windsurf',
      ...MCP_CLIENT_BRANDING.windsurf,
      kind: 'editor',
      docsUrl: 'https://docs.devin.ai/desktop/cascade/mcp',
      methods: [
        {
          key: 'config',
          label: t('Config file'),
          hint: t('Devin Desktop was called Windsurf.'),
          steps: [
            {
              body: t(
                'Add the server to your Devin Desktop config, then refresh the server list.',
              ),
              block: code({
                label: '~/.config/devin/mcp_config.json',
                text: prettyJson({
                  mcpServers: { [slug]: { serverUrl: url } },
                }),
              }),
            },
            {
              body: t(
                'Sign in to {brand} when Devin asks, and approve the project.',
                {
                  brand,
                },
              ),
            },
          ],
        },
        agentMethod({
          agent: 'Devin',
          prompt: t(
            'Add the {brand} MCP server to my Devin Desktop config. In ~/.config/devin/mcp_config.json, add a "{slug}" entry under mcpServers with serverUrl {url}. Then walk me through signing in.',
            { brand, slug, url },
          ),
        }),
      ],
    },
    {
      key: 'cline',
      grantKey: null,
      name: 'Cline',
      icon: LOCAL_ICONS.cline,
      kind: 'agent',
      docsUrl: 'https://docs.cline.bot/mcp/mcp-overview',
      methods: [
        {
          key: 'config',
          label: t('Config file'),
          hint: t('Cline panel → MCP Servers → Configure MCP Servers.'),
          steps: [
            {
              body: t(
                'Add the server to cline_mcp_settings.json. Keep the type as streamableHttp, or Cline falls back to SSE and fails to connect.',
              ),
              block: code({
                label: 'cline_mcp_settings.json',
                text: prettyJson({
                  mcpServers: { [slug]: { type: 'streamableHttp', url } },
                }),
              }),
            },
            {
              body: t(
                'Sign in to {brand} when Cline asks, and approve the project.',
                {
                  brand,
                },
              ),
            },
          ],
        },
        agentMethod({
          agent: 'Cline',
          prompt: t(
            'Add the {brand} MCP server to my Cline config. In cline_mcp_settings.json, add a "{slug}" entry under mcpServers with type "streamableHttp" and the url {url}. Then walk me through signing in.',
            { brand, slug, url },
          ),
        }),
      ],
    },
    {
      key: 'antigravity',
      grantKey: null,
      name: 'Antigravity',
      icon: LOCAL_ICONS.antigravity,
      kind: 'editor',
      docsUrl: 'https://antigravity.google/docs/mcp/',
      methods: [
        {
          key: 'config',
          label: t('Config file'),
          hint: t('One config covers the Antigravity IDE and CLI.'),
          steps: [
            {
              body: t(
                'Add the server to your Antigravity config. Remote servers use serverUrl, not url.',
              ),
              block: code({
                label: '~/.gemini/config/mcp_config.json',
                text: prettyJson({
                  mcpServers: { [slug]: { serverUrl: url } },
                }),
              }),
            },
            {
              body: t(
                'Open Agent settings → Customizations, select Authenticate next to {slug}, and approve the project.',
                { slug },
              ),
            },
          ],
        },
        agentMethod({
          agent: 'Antigravity',
          prompt: t(
            'Add the {brand} MCP server to my Antigravity config. In ~/.gemini/config/mcp_config.json, add a "{slug}" entry under mcpServers with serverUrl {url}. Then walk me through signing in.',
            { brand, slug, url },
          ),
        }),
      ],
    },
    {
      key: 'opencode',
      grantKey: 'opencode',
      ...MCP_CLIENT_BRANDING.opencode,
      kind: 'agent',
      docsUrl: 'https://opencode.ai/docs/mcp-servers/',
      methods: [
        {
          key: 'config',
          label: t('Config file'),
          hint: t('Add a remote server, then sign in once.'),
          steps: [
            {
              body: t('Add the server to your OpenCode config.'),
              block: code({
                label: '~/.config/opencode/opencode.json',
                text: prettyJson({
                  mcp: { [slug]: { type: 'remote', url, enabled: true } },
                }),
              }),
            },
            {
              body: t('Sign in to {brand} and approve the project.', { brand }),
              block: terminal(`opencode mcp auth ${slug}`),
            },
          ],
        },
        agentMethod({
          agent: 'OpenCode',
          prompt: t(
            'Add the {brand} MCP server to my OpenCode config. In ~/.config/opencode/opencode.json, add a "{slug}" entry under mcp with type "remote", enabled true, and the url {url}. Then run opencode mcp auth {slug} so I can sign in.',
            { brand, slug, url },
          ),
        }),
      ],
    },
    {
      key: 'unknown',
      grantKey: 'unknown',
      ...MCP_CLIENT_BRANDING.unknown,
      name: t('Other MCP client'),
      kind: 'other',
      docsUrl:
        'https://modelcontextprotocol.io/docs/2026-07-28/develop/connect-remote-servers',
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
              block: urlBlock(url),
            },
            {
              body: t(
                'The server supports OAuth with dynamic client registration, so the client asks you to sign in with no extra setup.',
              ),
            },
          ],
        },
        {
          key: 'config',
          label: t('JSON config'),
          hint: t('For clients configured with an mcpServers file.'),
          steps: [
            {
              body: t('Add this entry to the client’s MCP config.'),
              block: code({
                label: t('MCP server JSON'),
                text: prettyJson({ mcpServers: { [slug]: { url } } }),
              }),
            },
            {
              body: t(
                'Sign in to {brand} when the client asks, and approve the project.',
                {
                  brand,
                },
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
  }): CatalogClient[] =>
    catalogEntries({
      url: serverUrl,
      brand: websiteName,
      slug: slugify(websiteName) || FALLBACK_SLUG,
      isCloud,
    }),
  resolveKey: (key: string): string => CLIENT_KEY_ALIASES[key] ?? key,
  checkPrompts: (brand: string): string[] => [
    t(
      'What {brand} tools do you have? List a few things you could run for me.',
      {
        brand,
      },
    ),
    t('Post a note in Slack that the deploy finished.'),
  ],
};

const FALLBACK_SLUG = 'activepieces';
const CLIENT_KEY_ALIASES: Record<string, string> = { windsurf: 'devin' };
const CLAUDE_DIRECTORY_URL =
  'https://claude.ai/directory/cloud-activepieces-com';
const CURSOR_DIRECTORY_URL =
  'https://cursor.directory/plugins/activepieces-mcp-connector-for-cursor';
const CHATGPT_PLUGINS_URL = 'https://chatgpt.com/plugins';
const LOCAL_ICONS = {
  cline: '/mcp-clients/cline.svg',
  antigravity: '/mcp-clients/antigravity.png',
};
const SELF_HOSTED_SETUP_VIDEOS = {
  claude:
    'https://cdn.activepieces.com/videos/mcp-tutorials/Claude%20MCP%20-%20Step%201.mp4',
  chatgpt:
    'https://cdn.activepieces.com/videos/mcp-tutorials/ChatGPT%20MCP%20-%20Step%201.mp4',
};

export type ClientKind = 'chat' | 'agent' | 'editor' | 'other';

export type SetupBlock = {
  kind: 'terminal' | 'code' | 'url' | 'prompt';
  label: string;
  text: string;
};

export type SetupAction = {
  label: string;
  href: string;
  requiresInternetReachableUrl?: boolean;
};

export type SetupStep = {
  body: string;
  block?: SetupBlock;
  action?: SetupAction;
};

export type SetupMethod = {
  key: string;
  label: string;
  hint: string;
  steps: SetupStep[];
};

export type CatalogClient = {
  key: string;
  grantKey: McpOAuthClientKey | null;
  icon: string;
  name: string;
  kind: ClientKind;
  docsUrl: string;
  setupVideoUrl?: string;
  methods: SetupMethod[];
};
