import { ApEdition, ApFlagId } from '@activepieces/shared';
import { useMemo } from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';

import { CatalogClient, mcpClientCatalog } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';

import { ClientInstructions } from './client-instructions';
import { ClientPicker } from './client-picker';
import { ConnectHome } from './connect-home';
import { DesignGrouped, DesignWires, DesignWiresGrid } from './designs';
import { DesignDirectory, DesignSplitTiles } from './designs-more';
import { DevDesignSwitch, useDevDesign } from './dev-design-switch';
import { useConnectHome } from './use-connect-home';

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
      <ClientInstructions
        client={selected}
        serverUrl={serverUrl}
        isReachableFromInternet={isReachableFromInternet}
        totalClients={clients.length}
      />
    );
  }

  if (view === 'browse') {
    return <ClientPicker clients={clients} serverUrl={serverUrl} />;
  }

  return import.meta.env.DEV ? (
    <DevDesigns
      clients={clients}
      serverUrl={serverUrl}
      isReachableFromInternet={isReachableFromInternet}
    />
  ) : (
    <ConnectHome
      clients={clients}
      serverUrl={serverUrl}
      isReachableFromInternet={isReachableFromInternet}
    />
  );
}

function DevDesigns({
  clients,
  serverUrl,
  isReachableFromInternet,
}: {
  clients: CatalogClient[];
  serverUrl: string;
  isReachableFromInternet: boolean;
}) {
  const dev = useDevDesign();
  const home = useConnectHome({ clients });
  const props = { home, serverUrl, isReachableFromInternet };
  return (
    <>
      {dev.design === 'a' ? (
        <DesignGrouped {...props} />
      ) : dev.design === 'b' ? (
        <DesignWires {...props} />
      ) : dev.design === 'c' ? (
        <DesignWiresGrid {...props} />
      ) : dev.design === 'd' ? (
        <DesignDirectory {...props} />
      ) : dev.design === 'e' ? (
        <DesignSplitTiles {...props} />
      ) : (
        <ConnectHome
          clients={clients}
          serverUrl={serverUrl}
          isReachableFromInternet={isReachableFromInternet}
        />
      )}
      <DevDesignSwitch design={dev.design} onChange={dev.setDesign} />
    </>
  );
}
