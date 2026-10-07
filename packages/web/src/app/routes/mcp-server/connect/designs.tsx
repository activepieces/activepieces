import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowUpRight, KeyRound } from 'lucide-react';

import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { Button } from '@/components/ui/button';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import { CatalogClient, mcpClientCatalog } from '../mcp-client-catalog';
import { mcpClientDisplay } from '../mcp-client-display';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

import { ConnectHome } from './use-connect-home';

export function DesignGrouped(props: DesignProps) {
  return (
    <PageBand className="flex flex-col items-center gap-10 py-12">
      <CenteredHero home={props.home} />
      <TwoColumnGrid {...props} />
    </PageBand>
  );
}

export function DesignWires(props: DesignProps) {
  return (
    <PageBand className="flex flex-col gap-10 py-10">
      <WireHero home={props.home} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <SetupCard {...props} className="lg:col-span-7" />
        <div className="flex flex-col gap-6 lg:col-span-5">
          <ConnectedCard home={props.home} />
          <UrlCard serverUrl={props.serverUrl} />
        </div>
      </div>
    </PageBand>
  );
}

export function DesignWiresGrid(props: DesignProps) {
  return (
    <PageBand className="flex flex-col gap-10 py-10">
      <WireHero home={props.home} />
      <TwoColumnGrid {...props} />
    </PageBand>
  );
}

function CenteredHero({ home }: { home: ConnectHome }) {
  return (
    <div className="flex max-w-[640px] flex-col items-center gap-4 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        {t('Do more with {brand}, everywhere you use AI.', {
          brand: home.brandName,
        })}
      </h1>
      <p className="text-base text-gray-11">
        {t(
          'Connect Claude, Cursor, ChatGPT or any MCP client. One-time OAuth sign-in, no API keys, revoke anytime.',
        )}
      </p>
    </div>
  );
}

function TwoColumnGrid(props: DesignProps) {
  const groups = mcpClientCatalog.groups();
  const byGroup = groups
    .map((group) => ({
      group,
      clients: props.home.clients.filter((c) => c.group === group.key),
    }))
    .filter((entry) => entry.clients.length > 0);
  const left = byGroup.filter((_, index) => index % 2 === 0);
  const right = byGroup.filter((_, index) => index % 2 === 1);
  return (
    <div className="grid w-full max-w-[1040px] grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-6">
        {props.home.isConnected && <ConnectedCard home={props.home} />}
        {left.map((entry) => (
          <GroupCard
            key={entry.group.key}
            title={entry.group.label}
            clients={entry.clients}
            {...props}
          />
        ))}
      </div>
      <div className="flex flex-col gap-6">
        <UrlCard serverUrl={props.serverUrl} />
        {right.map((entry) => (
          <GroupCard
            key={entry.group.key}
            title={entry.group.label}
            clients={entry.clients}
            {...props}
          />
        ))}
      </div>
    </div>
  );
}

function GroupCard({
  title,
  clients,
  home,
  isReachableFromInternet,
}: DesignProps & { title: string; clients: CatalogClient[] }) {
  return (
    <section className="flex flex-col rounded-xl border bg-panel p-6">
      <h2 className="pb-2 text-lg font-semibold tracking-tight">{title}</h2>
      <ul className="flex flex-col divide-y">
        {clients.map((client) => (
          <li key={client.key} className="flex items-center gap-3 py-3">
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
              home={home}
              isReachableFromInternet={isReachableFromInternet}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InstallButton({
  client,
  home,
  isReachableFromInternet,
}: {
  client: CatalogClient;
  home: ConnectHome;
  isReachableFromInternet: boolean;
}) {
  const nav = useMcpNav();
  const action = client.instructions[0]?.action;
  const isBlocked =
    action?.requiresInternetReachableUrl === true && !isReachableFromInternet;
  if (action && !isBlocked) {
    return (
      <Button variant="outline" size="sm" asChild onClick={home.startWatching}>
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
        home.startWatching();
        nav.showClient(client.key);
      }}
    >
      {t('Set up')}
    </Button>
  );
}

export function UrlCard({ serverUrl }: { serverUrl: string }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-panel p-6">
      <h2 className="text-lg font-semibold tracking-tight">{t('MCP')}</h2>
      <p className="text-sm text-gray-11">
        {t('Paste this URL into any client that supports remote MCP.')}
      </p>
      <CopyToClipboardInput textToCopy={serverUrl} useInput />
    </section>
  );
}

export function ConnectedCard({ home }: { home: ConnectHome }) {
  const nav = useMcpNav();
  return (
    <section className="flex flex-col gap-3 rounded-xl border bg-panel p-6">
      <div className="flex items-center">
        <h2 className="flex-1 text-lg font-semibold tracking-tight">
          {t('Connected now')}
        </h2>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => nav.showTab('connections')}
        >
          {t('Manage')}
        </Button>
      </div>
      {home.grants.length === 0 ? (
        <p className="text-sm text-gray-11">
          {t('Nothing yet. Clients show up here after they sign in.')}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {home.grants.slice(0, 4).map((grant) => (
            <GrantRow key={grant.id} grant={grant} />
          ))}
        </ul>
      )}
    </section>
  );
}

function GrantRow({ grant }: { grant: McpOAuthGrant }) {
  return (
    <li className="flex items-center gap-3">
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
              ago: formatUtils.formatDateToAgo(new Date(grant.lastUsedAt)),
            })
          : t('Waiting for first call')}
      </span>
    </li>
  );
}

