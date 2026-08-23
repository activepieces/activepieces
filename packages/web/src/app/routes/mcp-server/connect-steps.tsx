import { unique } from '@activepieces/core-utils';
import { t } from 'i18next';
import { ArrowLeft, ArrowRight, ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import claudeIcon from '@/assets/img/custom/claude.svg';
import cursorIcon from '@/assets/img/custom/cursor.svg';
import mcpIcon from '@/assets/img/custom/mcp-with-background.svg';
import openaiIcon from '@/assets/img/custom/openai.svg';
import vscodeIcon from '@/assets/img/custom/vscode.svg';
import windsurfIcon from '@/assets/img/custom/windsurf.svg';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const AP_MCP_DOCS = 'https://www.activepieces.com/docs/mcp/overview';
const POPULAR_CLIENT_KEYS = [
  'claude-code',
  'cursor',
  'claude',
  'vscode',
  'codex',
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
      key: 'claude',
      icon: claudeIcon,
      name: 'Claude',
      group: t('Chat apps'),
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
          title: t('Check it works'),
          body: t(
            'Ask Claude to list its Activepieces tools. You should see this project’s pieces and flows.',
          ),
        },
      ],
    },
    {
      key: 'chatgpt',
      icon: openaiIcon,
      name: 'ChatGPT',
      group: t('Chat apps'),
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
          title: t('Check it works'),
          body: t(
            'Start a chat with the connector enabled and ask it to list your Activepieces tools.',
          ),
        },
      ],
    },
    {
      key: 'claude-code',
      icon: claudeIcon,
      name: 'Claude Code',
      group: t('Terminal'),
      kind: t('Terminal · runs locally'),
      docsUrl: 'https://docs.claude.com/en/docs/claude-code/mcp',
      steps: [
        {
          title: t('Add the server'),
          body: t('Run this in your project directory.'),
          command: `claude mcp add --transport http activepieces ${serverUrl}`,
          fallback: {
            label: t('Or edit .mcp.json'),
            snippet: JSON.stringify(
              {
                mcpServers: { activepieces: { type: 'http', url: serverUrl } },
              },
              null,
              2,
            ),
          },
        },
        {
          title: t('Authenticate'),
          body: t('Run /mcp inside Claude Code and pick Authenticate.'),
        },
        {
          title: t('Check it works'),
          body: t('Run /mcp again — activepieces should read connected.'),
        },
      ],
    },
    {
      key: 'codex',
      icon: openaiIcon,
      name: 'Codex',
      group: t('Terminal'),
      kind: t('Terminal · runs locally'),
      docsUrl: 'https://developers.openai.com/codex/mcp',
      steps: [
        {
          title: t('Add the server'),
          body: t('Or add the same entry to ~/.codex/config.toml.'),
          command: `codex mcp add activepieces --url ${serverUrl}`,
          fallback: {
            label: t('Or edit ~/.codex/config.toml'),
            snippet: `[mcp_servers.activepieces]\nurl = "${serverUrl}"`,
          },
        },
        {
          title: t('Authenticate'),
          body: t(
            'Codex opens your browser on the first tool call. Approve the project.',
          ),
        },
        {
          title: t('Check it works'),
          body: t('Run codex mcp list — activepieces should appear.'),
        },
      ],
    },
    {
      key: 'gemini-cli',
      icon: mcpIcon,
      name: 'Gemini CLI',
      group: t('Terminal'),
      kind: t('Terminal · runs locally'),
      docsUrl:
        'https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html',
      steps: [
        {
          title: t('Add the server'),
          body: t('Pass --scope project to keep it to one repository.'),
          command: `gemini mcp add --transport http activepieces ${serverUrl}`,
          fallback: {
            label: t('Or edit ~/.gemini/settings.json'),
            snippet: JSON.stringify(
              { mcpServers: { activepieces: { httpUrl: serverUrl } } },
              null,
              2,
            ),
          },
        },
        {
          title: t('Authenticate'),
          body: t(
            'Gemini CLI opens your browser on the first tool call. Approve the project.',
          ),
        },
        {
          title: t('Check it works'),
          body: t('Run /mcp — activepieces should read connected.'),
        },
      ],
    },
    {
      key: 'goose',
      icon: mcpIcon,
      name: 'goose',
      group: t('Terminal'),
      kind: t('Terminal · runs locally'),
      docsUrl:
        'https://block.github.io/goose/docs/getting-started/using-extensions',
      steps: [
        {
          title: t('Add the extension'),
          body: t(
            'Run goose configure, pick Add Extension → Remote Extension (Streamable HTTP), and paste the server URL.',
          ),
          command: serverUrl,
          fallback: {
            label: t('Or edit ~/.config/goose/config.yaml'),
            snippet: `extensions:\n  activepieces:\n    enabled: true\n    type: streamable_http\n    name: activepieces\n    uri: ${serverUrl}\n    timeout: 60`,
          },
        },
        {
          title: t('Authenticate'),
          body: t(
            'goose opens your browser on the first tool call. Approve the project.',
          ),
        },
        {
          title: t('Check it works'),
          body: t('Run goose info -v — activepieces should be listed.'),
        },
      ],
    },
    {
      key: 'warp',
      icon: mcpIcon,
      name: 'Warp',
      group: t('Terminal'),
      kind: t('Terminal · runs locally'),
      docsUrl: 'https://docs.warp.dev/agent-platform/capabilities/mcp',
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'Settings → AI → MCP servers → + Add, choose CLI Server or paste the JSON below.',
          ),
          fallback: {
            label: t('MCP server JSON'),
            snippet: JSON.stringify(
              { activepieces: { url: serverUrl } },
              null,
              2,
            ),
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
      key: 'cursor',
      icon: cursorIcon,
      name: 'Cursor',
      group: t('Editors'),
      kind: t('Editor · runs locally'),
      docsUrl: 'https://docs.cursor.com/context/mcp',
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
          fallback: {
            label: t('Or edit ~/.cursor/mcp.json'),
            snippet: JSON.stringify(
              { mcpServers: { activepieces: { url: serverUrl } } },
              null,
              2,
            ),
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
      group: t('Editors'),
      kind: t('Editor · runs locally'),
      docsUrl: 'https://code.visualstudio.com/docs/copilot/chat/mcp-servers',
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
          fallback: {
            label: t('Or edit .vscode/mcp.json'),
            snippet: JSON.stringify(
              { servers: { activepieces: { type: 'http', url: serverUrl } } },
              null,
              2,
            ),
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
      group: t('Editors'),
      kind: t('Editor · runs locally'),
      docsUrl: 'https://docs.windsurf.com/windsurf/cascade/mcp',
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'Cascade → Plugins → View raw config, then add the server to ~/.codeium/windsurf/mcp_config.json.',
          ),
          fallback: {
            label: t('Or edit ~/.codeium/windsurf/mcp_config.json'),
            snippet: JSON.stringify(
              {
                mcpServers: {
                  activepieces: { serverUrl },
                },
              },
              null,
              2,
            ),
          },
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
      group: t('Editors'),
      kind: t('Editor extension · runs locally'),
      docsUrl: 'https://docs.cline.bot/mcp/mcp-overview',
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'MCP Servers → Remote Servers → Add, or edit cline_mcp_settings.json directly. The type must be streamableHttp.',
          ),
          command: serverUrl,
          fallback: {
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
      group: t('Editors'),
      kind: t('Editor · runs locally'),
      docsUrl: 'https://zed.dev/docs/ai/mcp',
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'Settings → AI → MCP Servers → Add Custom Server, or add it to your settings.json.',
          ),
          fallback: {
            label: t('Or edit settings.json'),
            snippet: JSON.stringify(
              { context_servers: { activepieces: { url: serverUrl } } },
              null,
              2,
            ),
          },
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
      group: t('Editors'),
      kind: t('Editor · runs locally'),
      docsUrl: 'https://www.jetbrains.com/help/ai-assistant/mcp.html',
      steps: [
        {
          title: t('Add the server'),
          body: t(
            'Settings → Tools → AI Assistant → Model Context Protocol → Add, then paste the JSON below.',
          ),
          fallback: {
            label: t('MCP server JSON'),
            snippet: JSON.stringify(
              { mcpServers: { activepieces: { url: serverUrl } } },
              null,
              2,
            ),
          },
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
      key: 'unknown',
      icon: mcpIcon,
      name: t('Any MCP client'),
      group: t('Anything else'),
      kind: t('Streamable HTTP · OAuth'),
      docsUrl: 'https://modelcontextprotocol.io/clients',
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

export function ConnectSteps({
  serverUrl,
  isPublicUrl,
}: {
  serverUrl: string;
  isPublicUrl: boolean;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isBrowsingAll, setIsBrowsingAll] = useState(false);
  const [search, setSearch] = useState('');
  const clients = useMemo(() => buildClients(serverUrl), [serverUrl]);
  const selected = clients.find((client) => client.key === selectedKey) ?? null;

  if (selected !== null) {
    return (
      <ClientPage
        client={selected}
        serverUrl={serverUrl}
        isPublicUrl={isPublicUrl}
        onBack={() => setSelectedKey(null)}
      />
    );
  }

  if (!isBrowsingAll) {
    return (
      <ClientPicker
        clients={clients}
        serverUrl={serverUrl}
        onSelect={setSelectedKey}
        onBrowseAll={(query) => {
          setSearch(query);
          setIsBrowsingAll(true);
        }}
      />
    );
  }

  const needle = search.trim().toLowerCase();
  const matches = clients.filter(
    (client) =>
      needle === '' ||
      client.name.toLowerCase().includes(needle) ||
      client.kind.toLowerCase().includes(needle),
  );
  const groups = unique(matches.map((client) => client.group));

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-[340px]">
          <Search className="absolute left-2.5 top-1/2 size-[15px] -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t('Search clients')}
            className="pl-8"
            autoFocus
          />
        </div>
        <span className="text-[13px] text-muted-foreground">
          {t('Showing {shown} of {total} clients', {
            shown: matches.length,
            total: clients.length,
          })}
        </span>
        <Button
          variant="link"
          className="ml-auto h-auto text-[13px]"
          onClick={() => setSelectedKey('unknown')}
        >
          {t('Client not listed?')}
        </Button>
      </div>

      {groups.map((group) => (
        <div key={group} className="flex flex-col gap-2.5 pb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-foreground/80">
              {group}
            </span>
            <span className="text-xs text-muted-foreground">
              {matches.filter((client) => client.group === group).length}
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
            {matches
              .filter((client) => client.group === group)
              .map((client) => (
                <button
                  key={client.key}
                  type="button"
                  onClick={() => setSelectedKey(client.key)}
                  className="flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors hover:border-ring hover:bg-accent/40"
                >
                  <img
                    src={client.icon}
                    alt=""
                    className="size-6 shrink-0 rounded-md"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {client.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {client.kind}
                    </span>
                  </div>
                  <ChevronRight className="size-[15px] shrink-0 text-muted-foreground" />
                </button>
              ))}
          </div>
        </div>
      ))}

      {matches.length === 0 && (
        <span className="text-sm text-muted-foreground">
          {t('No client matches your search.')}
        </span>
      )}
    </div>
  );
}

function ClientPicker({
  clients,
  serverUrl,
  onSelect,
  onBrowseAll,
}: {
  clients: ConnectableClient[];
  serverUrl: string;
  onSelect: (key: string) => void;
  onBrowseAll: (query: string) => void;
}) {
  const popular = POPULAR_CLIENT_KEYS.map((key) =>
    clients.find((client) => client.key === key),
  ).filter((client): client is ConnectableClient => client !== undefined);

  return (
    <div className="flex flex-col items-center pb-10 pt-14">
      <div className="flex h-[76px] items-center justify-center">
        <img
          src={cursorIcon}
          alt=""
          className="size-[52px] translate-x-3.5 -rotate-[8deg]"
        />
        <img
          src={claudeIcon}
          alt=""
          className="relative z-10 size-[68px] rounded-[17px]"
        />
        <img
          src={mcpIcon}
          alt=""
          className="size-[52px] -translate-x-3.5 rotate-[8deg] rounded-[13px] border bg-background"
        />
      </div>

      <h1 className="mt-7 text-center text-[34px] font-bold tracking-[-0.03em]">
        {t('What are you connecting?')}
      </h1>
      <p className="mt-3 max-w-[520px] text-center text-base leading-relaxed text-muted-foreground">
        {t(
          'Any MCP client can run this project’s flows, pieces and tools. Pick yours and we’ll show the exact steps.',
        )}
      </p>

      <div className="mt-8 flex w-full max-w-[640px] flex-col gap-3 rounded-xl border px-[18px] pb-3.5 pt-[18px]">
        <Input
          placeholder={t('Search a client — Cursor, Claude Code, Zed, Codex…')}
          className="h-auto border-0 px-0 text-[15px] shadow-none focus-visible:ring-0"
          onChange={(event) => onBrowseAll(event.target.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {t('{total} clients supported', { total: clients.length })}
          </span>
          <Button
            size="icon"
            className="size-9 rounded-full"
            aria-label={t('Browse all clients')}
            onClick={() => onBrowseAll('')}
          >
            <ArrowRight className="size-[17px]" />
          </Button>
        </div>
      </div>

      <div className="mt-[18px] flex items-center gap-1 text-sm text-muted-foreground">
        {t('or')}
        <CopyButton
          textToCopy={serverUrl}
          variant="ghost"
          size="sm"
          className="h-auto gap-1.5 px-1.5 py-1 font-semibold text-primary hover:bg-primary/5 hover:text-primary"
        >
          {t('copy the server URL')}
        </CopyButton>
      </div>

      <span className="mt-10 text-[13px] text-muted-foreground">
        {t('Popular clients')}
      </span>
      <div className="mt-3.5 flex flex-wrap justify-center gap-2.5">
        {popular.map((client) => (
          <button
            key={client.key}
            type="button"
            onClick={() => onSelect(client.key)}
            className="inline-flex items-center gap-2 rounded-full border py-2 pl-3 pr-4 text-sm font-medium transition-colors hover:border-ring hover:bg-accent/40"
          >
            <img
              src={client.icon}
              alt=""
              className="size-[18px] rounded-[5px]"
            />
            {client.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onBrowseAll('')}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
        >
          {t('All {total} clients', { total: clients.length })}
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function ClientPage({
  client,
  serverUrl,
  isPublicUrl,
  onBack,
}: {
  client: ConnectableClient;
  serverUrl: string;
  isPublicUrl: boolean;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-[22px]">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 self-start text-muted-foreground"
        onClick={onBack}
      >
        <ArrowLeft />
        {t('All clients')}
      </Button>

      <div className="flex items-center gap-3.5">
        <img
          src={client.icon}
          alt=""
          className="size-10 shrink-0 rounded-[10px]"
        />
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-semibold tracking-tight">
            {t('Connect {client}', { client: client.name })}
          </h2>
          <span className="text-[13px] text-muted-foreground">
            {client.kind}
          </span>
        </div>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex flex-col gap-5">
          {client.steps.map((step, index) => (
            <ConnectStepDetails
              key={step.title}
              number={index + 1}
              step={step}
              isPublicUrl={isPublicUrl}
            />
          ))}
        </div>

        <div className="flex flex-col gap-4 rounded-xl border p-[18px]">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              {t('Server URL')}
            </span>
            <span className="break-all font-mono text-[13px]">{serverUrl}</span>
            <CopyButton
              textToCopy={serverUrl}
              variant="outline"
              size="sm"
              className="mt-1 self-start"
            >
              {t('Copy')}
            </CopyButton>
          </div>
          <div className="h-px bg-border" />
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold">{t('Need help?')}</span>
            <a
              href={client.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] text-primary hover:underline"
            >
              {t('{client} MCP docs', { client: client.name })}
            </a>
            <a
              href={AP_MCP_DOCS}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] text-primary hover:underline"
            >
              {t('Activepieces MCP guide')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectStepDetails({
  number,
  step,
  isPublicUrl,
}: {
  number: number;
  step: ConnectStep;
  isPublicUrl: boolean;
}) {
  const blockedByPrivateUrl =
    step.action?.requiresPublicUrl === true && !isPublicUrl;

  return (
    <div className="flex items-start gap-3.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
        {number}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="text-sm font-medium">{step.title}</span>
        <span className="text-[13px] leading-relaxed text-muted-foreground">
          {step.body}
        </span>
        {step.command && (
          <CopyToClipboardInput textToCopy={step.command} useInput={true} />
        )}
        {step.action && (
          <Button
            size="sm"
            className="self-start"
            disabled={blockedByPrivateUrl}
            asChild={!blockedByPrivateUrl}
          >
            {blockedByPrivateUrl ? (
              <span>{step.action.label}</span>
            ) : (
              <a href={step.action.href}>{step.action.label}</a>
            )}
          </Button>
        )}
        {blockedByPrivateUrl && (
          <span className="text-[13px] leading-relaxed text-muted-foreground">
            {t(
              'Your server URL is not reachable from the internet, so this client cannot dial it.',
            )}
          </span>
        )}
        {step.fallback && (
          <CollapsibleJson
            json={step.fallback.snippet}
            label={step.fallback.label}
          />
        )}
      </div>
    </div>
  );
}

type ConnectStep = {
  title: string;
  body: string;
  command?: string;
  action?: {
    label: string;
    href: string;
    requiresPublicUrl?: boolean;
  };
  fallback?: {
    label: string;
    snippet: string;
  };
};

type ConnectableClient = {
  key: string;
  icon: string;
  name: string;
  group: string;
  kind: string;
  docsUrl: string;
  steps: ConnectStep[];
};
