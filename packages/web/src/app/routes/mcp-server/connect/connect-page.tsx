import { t } from 'i18next';
import { RotateCw } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { ReactNode, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import { CatalogClient } from '../mcp-client-catalog';
import { useMcpNav } from '../mcp-nav';
import { PageBand } from '../page-band';

import { ClientTile } from './client-tile';
import { LogoStack } from './logo-stack';
import { Prompt, PromptCard } from './prompt-card';
import { useConnectHome } from './use-connect-home';

export function ConnectPage({ clients }: { clients: CatalogClient[] }) {
  const home = useConnectHome({ clients });
  const nav = useMcpNav();
  const { pieces, isLoading } = piecesHooks.usePieces({
    skipProjectFilter: true,
  });
  const prompts = examplePrompts();
  const areImagesReady = usePreloadedImages([
    ...home.clients.map((client) => client.icon),
    ...[...HEADER_LOGOS, ...promptLogos(prompts)].map(appLogoUrl),
  ]);
  const hasWaitedEnough = useElapsed(READY_TIMEOUT_MS);
  const isReady = (!isLoading && areImagesReady) || hasWaitedEnough;
  const total = pieces?.length ?? 0;
  const prefersReducedMotion = useReducedMotion();
  const [hasPlayedBefore] = useState(() => hasPlayedEntrance);
  const animates = !hasPlayedBefore && !prefersReducedMotion;
  useEffect(() => {
    if (isReady) {
      hasPlayedEntrance = true;
    }
  }, [isReady]);

  return (
    <PageBand className="@container flex flex-col gap-10 pb-16 pt-8 @min-[960px]:pt-16">
      <Hero total={total} isReady={isReady} animates={animates} />

      <div className="grid gap-10 @min-[960px]:grid-cols-2 @min-[960px]:gap-12">
        <Enter
          isReady={isReady}
          animates={animates}
          delay={LEFT_DELAY}
          isFadeOnly
          className="@container flex flex-col gap-3"
        >
          <div className="flex min-h-5 flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <SectionTitle>{t('Pick your AI')}</SectionTitle>
            {home.isGrantsError && (
              <span className="flex items-center gap-1 text-sm text-gray-11">
                {t("Couldn't load your connections.")}
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto px-1"
                  onClick={() => home.refetchGrants()}
                >
                  <RotateCw />
                  {t('Retry')}
                </Button>
              </span>
            )}
          </div>
          <div className="grid gap-2.5 @min-[440px]:grid-cols-2">
            {home.clients.map((client) => (
              <ClientTile
                key={client.key}
                client={client}
                grants={home.grantsByClient.get(client.key)}
                onOpen={() => nav.showClient(client.key)}
              />
            ))}
          </div>
        </Enter>

        <Enter
          isReady={isReady}
          animates={animates}
          delay={RIGHT_DELAY}
          isFadeOnly
          className="flex flex-col gap-3"
        >
          <div className="flex h-5 items-center">
            <SectionTitle>{t('Try asking')}</SectionTitle>
          </div>
          <div className="flex flex-col gap-2.5">
            {prompts.map((prompt) => (
              <PromptCard key={prompt.text} prompt={prompt} />
            ))}
          </div>
        </Enter>
      </div>
    </PageBand>
  );
}

function Hero({
  total,
  isReady,
  animates,
}: {
  total: number;
  isReady: boolean;
  animates: boolean;
}) {
  const apps = appsLabel(total);
  return (
    <Enter isReady={isReady} animates={animates} delay={0}>
      <h1 className="text-balance text-2xl/10 font-medium tracking-tight @min-[800px]:text-pretty @min-[1000px]:text-3xl/11">
        <span>
          {t('Give your AI secure access to {apps}', { apps })}
          <span className="ml-2 inline-flex translate-y-[-2px] align-middle">
            <LogoStack
              logos={HEADER_LOGOS}
              size="lg"
              showMore
              reveal={
                animates ? { isVisible: isReady, delay: LOGO_DELAY } : undefined
              }
            />
          </span>
        </span>
        <br className="hidden @min-[800px]:block" />{' '}
        <span className="text-gray-11">
          {t('plus your flows and tables, with granular access control.')}
        </span>
      </h1>
    </Enter>
  );
}

function Enter({
  isReady,
  animates,
  delay,
  isFadeOnly = false,
  className,
  children,
}: {
  isReady: boolean;
  animates: boolean;
  delay: number;
  isFadeOnly?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const hidden = isFadeOnly ? FADED : RAISED;
  return (
    <motion.div
      className={className}
      initial={animates ? hidden : false}
      animate={isReady || !animates ? SHOWN : hidden}
      transition={{ ...ENTER, delay }}
    >
      {children}
    </motion.div>
  );
}

function useElapsed(ms: number): boolean {
  const [hasElapsed, setHasElapsed] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(() => setHasElapsed(true), ms);
    return () => clearTimeout(timeout);
  }, [ms]);
  return hasElapsed;
}

