import { McpOAuthClientKey } from '@activepieces/shared';
import { t } from 'i18next';
import { ExternalLink } from 'lucide-react';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { mcpClientIdentity } from './mcp-client-identity';

const DOCS_URL = 'https://www.activepieces.com/docs/mcp/overview';

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

function buildCards(serverUrl: string): ConnectCard[] {
  return [
    {
      clientKey: 'claude',
      deepLink: claudeDeepLink(serverUrl),
      deepLinkLabel: t('Add to Claude'),
      requiresPublicUrl: true,
      manualSteps: t(
        'Or in Claude: Customize → Connectors → + → Add custom connector, then paste the server URL.',
      ),
    },
    {
      clientKey: 'claude-code',
      command: `claude mcp add --transport http activepieces ${serverUrl}`,
      manualSteps: t('Then run /mcp inside Claude Code and pick Authenticate.'),
      fallback: {
        label: t('Or edit .mcp.json'),
        snippet: JSON.stringify(
          {
            mcpServers: {
              activepieces: { type: 'http', url: serverUrl },
            },
          },
          null,
          2,
        ),
      },
    },
    {
      clientKey: 'cursor',
      deepLink: cursorDeepLink(serverUrl),
      deepLinkLabel: t('Add to Cursor'),
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
      clientKey: 'vscode',
      deepLink: vscodeDeepLink(serverUrl),
      deepLinkLabel: t('Add to VS Code'),
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
      clientKey: 'codex',
      command: `codex mcp add activepieces --url ${serverUrl}`,
      fallback: {
        label: t('Or edit ~/.codex/config.toml'),
        snippet: `[mcp_servers.activepieces]\nurl = "${serverUrl}"`,
      },
    },
    {
      clientKey: 'unknown',
      title: t('Any MCP client'),
      command: serverUrl,
      manualSteps: t(
        'Streamable HTTP, OAuth — check your client’s docs for where the server URL goes.',
      ),
      docsLink: DOCS_URL,
    },
  ];
}

export function ConnectCards({
  serverUrl,
  isPublicUrl,
}: {
  serverUrl: string;
  isPublicUrl: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {buildCards(serverUrl).map((card) => (
        <ClientConnectCard
          key={card.clientKey}
          card={card}
          isPublicUrl={isPublicUrl}
        />
      ))}
    </div>
  );
}

function ClientConnectCard({
  card,
  isPublicUrl,
}: {
  card: ConnectCard;
  isPublicUrl: boolean;
}) {
  const blockedByPrivateUrl = card.requiresPublicUrl === true && !isPublicUrl;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <img
          src={mcpClientIdentity.icon(card.clientKey)}
          alt=""
          className="size-5"
        />
        <span className="text-sm font-medium">
          {card.title ?? mcpClientIdentity.label(card.clientKey, null)}
        </span>
      </div>

      {card.deepLink && (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          disabled={blockedByPrivateUrl}
          asChild={!blockedByPrivateUrl}
        >
          {blockedByPrivateUrl ? (
            <span>{card.deepLinkLabel}</span>
          ) : (
            <a href={card.deepLink}>{card.deepLinkLabel}</a>
          )}
        </Button>
      )}

      {blockedByPrivateUrl && (
        <p className="text-xs text-muted-foreground">
          {t(
            'This client dials your server from the internet, so it needs a public HTTPS address. Local clients below work as they are.',
          )}
        </p>
      )}

      {card.command && (
        <CopyToClipboardInput textToCopy={card.command} useInput={true} />
      )}

      {card.manualSteps && (
        <p className="text-xs text-muted-foreground">{card.manualSteps}</p>
      )}

      {card.fallback && (
        <CollapsibleJson
          json={card.fallback.snippet}
          label={card.fallback.label}
        />
      )}

      {card.docsLink && (
        <a
          href={card.docsLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {t('Read the docs')}
          <ExternalLink className="size-3" />
        </a>
      )}
    </Card>
  );
}

type ConnectCard = {
  clientKey: McpOAuthClientKey;
  title?: string;
  deepLink?: string;
  deepLinkLabel?: string;
  requiresPublicUrl?: boolean;
  command?: string;
  manualSteps?: string;
  docsLink?: string;
  fallback?: {
    label: string;
    snippet: string;
  };
};
