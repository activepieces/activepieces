import { t } from 'i18next';
import { ArrowDown, Check } from 'lucide-react';
import { useRef } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { LogoPlate } from '@/components/custom/logo-plate';
import { PageSection } from '@/components/custom/page';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import { CatalogClient } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';
import { RecentlyConnected } from '../recently-connected';

import { ConnectBenefits } from './connect-benefits';
import { ConnectReach } from './connect-reach';

export function ConnectLanding({
  clients,
  serverUrl,
  brandName,
  scrollToClients,
}: {
  clients: CatalogClient[];
  serverUrl: string;
  brandName: string;
  scrollToClients: boolean;
}) {
  const clientsRef = useRef<HTMLDivElement>(null);
  const { pieces } = piecesHooks.usePieces({ skipProjectFilter: true });
  const pieceCount =
    (pieces?.length ?? 0) >= MIN_PIECES_TO_COUNT ? pieces?.length ?? 0 : 0;

  return (
    <>
      <ConnectHero
        clients={clients}
        serverUrl={serverUrl}
        brandName={brandName}
        pieceCount={pieceCount}
        onConnect={() =>
          clientsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        }
      />
      <RecentlyConnected />
      <div
        ref={(element) => {
          clientsRef.current = element;
          if (scrollToClients) {
            element?.scrollIntoView({ block: 'start' });
          }
        }}
        className="scroll-mt-4"
      >
        <PageSection
          title={t('Connect a client')}
          description={t(
            'Pick the app you use AI in for step-by-step setup. It takes about a minute.',
          )}
        >
          <ClientGrid clients={clients} />
        </PageSection>
      </div>
      <ConnectBenefits brandName={brandName} pieceCount={pieceCount} />
      <ConnectReach />
    </>
  );
}

function ConnectHero({
  clients,
  serverUrl,
  brandName,
  pieceCount,
  onConnect,
}: {
  clients: CatalogClient[];
  serverUrl: string;
  brandName: string;
  pieceCount: number;
  onConnect: () => void;
}) {
  const nav = useMcpNav();
  const featured = HERO_CLIENT_KEYS.flatMap(
    (key) => clients.find((client) => client.key === key) ?? [],
  );

  return (
    <Card className="flex-col gap-6 border border-accent-6 bg-accent-2 p-6 shadow-none lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight text-gray-12">
            {t('Let your AI do the work, not just talk about it.')}
          </h2>
          <p className="max-w-2xl text-sm text-gray-11">
            {pieceCount > 0
              ? t(
                  'Connect Claude, ChatGPT, Cursor or any MCP client to {brand}. It can then build and run your flows and take actions in {count} apps, with your connections and your permissions.',
                  { brand: brandName, count: pieceCount },
                )
              : t(
                  'Connect Claude, ChatGPT, Cursor or any MCP client to {brand}. It can then build and run your flows and take actions in your apps, with your connections and your permissions.',
                  { brand: brandName },
                )}
          </p>
        </div>
        <div className="flex max-w-2xl flex-col gap-2">
          <span className="text-xs font-medium text-gray-11">
            {t('Your server URL')}
          </span>
          <div className="flex min-w-0 items-center gap-2 rounded-xl border bg-panel py-1 pr-1 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-gray-12">
              {serverUrl}
            </span>
            <CopyButton
              textToCopy={serverUrl}
              size="sm"
              variant="ghost"
              className="shrink-0"
            >
              {t('Copy')}
            </CopyButton>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button onClick={onConnect}>
            {t('Connect a client')}
            <ArrowDown />
          </Button>
          <TrustPoint text={t('Sign in with OAuth, no API keys')} />
          <TrustPoint text={t('Revoke any client in one click')} />
        </div>
      </div>
      <div className="hidden shrink-0 grid-cols-3 gap-2 lg:grid">
        {featured.map((client) => (
          <button
            key={client.key}
            type="button"
            title={client.name}
            aria-label={t('Connect {client}', { client: client.name })}
            onClick={() => nav.showClient(client.key)}
            className="rounded-xl outline-hidden transition-shadow hover:ring-2 hover:ring-accent-7 focus-visible:ring-3 focus-visible:ring-accent-8/50"
          >
            <LogoPlate
              src={client.icon}
              alt=""
              size="xxl"
              border
              className="rounded-xl"
            />
          </button>
        ))}
      </div>
    </Card>
  );
}

function ClientGrid({ clients }: { clients: CatalogClient[] }) {
  const nav = useMcpNav();
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {clients.map((client) => (
        <button
          key={client.key}
          type="button"
          onClick={() => nav.showClient(client.key)}
          className="flex min-w-0 items-center gap-3 rounded-xl border bg-panel px-3 py-2.5 text-left outline-hidden transition-colors hover:bg-gray-2 focus-visible:ring-3 focus-visible:ring-accent-8/50"
        >
          <LogoPlate
            src={client.icon}
            alt=""
            size="md"
            border
            className="rounded-lg"
          />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-gray-12">
              {client.name}
            </span>
            <span className="truncate text-xs text-gray-11">{client.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function TrustPoint({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-11">
      <Check className="size-3.5 text-success-11" />
      {text}
    </span>
  );
}

const MIN_PIECES_TO_COUNT = 10;
const HERO_CLIENT_KEYS = [
  'claude',
  'chatgpt',
  'cursor',
  'vscode',
  'gemini-cli',
  'codex',
];
