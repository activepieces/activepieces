import { t } from 'i18next';
import { Check, ChevronRight } from 'lucide-react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { Panel } from '@/components/custom/panel';
import { Button } from '@/components/ui/button';

import { CatalogClient, POPULAR_CLIENT_KEYS } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';
import { PiecesShowcase } from '../pieces-showcase';
import { RecentlyConnected } from '../recently-connected';

import { ClientCard } from './client-card';

export function ConnectLanding({
  clients,
  serverUrl,
}: {
  clients: CatalogClient[];
  serverUrl: string;
}) {
  const nav = useMcpNav();
  const popular = POPULAR_CLIENT_KEYS.map((key) =>
    clients.find((client) => client.key === key),
  ).filter((client): client is CatalogClient => client !== undefined);

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          title={t('One link for everywhere you use AI.')}
          description={t(
            'Your AI stops guessing and starts doing — sending the Slack message, updating the CRM, running the flow. Paste it into any client that speaks MCP.',
          )}
        >
          <div className="flex items-center gap-2 rounded-xl border bg-gray-2 py-1 pr-1 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-sm">
              {serverUrl}
            </span>
            <CopyButton
              textToCopy={serverUrl}
              variant="default"
              className="shrink-0"
            >
              {t('Copy link')}
            </CopyButton>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <TrustPoint text={t('No API keys to manage')} />
            <TrustPoint text={t('Revoke any client in one click')} />
          </div>
        </Panel>

        <Panel title={t('Need the exact steps?')}>
          <div className="flex flex-col gap-2">
            {popular.map((client, index) => (
              <ClientCard
                key={client.key}
                client={client}
                highlighted={index === 0}
                onClick={() => nav.showClient(client.key)}
              />
            ))}
            <Button variant="secondary" onClick={nav.showBrowse}>
              {t('See all {total} clients', { total: clients.length })}
              <ChevronRight />
            </Button>
          </div>
        </Panel>
      </div>

      <PiecesShowcase />
      <RecentlyConnected />
    </>
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
