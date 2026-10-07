import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowRight, ArrowUpRight, KeyRound } from 'lucide-react';
import { ReactNode } from 'react';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { formatUtils } from '@/lib/format-utils';

import { ClientIcon } from '../client-icon';
import {
  CatalogClient,
  ClientGroupKey,
  mcpClientCatalog,
} from '../mcp-client-catalog';
import { mcpClientDisplay } from '../mcp-client-display';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

import { ClientRotator } from './client-rotator';
import { ConnectHome, useConnectHome } from './use-connect-home';
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
          <h1 className="flex w-fit flex-col items-center gap-2 text-center text-3xl font-semibold leading-tight tracking-tight">
            <span>{t('Control all your apps and data from')}</span>
            <ClientRotator />
          </h1>
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
  home: ConnectHome;
  isReachableFromInternet: boolean;
}) {
  const nav = useMcpNav();
  if (clients.length === 0) return null;
  return (
    <Card title={title}>
      <ul className="flex flex-col divide-y">
        {clients.map((client) => {
          const clientGrants = home.grantsByClient.get(client.key);
          return (
            <li
              key={client.key}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <ClientIcon icon={client.icon} className="size-8 rounded-lg" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">{client.name}</span>
                {clientGrants ? (
                  <ConnectionStatus grants={clientGrants} />
                ) : (
                  <span className="text-xs text-gray-11">
                    {client.setupHint}
                  </span>
                )}
              </span>
              {clientGrants ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => nav.showTab('connections')}
                >
                  {t('Manage')}
                </Button>
              ) : (
                <InstallButton
                  client={client}
                  onStart={home.startWatching}
                  isReachableFromInternet={isReachableFromInternet}
                />
              )}
            </li>
          );
        })}
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
      <p className="flex items-center gap-2 border-t pt-4 text-xs text-gray-11">
        <KeyRound className="size-3.5 shrink-0" />
        {t('One-time sign-in · No API keys · Revoke anytime')}
      </p>
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
            <ConnectionStatus grants={[grant]} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function ConnectionStatus({ grants }: { grants: McpOAuthGrant[] }) {
  const lastUsed = grants
    .map((grant) => grant.lastUsedAt)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1);
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-xs text-gray-11">
      <span className="size-1.5 rounded-full bg-success-10" />
      {lastUsed
        ? t('Connected · used {ago}', {
            ago: formatUtils.formatDateToAgo(new Date(lastUsed)),
          })
        : t('Connected · no calls yet')}
    </span>
  );
}

const MAX_GRANTS_SHOWN = 4;
