import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { useMemo, useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { ListSearch } from '@/components/custom/list/list-toolbar';
import { LogoPlate } from '@/components/custom/logo-plate';
import { Panel } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';

import { CatalogClient, mcpClientCatalog } from '../mcp-client-catalog';
import { mcpGrantsQueries } from '../mcp-grants-hooks';
import { useMcpNav } from '../mcp-nav';

import { ClientSetup } from './client-setup';
import { ConnectStatus } from './connect-status';

export function ConnectTab({
  serverUrl,
  isReachableFromInternet,
}: {
  serverUrl: string;
  isReachableFromInternet: boolean;
}) {
  const nav = useMcpNav();
  const { websiteName } = flagsHooks.useWebsiteBranding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;
  const clients = useMemo(
    () => mcpClientCatalog.clients({ serverUrl, websiteName, isCloud }),
    [serverUrl, websiteName, isCloud],
  );
  const {
    data: grants,
    isLoading: grantsLoading,
    isError: grantsError,
  } = mcpGrantsQueries.useGrants({
    request: { limit: GRANTS_TO_CHECK },
  });
  const connectedKeys = new Set<string>(
    (grants?.data ?? []).flatMap((grant) =>
      grant.clientKey === null ? [] : [grant.clientKey],
    ),
  );
  const selected =
    clients.find((client) => client.key === nav.clientKey) ?? clients[0];

  return (
    <div className="flex flex-col gap-6">
      <ConnectStatus
        grants={grants?.data ?? []}
        isLoading={grantsLoading}
        isError={grantsError}
      />
      <section>
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <ClientPicker
              clients={clients}
              selectedKey={selected.key}
              connectedKeys={connectedKeys}
              onSelect={nav.showClient}
            />
            <div className="hidden min-w-0 flex-col gap-1.5 px-1 lg:flex">
              <span className="text-xs font-medium text-gray-11">
                {t('Server URL')}
              </span>
              <div className="flex min-w-0 items-center gap-1 rounded-lg border bg-panel py-0.5 pr-0.5 pl-2.5">
                <TextWithTooltip tooltipMessage={serverUrl}>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-12">
                    {serverUrl}
                  </span>
                </TextWithTooltip>
                <CopyButton
                  textToCopy={serverUrl}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('Copy server URL')}
                />
              </div>
            </div>
          </div>
          <ClientSetup
            key={selected.key}
            client={selected}
            serverUrl={serverUrl}
            connected={connectedKeys.has(selected.key)}
            isReachableFromInternet={isReachableFromInternet}
          />
        </div>
      </section>
    </div>
  );
}

function ClientPicker({
  clients,
  selectedKey,
  connectedKeys,
  onSelect,
}: {
  clients: CatalogClient[];
  selectedKey: string;
  connectedKeys: Set<string>;
  onSelect: (key: string) => void;
}) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const matching = clients.filter(
    (client) => query === '' || client.name.toLowerCase().includes(query),
  );
  return (
    <>
      <Select value={selectedKey} onValueChange={onSelect}>
        <SelectTrigger className="w-full lg:hidden" aria-label={t('AI client')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {clients.map((client) => (
            <SelectItem key={client.key} value={client.key}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Panel flush className="hidden lg:flex">
        <div className="border-b p-2">
          <ListSearch
            value={search}
            onChange={setSearch}
            placeholder={t('Search {total} clients', {
              total: clients.length,
            })}
          />
        </div>
        <nav aria-label={t('AI clients')} className="flex flex-col p-1">
          {matching.length === 0 && (
            <div className="flex flex-col items-start gap-1 px-2 py-2 text-sm text-gray-11">
              {t('No client matches your search.')}
              <button
                type="button"
                className="font-medium text-accent-11 hover:underline"
                onClick={() => {
                  setSearch('');
                  onSelect('unknown');
                }}
              >
                {t('Use Any MCP client')}
              </button>
            </div>
          )}
          {matching.map((client) => {
            const active = client.key === selectedKey;
            return (
              <button
                key={client.key}
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(client.key)}
                className={cn(
                  'flex min-w-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm outline-hidden transition-colors hover:bg-gray-3 focus-visible:ring-3 focus-visible:ring-accent-8/50',
                  active && 'bg-gray-3',
                )}
              >
                <LogoPlate
                  src={client.icon}
                  alt=""
                  size="sm"
                  border
                  className="rounded-md"
                />
                <span
                  className={cn(
                    'min-w-0 flex-1 truncate',
                    active ? 'font-medium text-gray-12' : 'text-gray-12',
                  )}
                >
                  {client.name}
                </span>
                {connectedKeys.has(client.key) && (
                  <StatusDot tone="success" aria-label={t('Connected')} />
                )}
              </button>
            );
          })}
        </nav>
      </Panel>
    </>
  );
}

const GRANTS_TO_CHECK = 50;
