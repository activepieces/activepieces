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
  const home = useConnectHome({ clients, watch });
  const selected =
    home.clients.find((client) => client.key === clientKey) ?? null;

  if (view === 'client' && selected !== null) {
    return (
      <ClientInstructions
        key={selected.key}
        client={selected}
        grants={home.grantsByClient.get(selected.key)}
        serverUrl={serverUrl}
        isReachableFromInternet={isReachableFromInternet}
      />
    );
  }

  return <ConnectPage home={home} />;
}
