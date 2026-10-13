import { McpOAuthGrant } from '@activepieces/shared';
import { t } from 'i18next';
import { Check, Link2, Plus } from 'lucide-react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { cn } from '@/lib/utils';

import { ClientIcon } from '../client-icon';
import { CatalogClient, ClientKind } from '../mcp-client-catalog';

import { connectStatus } from './connect-status';

export function ConnectStage({
  clients,
  grantsByClient,
  hubLogo,
  appLogos,
  onOpenClient,
  onManage,
}: {
  clients: CatalogClient[];
  grantsByClient: Map<string, McpOAuthGrant[]>;
  hubLogo: string;
  appLogos: string[];
  onOpenClient: (key: string) => void;
  onManage: () => void;
}) {
  const isRowLive = toRows(clients).map((row) =>
    row.some((client) => grantsByClient.has(client.key)),
  );
  return (
    <div className="flex w-full items-start justify-center">
      <ul className="grid w-full max-w-[720px] grid-cols-1 gap-2 sm:grid-cols-2 @min-[1144px]:w-113 @min-[1144px]:shrink-0">
        {clients.map((client) => (
          <ClientTile
            key={client.key}
            client={client}
            grants={grantsByClient.get(client.key)}
            onOpen={() => onOpenClient(client.key)}
            onManage={onManage}
          />
        ))}
      </ul>
      <div
        aria-hidden
        className="hidden items-center @min-[1144px]:flex"
        style={{ height: stageHeight(isRowLive.length) }}
      >
        <Wires
          rows={isRowLive.length}
          wires={isRowLive.map((isLive, index) => ({
            y: rowCenter(index),
            isLive,
          }))}
          direction="in"
        />
        <Hub logo={hubLogo} />
        <Wires
          rows={isRowLive.length}
          wires={isRowLive.map((_, index) => ({
            y: rowCenter(index),
            isLive: false,
          }))}
          direction="out"
        />
        <AppWall logos={appLogos} rows={isRowLive.length} />
      </div>
    </div>
  );
}

