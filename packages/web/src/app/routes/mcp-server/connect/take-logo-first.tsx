import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { PageBand } from '../page-band';

import {
  ClientLogo,
  ConnectAction,
  ControlLinks,
  FullStepsLink,
  GrantLogo,
  GrantStatus,
  PieceStrip,
  PromptList,
  WaitingNote,
  grantName,
  headlineCopy,
} from './connect-kit';
import { ConnectHome } from './use-connect-home';

export function TakeLogoFirst(props: TakeProps) {
  const { home } = props;
  const [isAdding, setIsAdding] = useState(false);
  const showConnect = !home.isConnected || isAdding;

  return (
    <PageBand className="grid grid-cols-1 items-start gap-16 py-16 lg:grid-cols-[1fr_456px]">
      <div className="flex min-w-0 flex-col gap-10 pt-4">
        {home.isConnected ? (
          <ConnectedLead home={home} />
        ) : (
          <FirstVisitLead home={home} />
        )}
      </div>

      <div className="flex flex-col gap-6 rounded-xl border bg-panel p-6 shadow-sm">
        {showConnect ? (
          <>
            <div className="flex items-center gap-2">
              <span className="flex-1 text-lg font-semibold tracking-tight">
                {isAdding
                  ? t('Connect another client')
                  : t('Where do you use AI?')}
              </span>
              {isAdding && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsAdding(false)}
                >
                  {t('Cancel')}
                </Button>
              )}
            </div>
            <LogoGrid home={home} />
            <div className="flex flex-col gap-4 border-t border-gray-6 pt-6">
              <div className="flex items-center gap-3">
                <span className="flex-1 text-base font-semibold">
                  {home.selected.name}
                </span>
                <FullStepsLink client={home.selected} />
              </div>
              <ConnectAction {...props} />
              <WaitingNote home={home} />
            </div>
          </>
        ) : (
          <>
            <span className="text-lg font-semibold tracking-tight">
              {t('Stay in control')}
            </span>
            <ControlLinks />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsAdding(true)}
            >
              <Plus />
              {t('Connect another client')}
            </Button>
          </>
        )}
      </div>
    </PageBand>
  );
}

function FirstVisitLead({ home }: { home: ConnectHome }) {
  const copy = headlineCopy(home.brandName);
  return (
    <>
      <div className="flex flex-col gap-5">
        <h1 className="max-w-[520px] text-4xl font-semibold leading-tight tracking-tight">
          {copy.title}
        </h1>
        <p className="max-w-[500px] text-lg text-gray-11">{copy.body}</p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
          <span>{t('Run actions in your apps')}</span>
          <span className="text-gray-9">/</span>
          <span>{t('Build and fix flows')}</span>
          <span className="text-gray-9">/</span>
          <span>{t('Query runs and tables')}</span>
        </div>
        <PieceStrip home={home} />
      </div>
      <p className="text-xs text-gray-11">
        {t('Signs in with OAuth, no API keys. Revoke any client in one click.')}
      </p>
    </>
  );
}

function ConnectedLead({ home }: { home: ConnectHome }) {
  const lead = home.latestGrant;
  const others = home.grants.filter((grant) => grant.id !== lead?.id);
  return (
    <>
      {lead && (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
          <GrantLogo grant={lead} className="size-14 rounded-xl" />
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            {t('{client} is connected.', { client: grantName(lead) })}
          </h1>
          <GrantStatus grant={lead} />
          {others.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {others.map((grant) => (
                <span
                  key={grant.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <GrantLogo grant={grant} className="size-6 rounded-md" />
                  {grantName(grant)}
                  <span className="text-gray-11">
                    {grant.lastUsedAt === null
                      ? t('waiting for first call')
                      : t('connected')}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="flex max-w-[640px] flex-col gap-2">
        <span className="text-sm font-medium text-gray-11">
          {t('Try asking')}
        </span>
        <PromptList home={home} />
      </div>
    </>
  );
}

function LogoGrid({ home }: { home: ConnectHome }) {
  return (
    <div role="tablist" className="grid grid-cols-5 gap-2">
      {home.clients.map((client) => {
        const isSelected = client.key === home.selected.key;
        return (
          <button
            key={client.key}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => home.select(client.key)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl px-0.5 py-2.5 transition-colors',
              isSelected
                ? 'bg-accent-3 ring-1 ring-accent-8'
                : 'hover:bg-gray-3',
            )}
          >
            <ClientLogo
              client={client}
              className={cn('transition-transform', isSelected && 'scale-105')}
            />
            <span
              className={cn(
                'line-clamp-2 w-full text-center text-xs leading-tight',
                isSelected ? 'font-medium text-gray-12' : 'text-gray-11',
              )}
            >
              {client.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type TakeProps = {
  home: ConnectHome;
  serverUrl: string;
  isReachableFromInternet: boolean;
};
