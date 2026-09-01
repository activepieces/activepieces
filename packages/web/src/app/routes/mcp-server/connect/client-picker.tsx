import { t } from 'i18next';
import { ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';

import { BackLink } from '@/components/custom/back-link';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ClientIcon } from '../client-icon';
import {
  CatalogClient,
  ClientGroup,
  mcpClientCatalog,
} from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

import { ClientCard } from './client-card';

export function ClientPicker({
  clients,
  serverUrl,
}: {
  clients: CatalogClient[];
  serverUrl: string;
}) {
  const nav = useMcpNav();
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const matchingClients = clients.filter(
    (client) => query === '' || client.name.toLowerCase().includes(query),
  );

  return (
    <div className="flex flex-col bg-background">
      <div className="border-b">
        <PageBand className="flex flex-col gap-4.5 pb-6 pt-8">
          <BackLink label={t('Back')} onClick={nav.showLanding} />
          <div className="flex flex-wrap items-end gap-6">
            <div className="flex flex-1 flex-col gap-1.5">
              <h1 className="text-2xl font-bold leading-8 tracking-tight">
                {t('Where do you want to use it?')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t(
                  'Pick a client for step-by-step setup, or copy the link and paste it wherever you like.',
                )}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5 rounded-md border bg-muted/40 py-2 pl-3.5 pr-2">
              <span className="font-mono text-xs text-muted-foreground">
                {abbreviateServerUrl(serverUrl)}
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
              className="absolute right-3.5 h-auto text-xs font-semibold"
              onClick={() => nav.showClient('unknown')}
            >
              {t('Client not listed?')}
            </Button>
          </div>
        </PageBand>
      </div>

      <PageBand className="flex flex-col gap-7 py-7">
        {mcpClientCatalog.groups().map((group) => {
          const groupClients = matchingClients.filter(
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
            />
          );
        })}
        {matchingClients.length === 0 && (
          <span className="text-sm text-muted-foreground">
            {t('No client matches your search.')}
          </span>
        )}
      </PageBand>
    </div>
  );
}

function ClientGroupSection({
  group,
  clients,
}: {
  group: ClientGroup;
  clients: CatalogClient[];
}) {
  const nav = useMcpNav();
  const isCatchAll = group.key === 'other';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide">
          {group.label}
        </span>
        {!isCatchAll && (
          <>
            <span className="text-xs font-semibold text-muted-foreground">
              {clients.length}
            </span>
            <span className="text-xs text-muted-foreground">
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
            onClick={() => nav.showClient(client.key)}
            className="flex items-center gap-3.5 rounded-md border border-dashed bg-muted/40 px-4.5 py-4 text-left transition-colors hover:border-ring"
          >
            <ClientIcon icon={client.icon} className="size-8.5" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">{client.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {client.setupHint}
              </span>
            </div>
            <span className="hidden shrink-0 items-center gap-1.5 rounded-md border bg-background px-3.5 py-2 text-sm font-semibold sm:flex">
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
              onClick={() => nav.showClient(client.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function abbreviateServerUrl(serverUrl: string): string {
  try {
    return `…${new URL(serverUrl).pathname}`;
  } catch {
    return serverUrl;
  }
}
