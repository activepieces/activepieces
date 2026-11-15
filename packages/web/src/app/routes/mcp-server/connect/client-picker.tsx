import { t } from 'i18next';
import { ArrowRight, SearchX } from 'lucide-react';
import { useState } from 'react';

import { BackLink } from '@/components/custom/back-link';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

import { CatalogClient, mcpClientCatalog } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

import { clientSearch } from './client-search';
import { ClientTile } from './client-tile';
import { GrantsLoadError } from './grants-load-error';
import { useConnectHome } from './use-connect-home';

export function ClientPicker({ clients }: { clients: CatalogClient[] }) {
  const home = useConnectHome({ clients });
  const nav = useMcpNav();
  const [search, setSearch] = useState('');
  const anyClient = home.allClients.find((client) => client.group === 'other');
  const isSearching = search.trim().length > 0;
  const groups = mcpClientCatalog
    .groups()
    .filter((group) => isSearching || group.key !== 'other');
  const matches = clientSearch.groupMatching({
    groups,
    clients: home.allClients,
    query: search,
  });
  const openAnyClient = anyClient
    ? () => nav.showClient(anyClient.key)
    : undefined;

  return (
    <div className="@container w-full">
      <PageBand className="flex flex-col gap-8 pb-16 pt-8">
        <div className="flex flex-col gap-4">
          <BackLink label={t('Back')} onClick={nav.showLanding} />
          <div className="grid gap-x-2.5 gap-y-2 @min-[860px]:grid-cols-3 @min-[860px]:items-center @min-[860px]:gap-y-1">
            <h1 className="text-2xl/8 font-medium tracking-tight @min-[860px]:col-span-2">
              {t('Where do you want to use it?')}
            </h1>
            <div className="order-last mt-2 @min-[860px]:order-none @min-[860px]:mt-0">
              <SearchInput
                autoFocus
                value={search}
                onChange={setSearch}
                placeholder={t('Search {total} clients', {
                  total: home.namedCount,
                })}
              />
            </div>
            <p className="text-sm text-gray-11 @min-[860px]:col-span-2">
              {t('Pick a client for step-by-step setup.')}
            </p>
            {openAnyClient && (
              <p className="text-sm text-gray-11 @min-[860px]:text-right">
                {t('Not listed?')} <AnyClientLink onOpen={openAnyClient} />
              </p>
            )}
          </div>
          {home.isStatusError && (
            <GrantsLoadError onRetry={() => home.refetchStatus()} />
          )}
        </div>

        {matches.length === 0 ? (
          <Empty className="min-h-80 rounded-xl border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>
                {t('No clients match “{query}”', { query: search.trim() })}
              </EmptyTitle>
              <EmptyDescription>
                {t('Check the spelling, or set it up as any MCP client.')}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="flex-row flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSearch('')}>
                {t('Clear search')}
              </Button>
              {openAnyClient && (
                <Button variant="ghost" size="sm" onClick={openAnyClient}>
                  {t('Use any MCP client')}
                  <ArrowRight />
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-col gap-10">
            {matches.map(({ group, clients: groupClients }) => (
              <section key={group.key} className="flex flex-col gap-3">
                <h2 className="text-sm/5 font-medium text-gray-12">
                  {group.label}
                  <span className="text-gray-11">
                    {' · '}
                    {groupClients.length}
                  </span>
                </h2>
                <div className="grid gap-2.5 @min-[440px]:grid-cols-2 @min-[860px]:grid-cols-3">
                  {groupClients.map((client) => (
                    <ClientTile
                      key={client.key}
                      client={client}
                      status={home.statusByClient.get(client.key)}
                      isStatusLoading={home.isStatusLoading}
                      onOpen={() => nav.showClient(client.key)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </PageBand>
    </div>
  );
}

function AnyClientLink({ onOpen }: { onOpen: () => void }) {
  return (
    <Button
      variant="link"
      size="sm"
      className="h-auto gap-1 p-0 font-medium text-gray-12"
      onClick={onOpen}
    >
      {t('Use any MCP client')}
      <ArrowRight className="size-3.5" />
    </Button>
  );
}
