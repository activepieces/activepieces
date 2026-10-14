import { ApEdition, ApFlagId } from '@activepieces/shared';
import { useMemo } from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';

import { mcpClientCatalog } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';

import { ClientInstructions } from './client-instructions';
import { ConnectPage } from './connect-page';
import { useConnectHome, useConnectWatch } from './use-connect-home';

export function ConnectTab({
  serverUrl,
  isReachableFromInternet,
}: {
  serverUrl: string;
  isReachableFromInternet: boolean;
}) {
  const { view, clientKey } = useMcpNav();
  const watch = useConnectWatch();
  const { websiteName } = flagsHooks.useWebsiteBranding();
  const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
  const isCloud = edition === ApEdition.CLOUD;
  const clients = useMemo(
    () => mcpClientCatalog.clients({ serverUrl, websiteName, isCloud }),
    [serverUrl, websiteName, isCloud],
  );
  const selected =
    clients.find(
      (client) =>
        clientKey !== null &&
        client.key === mcpClientCatalog.resolveKey(clientKey),
    ) ?? null;
  const setupClient = view === 'client' ? selected : null;
  const home = useConnectHome({ clients, watch, setupClient });

  if (setupClient !== null) {
    return (
      <ClientInstructions
        key={setupClient.key}
        client={setupClient}
        grants={home.grantsByClient.get(setupClient.key)}
        serverUrl={serverUrl}
        isReachableFromInternet={isReachableFromInternet}
      />
    );
  }

  return <ConnectPage home={home} serverUrl={serverUrl} />;
}
