import { t } from 'i18next';
import { ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';

import { BackLink } from '@/components/custom/back-link';
import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { PageSection } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ClientIcon } from '../client-icon';
import {
  CatalogClient,
  ClientGroup,
  mcpClientCatalog,
} from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';

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
    <>
      <div className="flex flex-col gap-2">
        <BackLink label={t('Back')} onClick={nav.showLanding} />
        <PageSection
          className="mt-0"
          title={t('Where do you want to use it?')}
          description={t(
            'Pick a client for step-by-step setup, or copy the link and paste it wherever you like.',
          )}
          action={
            <div className="flex items-center gap-2 rounded-xl border bg-gray-2 py-1 pr-1 pl-3">
              <span className="font-mono text-sm text-gray-11">
                {abbreviateServerUrl(serverUrl)}
              </span>
              <CopyButton textToCopy={serverUrl} variant="default" size="sm">
                {t('Copy')}
              </CopyButton>
            </div>
          }
        >
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-gray-11" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Search {total} clients', {
                total: clients.length,
              })}
              className="pr-36 pl-9"
              autoFocus
            />
            <Button
              variant="link"
              className="absolute right-3"
              onClick={() => nav.showClient('unknown')}
            >
              {t('Client not listed?')}
            </Button>
          </div>
        </PageSection>
      </div>

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
        <span className="text-sm text-gray-11">
          {t('No client matches your search.')}
        </span>
      )}
    </>
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
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{group.label}</span>
        {!isCatchAll && (
          <>
            <span className="text-xs font-medium text-gray-11 tabular-nums">
              {clients.length}
            </span>
            <span className="text-xs text-gray-11">· {group.tagline}</span>
          </>
        )}
      </div>
      {isCatchAll ? (
        clients.map((client) => (
          <button
            key={client.key}
            type="button"
            onClick={() => nav.showClient(client.key)}
            className="flex items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 text-left transition-colors hover:bg-gray-3"
          >
            <ClientIcon icon={client.icon} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium">{client.name}</span>
              <span className="truncate text-xs text-gray-11">
                {client.setupHint}
              </span>
            </div>
            <span className="hidden h-8 shrink-0 items-center gap-1.5 rounded-lg border border-gray-7 bg-panel px-2.5 text-sm font-medium sm:flex">
              {t('See the raw config')}
              <ChevronRight className="size-4" />
            </span>
          </button>
        ))
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2">
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
