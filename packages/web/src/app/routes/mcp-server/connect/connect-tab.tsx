import { ApEdition, ApFlagId } from '@activepieces/shared';
import { useMemo } from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';

import { mcpClientCatalog } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';

import { ClientInstructions } from './client-instructions';
import { ClientPicker } from './client-picker';
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

  return <ConnectLanding clients={clients} serverUrl={serverUrl} />;
}
