import { t } from 'i18next';
import { Check, ChevronRight } from 'lucide-react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';

import { CatalogClient, POPULAR_CLIENT_KEYS } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';
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
    <div className="flex flex-1 flex-col bg-background">
      <PageBand className="flex flex-col gap-16 py-12 lg:flex-row lg:px-14">
        <div className="flex max-w-[628px] flex-1 flex-col gap-5">
          <h1 className="max-w-[455px] text-4xl font-bold leading-tight tracking-tight">
            {t('One link for everywhere you use AI.')}
          </h1>
          <p className="max-w-[500px] text-base leading-relaxed text-muted-foreground">
            {t(
              'Your AI stops guessing and starts doing — sending the Slack message, updating the CRM, running the flow. Paste it into any client that speaks MCP.',
            )}
          </p>
          <div className="mt-1 flex items-center gap-3.5 rounded-md border bg-muted/40 py-2.5 pl-5 pr-2.5">
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
          <div className="flex flex-wrap items-center gap-5 pt-0.5">
            <TrustPoint text={t('No API keys to manage')} />
            <TrustPoint text={t('Revoke any client in one click')} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-[396px]">
          <span className="px-0.5 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('Need the exact steps?')}
          </span>
          {popular.map((client, index) => (
            <ClientCard
              key={client.key}
              client={client}
              highlighted={index === 0}
              onClick={() => nav.showClient(client.key)}
            />
          ))}
          <button
            type="button"
            onClick={nav.showBrowse}
            className="mt-0.5 flex items-center justify-center gap-2 rounded-md bg-muted py-3 text-sm font-semibold transition-colors hover:bg-muted/70"
          >
            {t('See all {total} clients', { total: clients.length })}
            <ChevronRight className="size-4" />
          </button>
        </div>
      </PageBand>

      <PiecesShowcase />
      <RecentlyConnected />
    </div>
  );
}

function TrustPoint({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Check className="size-3.5 text-success-600" />
      {text}
    </span>
  );
}
