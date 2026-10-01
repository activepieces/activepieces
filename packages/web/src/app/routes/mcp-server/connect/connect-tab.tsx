import { ApEdition, ApFlagId } from '@activepieces/shared';
import { useMemo } from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';

import { mcpClientCatalog } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';

import { ClientSetup } from './client-setup';
import { ConnectLanding } from './connect-landing';

export function ConnectTab({
  serverUrl,
  isReachableFromInternet,
}: {
  serverUrl: string;
  isReachableFromInternet: boolean;
}) {
  const { view, clientKey } = useMcpNav();
  const { websiteName } = flagsHooks.useWebsiteBranding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;
  const clients = useMemo(
    () => mcpClientCatalog.clients({ serverUrl, websiteName, isCloud }),
    [serverUrl, websiteName, isCloud],
  );
  const selected = clients.find((client) => client.key === clientKey) ?? null;

  if (view === 'client' && selected !== null) {
    return (
      <ClientSetup
        key={selected.key}
        client={selected}
        serverUrl={serverUrl}
        isReachableFromInternet={isReachableFromInternet}
      />
    );
  }

  return (
    <ConnectLanding
      clients={clients}
      serverUrl={serverUrl}
      brandName={websiteName}
      scrollToClients={view === 'browse'}
    />
  );
}