function usePreloadedImages(urls: string[]): boolean {
  const key = urls.join('|');
  const [readyKey, setReadyKey] = useState<string | null>(null);
  useEffect(() => {
    Promise.all(
      key.split('|').map((url) => {
        const image = new Image();
        image.src = url;
        return image.decode().catch(() => undefined);
      }),
    )
      .then(() => setReadyKey(key))
      .catch(() => setReadyKey(key));
  }, [key]);
  return readyKey === key;
}

function promptLogos(prompts: Prompt[]): string[] {
  return prompts.flatMap((prompt) =>
    Object.values(prompt.slots).flatMap((slot) =>
      slot.kind === 'apps' ? slot.logos : [],
    ),
  );
}

function appLogoUrl(slug: string): string {
  return `/app-logos/${slug}.svg`;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="whitespace-nowrap text-sm/5 font-medium text-gray-11">
      {children}
    </h2>
  );
}

function appsLabel(total: number): string {
  if (total === 0) {
    return t('Your apps');
  }
  if (total < EXACT_COUNT_LIMIT) {
    return t('{count, plural, =1 {# app} other {# apps}}', { count: total });
  }
  const step = total < 200 ? 10 : 50;
  return t('{apps}+ apps', {
    apps: (Math.floor(total / step) * step).toLocaleString(),
  });
}

function examplePrompts(): Prompt[] {
  return [
    {
      text: t(
        'What are customers complaining about most in my {support} this week, and what’s driving it?',
        { support: '{support}' },
      ),
      slots: {
        support: {
          kind: 'apps',
          label: t('support inbox'),
          logos: ['zendesk', 'intercom', 'gmail'],
        },
      },
    },
    {
      text: t(
        'Prep me for my next meeting using notes from my {crm} and the latest threads in my {inbox}',
        { crm: '{crm}', inbox: '{inbox}' },
      ),
      slots: {
        crm: {
          kind: 'apps',
          label: t('CRM'),
          logos: ['salesforce', 'hubspot'],
        },
        inbox: {
          kind: 'apps',
          label: t('inbox'),
          logos: ['gmail', 'slack'],
        },
      },
    },
    {
      text: t(
        'Find every customer who churned last month in my {billing} and add them to my {table}',
        { billing: '{billing}', table: '{table}' },
      ),
      slots: {
        billing: { kind: 'apps', label: t('billing'), logos: ['stripe'] },
        table: { kind: 'table', label: t('Churn table') },
      },
    },
  ];
}

let hasPlayedEntrance = false;

const ENTER = { duration: 0.3, ease: [0.22, 1, 0.36, 1] } as const;
const RAISED = { opacity: 0, y: 8 };
const FADED = { opacity: 0, y: 0 };
const SHOWN = { opacity: 1, y: 0 };
const LOGO_DELAY = 0.08;
const LEFT_DELAY = 0.12;
const RIGHT_DELAY = 0.18;
const READY_TIMEOUT_MS = 1200;
const EXACT_COUNT_LIMIT = 20;
const HEADER_LOGOS = ['slack', 'salesforce', 'google-drive', 'notion'];
