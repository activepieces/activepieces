import { t } from 'i18next';
import { ArrowRight } from 'lucide-react';
import { useMemo } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Button } from '@/components/ui/button';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';

import { useMcpNav } from '../mcp-nav';

import { ConnectCard } from './connect-card';
import { ConnectStage, WALL_SIZE } from './connect-stage';
import { ConnectHome } from './use-connect-home';

export function ConnectPage({
  home,
  serverUrl,
}: {
  home: ConnectHome;
  serverUrl: string;
}) {
  const { websiteName, logos } = flagsHooks.useWebsiteBranding();
  const { pieces } = piecesHooks.usePieces({});
  const nav = useMcpNav();
  const isConnected = home.grants.length > 0;
  const appLogos = useMemo(() => pickWallLogos(pieces ?? []), [pieces]);
  const brand = keepTogether(websiteName);
  const openClient = (key: string) => {
    home.startWatching();
    nav.showClient(key);
  };
  const showConnections = () => nav.showTab('connections');

  return (
    <div className="@container mx-auto flex w-full max-w-page-band flex-col gap-8 px-4 pb-16 pt-8">
      <header className="mx-auto flex max-w-[760px] flex-col items-center gap-2.5 text-center">
        <h1 className="text-balance text-3xl font-semibold tracking-tight">
          {isConnected
            ? t('Your AI is connected to {brand}', { brand })
            : t('Connect your AI to the tools you already use')}
        </h1>
        <p className="text-balance text-base text-gray-11">
          {isConnected
            ? t('Ask it to do something, or add another client.')
            : appsSubline({ total: pieces?.length ?? 0, brand })}
        </p>
        <div className="mt-1.5 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          <div className="w-full max-w-[380px]">
            <CopyToClipboardInput textToCopy={serverUrl} useInput />
          </div>
          {isConnected && (
            <Button variant="link" size="sm" onClick={showConnections}>
              {t('Manage connections')}
              <ArrowRight />
            </Button>
          )}
        </div>
      </header>

      {home.isGrantsError && (
        <ConnectCard
          title={t('Connected clients')}
          className="mx-auto w-full max-w-[720px]"
        >
          <DataFetchErrorState
            entity={t('connections')}
            onRetry={home.refetchGrants}
            className="py-4"
          />
        </ConnectCard>
      )}

      <ConnectStage
        clients={home.clients}
        grantsByClient={home.grantsByClient}
        hubLogo={logos.logoIconUrl}
        appLogos={appLogos}
        onOpenClient={openClient}
        onManage={showConnections}
      />

      {isConnected && <TryAsking />}
    </div>
  );
}

function TryAsking() {
  const prompts = [
    t('Read my Linear tickets and organize them into a roadmap.'),
    t('Update all my meetings for today.'),
    t('Summarize this week’s Salesforce deals that changed stage.'),
  ];
  return (
    <section className="mx-auto flex w-full max-w-[1144px] flex-col items-center gap-1.5">
      <h2 className="text-xs text-gray-11">{t('Try asking')}</h2>
      <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1.5">
        {prompts.map((prompt) => (
          <CopyButton
            key={prompt}
            textToCopy={prompt}
            variant="ghost"
            size="sm"
            className="h-auto max-w-full whitespace-normal py-1.5 text-left font-normal text-gray-12"
          >
            {prompt}
          </CopyButton>
        ))}
      </div>
    </section>
  );
}

function pickWallLogos(pieces: { name: string; logoUrl: string }[]): string[] {
  const logoByName = new Map(
    pieces.map((piece) => [
      piece.name.replace(PIECE_PREFIX, ''),
      piece.logoUrl,
    ]),
  );
  const listed = new Set([...WALL_FRONT, ...WALL_BACK]);
  const pick = (names: string[]) =>
    names.flatMap((name) => {
      const logo = logoByName.get(name);
      return logo ? [logo] : [];
    });
  const back = pick(WALL_BACK).slice(0, WALL_BACK_SLOTS);
  const others = [...logoByName.entries()]
    .filter(([name]) => !listed.has(name))
    .map(([, logo]) => logo);
  const front = [...pick(WALL_FRONT), ...others].slice(
    0,
    WALL_SIZE - back.length,
  );
  return [...new Set([...front, ...back])];
}

function appsSubline({ total, brand }: { total: number; brand: string }) {
  if (total === 0) {
    return t(
      'One sign-in links Claude, ChatGPT, Cursor and more to your apps, flows and tables in {brand}.',
      { brand },
    );
  }
  if (total < EXACT_COUNT_LIMIT) {
    return t(
      'One sign-in links Claude, ChatGPT, Cursor and more to {total, plural, =1 {1 app} other {# apps}}, plus your flows and tables in {brand}.',
      { total, brand },
    );
  }
  const step = total < 200 ? 10 : 100;
  return t(
    'One sign-in links Claude, ChatGPT, Cursor and more to {total}+ apps, plus your flows and tables in {brand}.',
    { total: (Math.floor(total / step) * step).toLocaleString(), brand },
  );
}

function keepTogether(text: string): string {
  return text.replace(/ /g, NO_BREAK_SPACE);
}

const NO_BREAK_SPACE = '\u00a0';
const EXACT_COUNT_LIMIT = 20;
const PIECE_PREFIX = '@activepieces/piece-';
const WALL_FRONT = [
  'slack',
  'microsoft-teams',
  'salesforce',
  'gmail',
  'microsoft-outlook',
  'google-drive',
  'hubspot',
  'jira-cloud',
  'linear',
  'notion',
  'github',
  'zendesk',
  'google-calendar',
  'asana',
  'confluence',
  'microsoft-excel-365',
  'google-sheets',
  'airtable',
  'stripe',
  'intercom',
  'freshdesk',
  'pipedrive',
  'microsoft-onedrive',
  'dropbox',
  'monday',
  'clickup',
  'shopify',
  'mailchimp',
  'calendly',
  'google-docs',
];
const WALL_BACK_SLOTS = 6;
const WALL_BACK = [
  'telegram-bot',
  'whatsapp',
  'discord',
  'trello',
  'youtube',
  'todoist',
  'typeform',
];
