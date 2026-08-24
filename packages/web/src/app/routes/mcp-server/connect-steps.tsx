import { t } from 'i18next';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Plug,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { CollapsibleJson } from '@/components/custom/collapsible-json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import { IntegrationsBanner } from './integrations-banner';
import {
  ClientGroup,
  ConnectStep,
  ConnectableClient,
  POPULAR_CLIENT_KEYS,
  mcpClientCatalog,
} from './mcp-client-catalog';
import { RecentlyConnected } from './recently-connected';

export function ConnectSteps({
  serverUrl,
  isPublicUrl,
  onManageConnections,
}: {
  serverUrl: string;
  isPublicUrl: boolean;
  onManageConnections: () => void;
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isBrowsingAll, setIsBrowsingAll] = useState(false);
  const clients = useMemo(() => mcpClientCatalog.build(serverUrl), [serverUrl]);
  const selected = clients.find((client) => client.key === selectedKey) ?? null;

  if (selected !== null) {
    return (
      <ClientInstructions
        client={selected}
        serverUrl={serverUrl}
        isPublicUrl={isPublicUrl}
        totalClients={clients.length}
        onBack={() => setSelectedKey(null)}
        onBrowseAll={() => {
          setSelectedKey(null);
          setIsBrowsingAll(true);
        }}
      />
    );
  }

  if (isBrowsingAll) {
    return (
      <ClientBrowser
        clients={clients}
        serverUrl={serverUrl}
        onSelect={setSelectedKey}
        onBack={() => setIsBrowsingAll(false)}
      />
    );
  }

  return (
    <ConnectLanding
      clients={clients}
      serverUrl={serverUrl}
      onSelect={setSelectedKey}
      onBrowseAll={() => setIsBrowsingAll(true)}
      onManageConnections={onManageConnections}
    />
  );
}

function ConnectLanding({
  clients,
  serverUrl,
  onSelect,
  onBrowseAll,
  onManageConnections,
}: {
  clients: ConnectableClient[];
  serverUrl: string;
  onSelect: (key: string) => void;
  onBrowseAll: () => void;
  onManageConnections: () => void;
}) {
  const popular = POPULAR_CLIENT_KEYS.map((key) =>
    clients.find((client) => client.key === key),
  ).filter((client): client is ConnectableClient => client !== undefined);

  return (
    <div className="flex flex-col bg-background">
      <div className="mx-auto w-full max-w-[1198px] flex flex-col gap-16 px-6 py-12 lg:flex-row lg:px-14">
        <div className="flex max-w-[628px] flex-1 flex-col gap-5">
          <h1 className="max-w-[455px] text-[40px] font-bold leading-[46px] tracking-[-0.035em]">
            {t('One link for everywhere you use AI.')}
          </h1>
          <p className="max-w-[500px] text-[15.5px] leading-[25px] text-muted-foreground">
            {t(
              'Your AI stops guessing and starts doing — sending the Slack message, updating the CRM, running the flow. Paste it into any client that speaks MCP.',
            )}
          </p>
          <div className="mt-1 flex items-center gap-3.5 rounded-[11px] border bg-muted/40 py-2.5 pl-5 pr-2.5">
            <span className="min-w-0 flex-1 truncate font-mono text-[13px] tracking-[-0.01em]">
              {serverUrl}
            </span>
            <CopyButton
              textToCopy={serverUrl}
              variant="default"
              className="shrink-0"
            >
              {t('Copy link')}
            </CopyButton>
          </div>
          <div className="flex flex-wrap items-center gap-5 pt-0.5">
            <TrustPoint text={t('No API keys to manage')} />
            <TrustPoint text={t('Revoke any client in one click')} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-[396px]">
          <span className="px-0.5 pb-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {t('Need the exact steps?')}
          </span>
          {popular.map((client, index) => (
            <ClientCard
              key={client.key}
              client={client}
              highlighted={index === 0}
              onClick={() => onSelect(client.key)}
            />
          ))}
          <button
            type="button"
            onClick={onBrowseAll}
            className="mt-0.5 flex items-center justify-center gap-2 rounded-[11px] bg-muted py-3 text-[13.5px] font-semibold transition-colors hover:bg-muted/70"
          >
            {t('See all {total} clients', { total: clients.length })}
            <ChevronRight className="size-[15px]" />
          </button>
        </div>
      </div>

      <IntegrationsBanner />
      <RecentlyConnected
        onManageConnections={onManageConnections}
        onPickClient={onBrowseAll}
      />
    </div>
  );
}

