import { t } from 'i18next';
import { useMemo } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';

import { useMcpNav } from '../mcp-nav';

import { ConnectCard } from './connect-card';
import { ConnectStage, WALL_SIZE } from './connect-stage';
import { ConnectHome } from './use-connect-home';

export function ConnectPage({ home }: { home: ConnectHome }) {
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
    <div className="@container mx-auto flex w-full max-w-page-band flex-col gap-10 px-4 pb-16 pt-10">
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
    t('Which of my flows failed this week, and why?'),
    t('List my tables and summarize the newest rows.'),
    t('Build a flow that posts new form leads to Slack.'),
  ];
  return (
    <section className="mx-auto flex w-full max-w-[1144px] flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
      <h2 className="pr-1 text-sm text-gray-11">{t('Try asking')}</h2>
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
    </section>
  );
}

function pickWallLogos(pieces: { name: string; logoUrl: string }[]): string[] {
  const rank = (name: string) => {
    const index = POPULAR_PIECES.indexOf(name.replace(PIECE_PREFIX, ''));
    return index === -1 ? POPULAR_PIECES.length : index;
  };
  const logos = [...pieces]
    .sort((a, b) => rank(a.name) - rank(b.name))
    .map((piece) => piece.logoUrl);
  return [...new Set(logos)].slice(0, WALL_SIZE);
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
const POPULAR_PIECES = [
  'slack',
  'gmail',
  'google-sheets',
  'notion',
  'github',
  'hubspot',
  'google-drive',
  'airtable',
  'stripe',
  'salesforce',
  'google-calendar',
  'discord',
  'trello',
  'asana',
  'shopify',
  'linear',
  'jira-cloud',
  'microsoft-teams',
  'telegram-bot',
  'whatsapp',
  'dropbox',
  'mailchimp',
  'zendesk',
  'intercom',
  'monday',
  'clickup',
  'todoist',
  'google-docs',
  'youtube',
  'linkedin',
  'openai',
  'outlook',
  'calendly',
  'typeform',
  'pipedrive',
];
