import { ApEdition, ApFlagId } from '@activepieces/shared';
import { t } from 'i18next';
import { useMemo } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { LogoPlate } from '@/components/custom/logo-plate';
import { Panel } from '@/components/custom/panel';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { StatusDot } from '@/components/custom/status-dot';
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
  const { data: grants } = mcpGrantsQueries.useGrants({
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
  return (
    <>
      <Select value={selectedKey} onValueChange={onSelect}>
        <SelectTrigger
          className="w-full lg:hidden"
          aria-label={t('AI client')}
        >
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
        <nav aria-label={t('AI clients')} className="flex flex-col p-1">
          {clients.map((client) => {
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