export function SetupCard({
  home,
  serverUrl,
  isReachableFromInternet,
  className,
}: DesignProps & { className?: string }) {
  const nav = useMcpNav();
  const client = home.focus;
  const [install, authenticate] = client.instructions;
  const action = install.action;
  const isBlocked =
    action?.requiresInternetReachableUrl === true && !isReachableFromInternet;
  const command =
    install.command && install.command !== serverUrl ? install.command : null;
  return (
    <section
      className={cn(
        'flex flex-col gap-4 rounded-xl border bg-panel p-6',
        className,
      )}
      onClickCapture={home.startWatching}
    >
      <div className="flex items-center gap-3">
        <ClientIcon icon={client.icon} className="size-10 rounded-lg" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-lg font-semibold tracking-tight">
            {client.name}
          </span>
          <span className="text-sm text-gray-11">{install.body}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => nav.showClient(client.key)}
        >
          {t('Full guide')}
        </Button>
      </div>
      {action && (
        <Button
          className="self-start"
          disabled={isBlocked}
          asChild={!isBlocked}
        >
          {isBlocked ? (
            <span>{action.label}</span>
          ) : (
            <a href={action.href} target="_blank" rel="noreferrer">
              {action.label}
              <ArrowUpRight />
            </a>
          )}
        </Button>
      )}
      {command && <CopyToClipboardInput textToCopy={command} useInput />}
      {!action && !command && (
        <CopyToClipboardInput textToCopy={serverUrl} useInput />
      )}
      {authenticate && (
        <p className="flex items-start gap-2 text-xs text-gray-11">
          <KeyRound className="mt-px size-3.5 shrink-0" />
          {authenticate.body}
        </p>
      )}
    </section>
  );
}

function WireHero({ home }: { home: ConnectHome }) {
  const count = home.clients.length;
  const slots = home.clients.map((client, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
    return {
      client,
      x: 50 + 44 * Math.cos(angle),
      y: 50 + 40 * Math.sin(angle),
    };
  });
  return (
    <div className="relative h-[420px] w-full">
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        {slots.map(({ client, x, y }) => {
          const isSelected = client.key === home.focus.key;
          const isConnected = home.grantsByClient.has(client.key);
          return (
            <path
              key={client.key}
              d={elbow({ x, y })}
              fill="none"
              vectorEffect="non-scaling-stroke"
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray="4 6"
              className={
                isConnected
                  ? 'stroke-success-10'
                  : isSelected
                  ? 'stroke-accent-9'
                  : 'stroke-gray-7'
              }
            >
              <animate
                attributeName="stroke-dashoffset"
                from="20"
                to="0"
                dur={isSelected ? '0.8s' : '2.4s'}
                repeatCount="indefinite"
              />
            </path>
          );
        })}
      </svg>
      <div className="absolute left-1/2 top-1/2 flex w-[440px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3 rounded-xl bg-gray-1 px-6 py-5 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('Bring {brand} into every AI you use', { brand: home.brandName })}
        </h1>
        <p className="text-sm text-gray-11">
          {t('Pick your client. One-time OAuth sign-in, no API keys.')}
        </p>
      </div>
      {slots
        .filter(({ x }) => hubX(x) !== 50)
        .map(({ client, x }) => (
          <span
            key={`dot-${client.key}`}
            aria-hidden
            style={{ left: `${hubX(x)}%`, top: '50%' }}
            className="absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-9"
          />
        ))}
      {slots.map(({ client, x, y }) => {
        const isSelected = client.key === home.focus.key;
        const isConnected = home.grantsByClient.has(client.key);
        return (
          <button
            key={client.key}
            type="button"
            onClick={() => home.select(client.key)}
            style={{ left: `${x}%`, top: `${y}%` }}
            className={cn(
              'absolute flex h-10 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-xl border bg-panel px-3 text-sm shadow-sm transition-colors',
              isSelected
                ? 'border-accent-8 ring-2 ring-accent-5'
                : 'hover:bg-gray-3',
            )}
          >
            <ClientIcon icon={client.icon} className="size-6 rounded-md" />
            <span className="whitespace-nowrap font-medium">{client.name}</span>
            {isConnected && (
              <span className="size-1.5 rounded-full bg-success-10" />
            )}
          </button>
        );
      })}
    </div>
  );
}

function elbow({ x, y }: { x: number; y: number }): string {
  const midX = (x + hubX(x)) / 2;
  return `M ${x} ${y} H ${midX} V 50 H ${hubX(x)}`;
}

function hubX(x: number): number {
  return x < 50 ? 30 : x > 50 ? 70 : 50;
}

export type DesignProps = {
  home: ConnectHome;
  serverUrl: string;
  isReachableFromInternet: boolean;
};
