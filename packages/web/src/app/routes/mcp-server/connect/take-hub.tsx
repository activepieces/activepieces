import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { PageBand } from '../page-band';

import {
  ClientLogo,
  ConnectAction,
  ControlLinks,
  FullStepsLink,
  GrantStatus,
  PromptList,
  WaitingNote,
  grantName,
  headlineCopy,
} from './connect-kit';
import { ConnectHome } from './use-connect-home';

export function TakeHub(props: TakeProps) {
  const { home } = props;
  const [isAdding, setIsAdding] = useState(false);
  const isSelectedConnected = home.connectedKeys.has(home.selected.key);
  const showConnect = !home.isConnected || isAdding;
  const copy = headlineCopy(home.brandName);
  const lead = home.latestGrant;

  return (
    <PageBand className="grid grid-cols-1 items-start gap-16 py-14 lg:grid-cols-[1fr_420px]">
      <div className="flex min-w-0 flex-col gap-8">
        {home.isConnected && lead ? (
          <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              {t('{client} is connected.', { client: grantName(lead) })}
            </h1>
            <GrantStatus grant={lead} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              {copy.title}
            </h1>
            <p className="max-w-[540px] text-base text-gray-11">{copy.body}</p>
          </div>
        )}
        <HubDiagram
          home={home}
          onSelect={(key) => {
            home.select(key);
            if (home.isConnected && !home.connectedKeys.has(key)) {
              setIsAdding(true);
            }
          }}
        />
        {home.isConnected && (
          <div className="flex max-w-[600px] flex-col gap-1">
            <span className="text-sm font-medium text-gray-11">
              {t('Try asking')}
            </span>
            <PromptList home={home} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 rounded-xl border bg-panel p-6 shadow-sm">
        {showConnect && !isSelectedConnected ? (
          <>
            <div className="flex items-center gap-3">
              <ClientLogo
                client={home.selected}
                className="size-12 rounded-xl"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-xl font-semibold tracking-tight">
                  {t('Connect {client}', { client: home.selected.name })}
                </span>
                <span className="text-xs text-gray-11">
                  {home.selected.subtitle}
                </span>
              </div>
              <FullStepsLink client={home.selected} />
            </div>
            <ConnectAction {...props} />
            <WaitingNote home={home} />
            {!home.isConnected && (
              <p className="border-t border-gray-6 pt-4 text-xs text-gray-11">
                {t('Using something else? Pick it on the left.')}
              </p>
            )}
            {isAdding && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => setIsAdding(false)}
              >
                {t('Back')}
              </Button>
            )}
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

function HubDiagram({
  home,
  onSelect,
}: {
  home: ConnectHome;
  onSelect: (key: string) => void;
}) {
  const clientSlots = home.clients.map((client, index) => ({
    client,
    x: (index % 2) * (TILE + GAP),
    y: Math.floor(index / 2) * (TILE + GAP),
  }));
  const clientRows = Math.ceil(home.clients.length / 2);
  const height = clientRows * (TILE + GAP) - GAP;
  const hubY = height / 2;
  const pieceCount = home.pieceLogos.length;
  const pieceRows = Math.ceil(pieceCount / 2);
  const pieceTop = hubY - (pieceRows * (TILE + GAP) - GAP) / 2;
  const pieceSlots = home.pieceLogos.map((piece, index) => ({
    piece,
    x: WIDTH - 2 * TILE - GAP + (index % 2) * (TILE + GAP),
    y: pieceTop + Math.floor(index / 2) * (TILE + GAP),
  }));
  const hubX = WIDTH / 2;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative" style={{ width: WIDTH, height }}>
        <svg
          className="absolute inset-0"
          width={WIDTH}
          height={height}
          aria-hidden
        >
          {clientSlots.map(({ client, x, y }) => {
            const isSelected = client.key === home.selected.key;
            const isConnected = home.connectedKeys.has(client.key);
            return (
              <path
                key={client.key}
                d={curve({
                  fromX: x + TILE,
                  fromY: y + TILE / 2,
                  toX: hubX - HUB / 2,
                  toY: hubY,
                })}
                fill="none"
                strokeWidth={isSelected || isConnected ? 2 : 1}
                strokeDasharray={isSelected && !isConnected ? '4 4' : undefined}
                className={cn(
                  'transition-colors',
                  isConnected
                    ? 'stroke-success-10'
                    : isSelected
                    ? 'stroke-accent-9'
                    : 'stroke-gray-6',
                )}
              >
                {isSelected && !isConnected && !prefersReducedMotion() && (
                  <animate
                    attributeName="stroke-dashoffset"
                    from="8"
                    to="0"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                )}
              </path>
            );
          })}
          {pieceSlots.map(({ piece, x, y }) => (
            <path
              key={piece.name}
              d={curve({
                fromX: hubX + HUB / 2,
                fromY: hubY,
                toX: x,
                toY: y + TILE / 2,
              })}
              fill="none"
              strokeWidth={1}
              className={
                home.isConnected ? 'stroke-success-10' : 'stroke-gray-7'
              }
            />
          ))}
        </svg>

        {clientSlots.map(({ client, x, y }) => {
          const isSelected = client.key === home.selected.key;
          const isConnected = home.connectedKeys.has(client.key);
          return (
            <Tooltip key={client.key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={client.name}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(client.key)}
                  style={{ left: x, top: y }}
                  className={cn(
                    'absolute flex size-11 items-center justify-center rounded-xl transition-all',
                    isSelected
                      ? 'ring-2 ring-accent-8'
                      : isConnected
                      ? 'ring-2 ring-success-8'
                      : 'opacity-70 hover:opacity-100',
                  )}
                >
                  <ClientLogo client={client} className="size-11 rounded-xl" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">{client.name}</TooltipContent>
            </Tooltip>
          );
        })}

        <div
          style={{ left: hubX - HUB / 2, top: hubY - HUB / 2 }}
          className="absolute flex size-18 items-center justify-center rounded-2xl bg-panel shadow-lg ring-1 ring-gray-6"
        >
          <img
            src={home.brandIconUrl}
            alt={home.brandName}
            className="size-9"
          />
        </div>

        {pieceSlots.map(({ piece, x, y }) => (
          <div
            key={piece.name}
            className="absolute"
            style={{ left: x, top: y }}
          >
            <LogoPlate
              src={piece.logoUrl}
              alt={piece.name}
              title={piece.name}
              border
              className="size-11 rounded-xl p-2.5"
            />
          </div>
        ))}
      </div>
      <div className="flex text-xs text-gray-11" style={{ width: WIDTH }}>
        <span className="flex-1">{t('Your AI')}</span>
        <span className="flex-1 text-center">{home.brandName}</span>
        <span className="flex-1 text-right">
          {t('{count, plural, =1 {1 app} other {# apps}}', {
            count: home.pieceCount,
          })}
        </span>
      </div>
    </div>
  );
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function curve({
  fromX,
  fromY,
  toX,
  toY,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}): string {
  const midX = (fromX + toX) / 2;
  return `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
}

const WIDTH = 560;
const TILE = 44;
const GAP = 12;
const HUB = 72;

type TakeProps = {
  home: ConnectHome;
  serverUrl: string;
  isReachableFromInternet: boolean;
};
