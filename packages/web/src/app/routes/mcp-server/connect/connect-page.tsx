import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { ReactNode } from 'react';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import {
  CatalogClient,
  ClientGroupKey,
  mcpClientCatalog,
} from '../mcp-client-catalog';
import { mcpClientDisplay } from '../mcp-client-display';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

import { useConnectHome } from './use-connect-home';
import { WireFrame } from './wire-frame';

export function ConnectPage({
  clients,
  serverUrl,
  isReachableFromInternet,
}: {
  clients: CatalogClient[];
  serverUrl: string;
  isReachableFromInternet: boolean;
}) {
  const home = useConnectHome({ clients });
  const groupLabels = new Map(
    mcpClientCatalog.groups().map((group) => [group.key, group.label]),
  );
  const group = (key: ClientGroupKey) => ({
    title: groupLabels.get(key) ?? key,
    clients: home.clients.filter((client) => client.group === key),
  });
  const rowProps = { home, isReachableFromInternet };

  return (
    <PageBand className="py-12">
      <WireFrame
        header={
          <header className="flex max-w-[520px] flex-col items-center gap-4 text-center">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              {t('Do more with {brand}, everywhere you use AI.', {
                brand: home.brandName,
              })}
            </h1>
            <p className="text-base text-gray-11">
              {t(
                'Connect Claude, Cursor, ChatGPT or any MCP client. One-time OAuth sign-in, no API keys, revoke anytime.',
              )}
            </p>
          </header>
        }
      >
        <div className="grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <ClientGroupCard {...group('terminal')} {...rowProps} />
            <ClientGroupCard {...group('editors')} {...rowProps} />
          </div>
          <div className="flex flex-col gap-6">
            {home.grants.length > 0 && <ConnectedCard grants={home.grants} />}
            <ServerUrlCard serverUrl={serverUrl} />
            <ClientGroupCard {...group('chat')} {...rowProps} />
          </div>
        </div>
      </WireFrame>
    </PageBand>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border bg-panel p-6">
      <div className="flex items-center gap-2">
        <h2 className="flex-1 text-lg font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ClientGroupCard({
  title,
  clients,
  home,
  isReachableFromInternet,
}: {
  title: string;
  clients: CatalogClient[];
  home: ReturnType<typeof useConnectHome>;
  isReachableFromInternet: boolean;
}) {
  if (clients.length === 0) return null;
  return (
    <Card title={title}>
      <ul className="flex flex-col divide-y">
        {clients.map((client) => (
          <li
            key={client.key}
            className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
          >
            <ClientIcon icon={client.icon} className="size-8 rounded-lg" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium">{client.name}</span>
              <span className="text-xs text-gray-11">{client.setupHint}</span>
            </span>
            {home.grantsByClient.has(client.key) && (
              <span className="flex items-center gap-1.5 text-xs text-gray-11">
                <span className="size-1.5 rounded-full bg-success-10" />
                {t('Connected')}
              </span>
            )}
            <InstallButton
              client={client}
              onStart={home.startWatching}
              isReachableFromInternet={isReachableFromInternet}
            />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function InstallButton({
  client,
  onStart,
  isReachableFromInternet,
}: {
  client: CatalogClient;
  onStart: () => void;
  isReachableFromInternet: boolean;
}) {
  const nav = useMcpNav();
  const action = client.instructions[0]?.action;
  const isBlocked =
    action?.requiresInternetReachableUrl === true && !isReachableFromInternet;
  if (action && !isBlocked) {
    return (
      <Button variant="outline" size="sm" asChild onClick={onStart}>
        <a href={action.href} target="_blank" rel="noreferrer">
          {t('Install')}
          <ArrowUpRight />
        </a>
      </Button>
    );
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        onStart();
        nav.showClient(client.key);
      }}
    >
      {t('Set up')}
    </Button>
  );
}

function ServerUrlCard({ serverUrl }: { serverUrl: string }) {
  const nav = useMcpNav();
  return (
    <Card title={t('MCP server URL')}>
      <p className="text-sm text-gray-11">
        {t(
          'Works with any MCP client over Streamable HTTP or SSE. Point it at the link and it works.',
        )}
      </p>
      <CopyToClipboardInput textToCopy={serverUrl} useInput />
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={() => nav.showClient('unknown')}
      >
        {t('Set up any MCP client')}
        <ArrowRight />
      </Button>
    </Card>
  );
}

function ConnectedCard({ grants }: { grants: McpOAuthGrant[] }) {
  const nav = useMcpNav();
  return (
    <Card
      title={t('Connected now')}
      action={
        <Button
          variant="ghost"
          size="xs"
          onClick={() => nav.showTab('connections')}
        >
          {t('Manage')}
        </Button>
      }
    >
      <ul className="flex flex-col gap-3">
        {grants.slice(0, MAX_GRANTS_SHOWN).map((grant) => (
          <li key={grant.id} className="flex items-center gap-3">
            <ClientIcon
              icon={mcpClientDisplay.icon(grant.clientKey)}
              className="size-8 rounded-lg"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">
                {mcpClientDisplay.label({
                  key: grant.clientKey,
                  clientName: grant.clientName,
                })}
              </span>
              <span className="truncate text-xs text-gray-11">
                {grant.projectName ?? t('All projects')}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-gray-11">
              <span
                className={cn(
                  'size-1.5 rounded-full',
                  grant.lastUsedAt ? 'bg-success-10' : 'bg-gray-9',
                )}
              />
              {grant.lastUsedAt
                ? t('Used {ago}', {
                    ago: formatUtils.formatDateToAgo(
                      new Date(grant.lastUsedAt),
                    ),
                  })
                : t('Waiting for first call')}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const MAX_GRANTS_SHOWN = 4;