function ClientBrowser({
  clients,
  serverUrl,
  onSelect,
  onBack,
}: {
  clients: ConnectableClient[];
  serverUrl: string;
  onSelect: (key: string) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const matches = clients.filter(
    (client) =>
      needle === '' ||
      client.name.toLowerCase().includes(needle) ||
      client.hint.toLowerCase().includes(needle),
  );

  return (
    <div className="flex flex-col bg-background">
      <div className="border-b">
        <div className="mx-auto w-full max-w-[1198px] flex flex-col gap-4.5 px-6 pb-6 pt-8 lg:px-12">
          <BackLink label={t('Back')} onClick={onBack} />
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex flex-1 flex-col gap-1.5">
              <h1 className="text-[26px] font-bold leading-8 tracking-[-0.025em]">
                {t('Where do you want to use it?')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t(
                  'Pick a client for step-by-step setup, or copy the link and paste it wherever you like.',
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5 rounded-[9px] border bg-muted/40 py-2 pl-3.5 pr-2">
              <span className="font-mono text-xs text-muted-foreground">
                {shortServerUrl(serverUrl)}
              </span>
              <CopyButton textToCopy={serverUrl} variant="default" size="sm">
                {t('Copy')}
              </CopyButton>
            </div>
          </div>
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Search {total} clients', {
                total: clients.length,
              })}
              className="h-11 pl-10 pr-36"
              autoFocus
            />
            <Button
              variant="link"
              className="absolute right-1.5 h-auto text-[12.5px] font-semibold"
              onClick={() => onSelect('unknown')}
            >
              {t('Client not listed?')}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1198px] flex flex-col gap-7 px-6 py-7 lg:px-12">
        {mcpClientCatalog.groups().map((group) => {
          const groupClients = matches.filter(
            (client) => client.group === group.key,
          );
          if (groupClients.length === 0) {
            return null;
          }
          return (
            <ClientGroupSection
              key={group.key}
              group={group}
              clients={groupClients}
              onSelect={onSelect}
            />
          );
        })}
        {matches.length === 0 && (
          <span className="text-sm text-muted-foreground">
            {t('No client matches your search.')}
          </span>
        )}
      </div>
    </div>
  );
}

