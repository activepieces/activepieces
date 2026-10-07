import { t } from 'i18next';
import { ChevronDown, KeyRound, ShieldCheck, Unplug } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import { PageBand } from '../page-band';

import {
  ConnectedCard,
  DesignProps,
  InstallButton,
  SetupCard,
  UrlCard,
} from './designs';

export function DesignDirectory(props: DesignProps) {
  const { home } = props;
  const [openKey, setOpenKey] = useState<string | null>(null);
  return (
    <PageBand className="flex max-w-[960px] flex-col gap-8 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t('Connect your AI to {brand}', { brand: home.brandName })}
        </h1>
        <p className="text-base text-gray-11">
          {t(
            'Pick your client and follow one step. It signs in with OAuth, so there are no API keys.',
          )}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ConnectedCard home={home} />
        <UrlCard serverUrl={props.serverUrl} />
      </div>
      <section className="flex flex-col rounded-xl border bg-panel">
        {home.clients.map((client) => {
          const isOpen = openKey === client.key;
          return (
            <div key={client.key} className="border-b last:border-b-0">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => {
                  home.select(client.key);
                  setOpenKey(isOpen ? null : client.key);
                }}
                className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-3"
              >
                <ClientIcon icon={client.icon} className="size-9 rounded-lg" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{client.name}</span>
                  <span className="text-xs text-gray-11">
                    {client.subtitle}
                  </span>
                </span>
                {home.grantsByClient.has(client.key) && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-11">
                    <span className="size-1.5 rounded-full bg-success-10" />
                    {t('Connected')}
                  </span>
                )}
                <span className="text-xs text-gray-11">{client.setupHint}</span>
                <ChevronDown
                  className={cn(
                    'size-4 text-gray-9 transition-transform',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-6">
                  <SetupCard {...props} />
                </div>
              )}
            </div>
          );
        })}
      </section>
    </PageBand>
  );
}

export function DesignSplitTiles(props: DesignProps) {
  const { home } = props;
  const trust = [
    { icon: KeyRound, text: t('One-time OAuth sign-in, no API keys') },
    {
      icon: ShieldCheck,
      text: t('Uses your permissions, only in projects you approve'),
    },
    { icon: Unplug, text: t('Revoke any client at any time') },
  ];
  return (
    <PageBand className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-5">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight">
          {t('Your AI, now with {brand} inside.', { brand: home.brandName })}
        </h1>
        <p className="text-base text-gray-11">
          {t(
            'Run actions in your apps, build and fix flows, and work with your tables, from the AI you already use.',
          )}
        </p>
        <ul className="flex flex-col gap-3">
          {trust.map((item) => (
            <li key={item.text} className="flex items-center gap-3 text-sm">
              <item.icon className="size-4 text-gray-11" />
              {item.text}
            </li>
          ))}
        </ul>
        <UrlCard serverUrl={props.serverUrl} />
        <ConnectedCard home={home} />
      </div>
      <div className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2 lg:col-span-7">
        {home.clients.map((client) => (
          <div
            key={client.key}
            className="flex flex-col gap-4 rounded-xl border bg-panel p-5"
          >
            <div className="flex items-center gap-3">
              <ClientIcon icon={client.icon} className="size-10 rounded-lg" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">{client.name}</span>
                <span className="text-xs text-gray-11">{client.setupHint}</span>
              </span>
              {home.grantsByClient.has(client.key) && (
                <span className="size-2 rounded-full bg-success-10" />
              )}
            </div>
            <InstallButton
              client={client}
              home={home}
              isReachableFromInternet={props.isReachableFromInternet}
            />
          </div>
        ))}
      </div>
    </PageBand>
  );
}