function ClientTile({
  client,
  grants,
  onOpen,
  onManage,
}: {
  client: CatalogClient;
  grants: McpOAuthGrant[] | undefined;
  onOpen: () => void;
  onManage: () => void;
}) {
  const isOther = client.kind === 'other';
  const name = client.name;
  return (
    <li
      className={cn(
        'group relative flex h-16 items-center gap-2 rounded-2xl pl-3 pr-2.5 transition-colors',
        isOther
          ? 'bg-gray-12 text-gray-1'
          : 'border bg-panel shadow-xs hover:border-gray-7',
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={t('Set up {client}', { client: name })}
        className="absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-9"
      />
      {isOther ? (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-1/12">
          <Link2 className="size-4.5" />
        </span>
      ) : (
        <ClientIcon icon={client.icon} className="size-10 rounded-xl" />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm font-semibold">{name}</span>
        <span
          className={cn(
            'truncate text-xs',
            isOther ? 'text-gray-1/65' : 'text-gray-11',
          )}
        >
          {grants ? connectStatus.label(grants) : clientKind(client.kind)}
        </span>
      </span>
      {grants ? (
        <button
          type="button"
          onClick={onManage}
          aria-label={t('Manage {client}', { client: name })}
          className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-success-3 text-success-11 transition-colors hover:bg-success-4"
        >
          <Check className="size-3.5" strokeWidth={2.6} />
        </button>
      ) : (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
            isOther
              ? 'bg-gray-1/12 group-hover:bg-gray-1/20'
              : 'bg-gray-3 text-gray-11 group-hover:bg-gray-4 group-hover:text-gray-12',
          )}
        >
          <Plus className="size-3.5" strokeWidth={2.4} />
        </span>
      )}
    </li>
  );
}

function Wires({
  rows,
  wires,
  direction,
}: {
  rows: number;
  wires: { y: number; isLive: boolean }[];
  direction: 'in' | 'out';
}) {
  return (
    <svg
      width={WIRE_WIDTH}
      height={stageHeight(rows)}
      className="shrink-0 overflow-visible"
    >
      {wires.map(({ y, isLive }, index) => {
        const path = wirePath({ y, hubY: stageHeight(rows) / 2, direction });
        const pulse = isLive ? LIVE_PULSE : IDLE_PULSE;
        return (
          <g key={y}>
            <path
              d={path}
              fill="none"
              strokeWidth={1.5}
              className={wireClass({ isLive, direction })}
            />
            <path
              d={path}
              fill="none"
              pathLength={WIRE_LENGTH}
              strokeLinecap="round"
              strokeWidth={pulse.width}
              strokeDasharray={`${pulse.length} ${PULSE_CYCLE - pulse.length}`}
              strokeDashoffset={pulse.length}
              className={cn(
                'motion-reduce:hidden',
                isLive ? 'stroke-accent-9' : 'stroke-accent-7',
              )}
            >
              <animate
                attributeName="stroke-dashoffset"
                values={`${pulse.length};${pulse.length - PULSE_CYCLE}`}
                dur={pulse.duration}
                begin={`${pulseDelay({ index, direction, isLive })}s`}
                repeatCount="indefinite"
              />
            </path>
          </g>
        );
      })}
    </svg>
  );
}

function Hub({ logo }: { logo: string }) {
  return (
    <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl border border-accent-5 bg-panel shadow-xs">
      <img src={logo} alt="" className="size-9 object-contain" />
    </div>
  );
}

function AppWall({ logos, rows }: { logos: string[]; rows: number }) {
  return (
    <div className="flex h-full w-113 shrink-0 flex-col gap-2">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex h-16 items-center justify-between">
          {Array.from({ length: WALL_COLUMNS }, (_, column) => {
            const logo = logos[row * WALL_COLUMNS + column];
            return (
              <span
                key={column}
                className="size-10 shrink-0"
                style={{ opacity: WALL_FADE[column] }}
              >
                {logo && (
                  <LogoPlate
                    src={logo}
                    alt=""
                    border
                    className="size-10 rounded-lg"
                    innerClassName="size-5.5 p-0"
                  />
                )}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function wirePath({
  y,
  hubY,
  direction,
}: {
  y: number;
  hubY: number;
  direction: 'in' | 'out';
}): string {
  const near = WIRE_WIDTH * 0.55;
  const far = WIRE_WIDTH * 0.45;
  return direction === 'in'
    ? `M0,${y} C${near},${y} ${far},${hubY} ${WIRE_WIDTH},${hubY}`
    : `M0,${hubY} C${near},${hubY} ${far},${y} ${WIRE_WIDTH},${y}`;
}

function wireClass({
  isLive,
  direction,
}: {
  isLive: boolean;
  direction: 'in' | 'out';
}): string {
  return isLive && direction === 'in' ? 'stroke-accent-5' : 'stroke-gray-6';
}

function pulseDelay({
  index,
  direction,
  isLive,
}: {
  index: number;
  direction: 'in' | 'out';
  isLive: boolean;
}): number {
  if (isLive) {
    return index * 0.3;
  }
  const stagger = WIRE_STAGGER[index % WIRE_STAGGER.length];
  return direction === 'in' ? stagger : stagger + OUT_PULSE_OFFSET;
}

function toRows(clients: CatalogClient[]): CatalogClient[][] {
  return Array.from({ length: Math.ceil(clients.length / 2) }, (_, row) =>
    clients.slice(row * 2, row * 2 + 2),
  );
}

function stageHeight(rows: number): number {
  return rows * TILE_HEIGHT + (rows - 1) * TILE_GAP;
}

function rowCenter(index: number): number {
  return TILE_HEIGHT / 2 + index * (TILE_HEIGHT + TILE_GAP);
}

function clientKind(kind: ClientKind): string {
  switch (kind) {
    case 'chat':
      return t('Chat app');
    case 'agent':
      return t('Coding agent');
    case 'editor':
      return t('Code editor');
    case 'other':
      return t('URL or JSON');
  }
}

const TILE_HEIGHT = 64;
const TILE_GAP = 8;
const MAX_WALL_ROWS = 6;
const WIRE_WIDTH = 80;
const WALL_COLUMNS = 6;
const WALL_FADE = [0.85, 0.65, 0.48, 0.34, 0.22, 0.12];
const WIRE_LENGTH = 100;
const PULSE_CYCLE = 200;
const LIVE_PULSE = { length: 16, width: 2.5, duration: '3.6s' };
const IDLE_PULSE = { length: 12, width: 2, duration: '6s' };
const WIRE_STAGGER = [0, 2.4, 1.2, 3.6, 4.8];
const OUT_PULSE_OFFSET = 1.8;

export const WALL_SIZE = MAX_WALL_ROWS * WALL_COLUMNS;