function ClientGroupSection({
  group,
  clients,
  onSelect,
}: {
  group: ClientGroup;
  clients: ConnectableClient[];
  onSelect: (key: string) => void;
}) {
  const isCatchAll = group.key === 'other';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-[0.04em]">
          {group.label}
        </span>
        {!isCatchAll && (
          <>
            <span className="text-xs font-semibold text-muted-foreground">
              {clients.length}
            </span>
            <span className="text-[12.5px] text-muted-foreground">
              · {group.tagline}
            </span>
          </>
        )}
      </div>
      {isCatchAll ? (
        clients.map((client) => (
          <button
            key={client.key}
            type="button"
            onClick={() => onSelect(client.key)}
            className="flex items-center gap-3.5 rounded-[11px] border border-dashed bg-muted/40 px-4.5 py-4 text-left transition-colors hover:border-ring"
          >
            <ClientIcon icon={client.icon} className="size-[34px]" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[13.5px] font-semibold">{client.name}</span>
              <span className="truncate text-[12.5px] text-muted-foreground">
                {client.hint}
              </span>
            </div>
            <span className="hidden shrink-0 items-center gap-1.5 rounded-md border bg-background px-3.5 py-2 text-[13px] font-semibold sm:flex">
              {t('See the raw config')}
              <ChevronRight className="size-3.5" />
            </span>
          </button>
        ))
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
          {clients.map((client) => (
            <ClientCard
              key={client.key}
              client={client}
              onClick={() => onSelect(client.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientInstructions({
  client,
  serverUrl,
  isPublicUrl,
  totalClients,
  onBack,
  onBrowseAll,
}: {
  client: ConnectableClient;
  serverUrl: string;
  isPublicUrl: boolean;
  totalClients: number;
  onBack: () => void;
  onBrowseAll: () => void;
}) {
  return (
    <div className="flex flex-col bg-background">
      <div className="border-b">
        <div className="mx-auto w-full max-w-[1198px] flex flex-col gap-4.5 px-6 pb-6 pt-8 lg:px-12">
          <BackLink label={t('All clients')} onClick={onBack} />
          <div className="flex flex-wrap items-center gap-4">
            <ClientIcon icon={client.icon} className="size-[52px] rounded-xl" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 className="text-[26px] font-bold leading-8 tracking-[-0.025em]">
                {client.name}
              </h1>
              <span className="text-[13.5px] text-muted-foreground">
                {client.kind}
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={client.docsUrl} target="_blank" rel="noreferrer">
                <ExternalLink />
                {t('{client} docs', { client: client.name })}
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1198px] flex flex-col gap-8 px-6 pb-10 pt-8 lg:flex-row lg:px-12">
        <div className="flex min-w-0 flex-1 flex-col">
          {client.steps.map((step, index) => (
            <ConnectStepRow
              key={step.title}
              number={index + 1}
              step={step}
              config={index === 0 ? client.config : undefined}
              isLast={index === client.steps.length - 1}
              isPublicUrl={isPublicUrl}
            />
          ))}
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 lg:w-[344px]">
          <div className="flex flex-col gap-2.5 rounded-[11px] border p-4.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              {t('Server URL')}
            </span>
            <span className="break-all font-mono text-[11.5px] leading-[18px]">
              {serverUrl}
            </span>
            <div className="flex items-center gap-2 pt-1">
              <CopyButton textToCopy={serverUrl} variant="default" size="sm">
                {t('Copy link')}
              </CopyButton>
              {client.config && (
                <CopyButton
                  textToCopy={client.config.snippet}
                  variant="outline"
                  size="sm"
                >
                  {t('Copy config')}
                </CopyButton>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onBrowseAll}
            className="flex items-center gap-2.5 rounded-[11px] border px-4 py-3.5 text-left transition-colors hover:border-ring"
          >
            <Plug className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-[13px] text-muted-foreground">
              {t('Using something else?')}
            </span>
            <span className="shrink-0 text-[13px] font-semibold text-primary">
              {t('All {total} clients', { total: totalClients })}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ConnectStepRow({
  number,
  step,
  config,
  isLast,
  isPublicUrl,
}: {
  number: number;
  step: ConnectStep;
  config?: { label: string; snippet: string };
  isLast: boolean;
  isPublicUrl: boolean;
}) {
  const blockedByPrivateUrl =
    step.action?.requiresInternetReachableUrl === true && !isPublicUrl;

  return (
    <div className="flex gap-4">
      <div className="flex w-6 shrink-0 flex-col items-center gap-1.5">
        <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-foreground text-[11px] font-semibold text-background">
          {number}
        </span>
        {!isLast && <div className="w-px flex-1 bg-border" />}
      </div>
      <div
        className={cn('flex min-w-0 flex-1 flex-col gap-3', {
          'pb-7': !isLast,
        })}
      >
        <div className="flex flex-col gap-[3px]">
          <span className="text-[15px] font-bold tracking-[-0.01em]">
            {step.title}
          </span>
          <span className="text-[13px] text-muted-foreground">{step.body}</span>
        </div>
        {step.command && <TerminalBlock command={step.command} />}
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
        {step.prompts && (
          <div className="flex flex-col gap-2">
            {step.prompts.map((prompt) => (
              <span
                key={prompt}
                className="flex items-center gap-2.5 rounded-[9px] border px-3.5 py-2.5 text-[13px]"
              >
                <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                {prompt}
              </span>
            ))}
          </div>
        )}
        {config && (
          <CollapsibleJson json={config.snippet} label={config.label} />
        )}
      </div>
    </div>
  );
}

function TerminalBlock({ command }: { command: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg">
      <div className="flex items-center gap-2 bg-[#1E1C1B] px-3.5 py-2">
        <span className="flex-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-neutral-400">
          {t('Terminal')}
        </span>
        <CopyButton
          textToCopy={command}
          variant="ghost"
          size="sm"
          className="h-auto gap-1.5 rounded-sm bg-white/10 px-2.5 py-1 text-[11.5px] text-neutral-200 hover:bg-white/20 hover:text-white"
        >
          {t('Copy')}
        </CopyButton>
      </div>
      <div className="flex items-start gap-3 overflow-x-auto bg-[#141414] px-4 py-4">
        <span className="shrink-0 font-mono text-[12.5px] leading-[21px] text-emerald-300">
          $
        </span>
        <pre className="min-w-0 whitespace-pre-wrap break-all font-mono text-[12.5px] leading-[21px] text-neutral-200">
          {command}
        </pre>
      </div>
    </div>
  );
}

function ClientCard({
  client,
  highlighted = false,
  onClick,
}: {
  client: ConnectableClient;
  highlighted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-[11px] border px-3.5 py-3 text-left transition-colors',
        highlighted
          ? 'border-primary bg-primary/5'
          : 'hover:border-ring hover:bg-accent/40',
      )}
    >
      <ClientIcon icon={client.icon} />
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="truncate text-sm font-semibold">{client.name}</span>
        <span className="truncate text-[12.5px] text-muted-foreground">
          {client.hint}
        </span>
      </div>
      <ChevronRight className="size-[17px] shrink-0 text-muted-foreground" />
    </button>
  );
}

function TrustPoint({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
      <Check className="size-3.5 text-success-600" />
      {text}
    </span>
  );
}

function BackLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-[15px]" />
      {label}
    </button>
  );
}

function shortServerUrl(serverUrl: string): string {
  try {
    return `…${new URL(serverUrl).pathname}`;
  } catch {
    return serverUrl;
  }
}

export function ClientIcon({
  icon,
  className = 'size-8',
}: {
  icon: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-[9px] border bg-background',
        className,
      )}
    >
      <img src={icon} alt="" className="size-[62%]" />
    </span>
  );
}
