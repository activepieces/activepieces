import { t } from 'i18next';
import { KeyRound, ShieldCheck, Unplug } from 'lucide-react';
import { useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';

import { CatalogClient } from '../mcp-client-catalog';
import { PageBand } from '../page-band';

import { ConnectCard } from './connect-card';
import { ConnectedCard } from './connected-card';
import { ExampleCard } from './example-card';
import { useConnectHome } from './use-connect-home';

export function ConnectHome({
  clients,
  serverUrl,
  isReachableFromInternet,
}: {
  clients: CatalogClient[];
  serverUrl: string;
  isReachableFromInternet: boolean;
}) {
  const home = useConnectHome({ clients });
  const [isAdding, setIsAdding] = useState(false);
  const showConnected = home.isConnected && !isAdding;

  return (
    <PageBand className="flex flex-col gap-8 py-10">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          {home.isConnected
            ? t('{client} is connected. Ask it anything.', {
                client: home.exampleClient.name,
              })
            : t('Ask your AI. {brand} does the work.', {
                brand: home.brandName,
              })}
        </h1>
        <p className="max-w-[720px] text-base text-gray-11">
          {home.isConnected
            ? t(
                'It works in the projects you approved. Try a prompt, or connect another client.',
              )
            : t(
                'Connect Claude, Cursor or ChatGPT, and your AI can run actions in your apps, build and fix flows, and work with your tables.',
              )}
        </p>
        <TrustRow />
      </header>

      {home.isLoading ? (
        <Skeleton className="h-[480px] w-full rounded-xl" />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <ExampleCard home={home} className="lg:col-span-7" />
          {showConnected ? (
            <ConnectedCard
              home={home}
              serverUrl={serverUrl}
              onAddClient={() => setIsAdding(true)}
              className="lg:col-span-5"
            />
          ) : (
            <ConnectCard
              home={home}
              serverUrl={serverUrl}
              isReachableFromInternet={isReachableFromInternet}
              onBack={home.isConnected ? () => setIsAdding(false) : undefined}
              className="lg:col-span-5"
            />
          )}
        </div>
      )}
    </PageBand>
  );
}

function TrustRow() {
  const items = [
    { icon: KeyRound, text: t('One-time OAuth sign-in, no API keys') },
    {
      icon: ShieldCheck,
      text: t('Uses your permissions, only in projects you approve'),
    },
    { icon: Unplug, text: t('Revoke any client at any time') },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
      {items.map((item) => (
        <li
          key={item.text}
          className="flex items-center gap-2 text-sm text-gray-11"
        >
          <item.icon className="size-4" />
          {item.text}
        </li>
      ))}
    </ul>
  );
}
