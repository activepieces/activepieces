import { ApEdition, ApFlagId } from '@activepieces/shared';
import { useMemo } from 'react';

import { flagsHooks } from '@/hooks/flags-hooks';

import { mcpClientCatalog } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';

import { ClientInstructions } from './client-instructions';
import { ClientPicker } from './client-picker';
import { DevDirectionPicker, useDevDirection } from './dev-direction-picker';
import { TakeHub } from './take-hub';
import { TakeLogoFirst } from './take-logo-first';
import { TakeTranscript } from './take-transcript';
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

  return (
    <ConnectHomeView
      clients={clients}
      serverUrl={serverUrl}
      isReachableFromInternet={isReachableFromInternet}
    />
  );
}

function ConnectHomeView({
  clients,
  serverUrl,
  isReachableFromInternet,
}: {
  clients: ReturnType<typeof mcpClientCatalog.clients>;
  serverUrl: string;
  isReachableFromInternet: boolean;
}) {
  const dev = useDevDirection();
  const home = useConnectHome({
    clients,
    forcedState: import.meta.env.DEV ? dev.settings.state : 'auto',
  });
  const props = { home, serverUrl, isReachableFromInternet };
  const direction = import.meta.env.DEV ? dev.settings.direction : 'logos';

  return (
    <>
      {home.isGrantsLoading ? null : direction === 'transcript' ? (
        <TakeTranscript {...props} />
      ) : direction === 'hub' ? (
        <TakeHub {...props} />
      ) : (
        <TakeLogoFirst {...props} />
      )}
      {import.meta.env.DEV && (
        <DevDirectionPicker settings={dev.settings} onChange={dev.update} />
      )}
    </>
  );
}
