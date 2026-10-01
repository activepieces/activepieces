import { PersonalizationUseCase } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import {
  CSSProperties,
  ReactNode,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';

import { LogoPlate } from '@/components/custom/logo-plate';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { usePersonalization } from '@/features/chat/lib/use-personalization';
import { DEFAULT_USE_CASES } from '@/features/chat/use-cases/default-use-cases';
import {
  ResolvedUseCase,
  UseCaseCard,
} from '@/features/chat/use-cases/use-case-card';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { cn } from '@/lib/utils';

export function EmptyState({
  onSuggestionClick,
  incognito,
  hasInput,
}: {
  onSuggestionClick: (text: string) => void;
  incognito: boolean;
  showFlowCards: boolean;
  hasInput: boolean;
}) {
  const { data: currentUser } = userHooks.useCurrentUser();
  const firstName = currentUser?.firstName ?? '';
  const personalization = usePersonalization({ enabled: !incognito });
  const cards = useMemo(
    () => resolveCards({ researched: personalization.useCases }),
    [personalization.useCases],
  );

  if (incognito) {
    return (
      <div className="flex min-h-full flex-col justify-center px-4 pt-8 pb-6 md:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <Greeting firstName={firstName} incognito />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-4 pt-8 pb-6 md:px-6 md:pt-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
          <div className="min-w-0 sm:max-w-md sm:flex-1">
            <Greeting firstName={firstName} incognito={false} />
          </div>
          <div className="hidden sm:contents">
            <AppMarquee />
          </div>
        </div>
        <CollapseOnInput collapsed={hasInput}>
          <ExampleCards cards={cards} onSuggestionClick={onSuggestionClick} />
        </CollapseOnInput>
      </div>
    </div>
  );
}

function CollapseOnInput({
  collapsed,
  children,
}: {
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'grid transition-all duration-300',
        collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
      )}
    >
      <div className="min-h-0 overflow-y-clip">{children}</div>
    </div>
  );
}

export function SetupRequiredState() {
  const navigate = useNavigate();

  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Settings />
        </EmptyMedia>
        <EmptyTitle>{t('Set up an AI provider to get started')}</EmptyTitle>
        <EmptyDescription>
          {t(
            'AI Chat requires an AI provider. Add your provider in the AI settings to start chatting.',
          )}
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => navigate('/platform/ai')}>
          <Settings />
          {t('Go to AI settings')}
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function MessageSkeletons() {
  return (
    <div className="flex flex-col gap-8 py-4 animate-in fade-in duration-300">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48 rounded-xl" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

function Greeting({
  firstName,
  incognito,
}: {
  firstName: string;
  incognito: boolean;
}) {
  const headline = useMemo(
    () =>
      GREETING_HEADLINES[Math.floor(Math.random() * GREETING_HEADLINES.length)],
    [],
  );

  return (
    <motion.div
      className="flex flex-col items-start gap-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-semibold tracking-tight text-balance text-gray-12">
        {incognito
          ? t('Private chat')
          : firstName
          ? t(headline.withName, { name: firstName })
          : t(headline.plain)}
      </h1>
      {!incognito && (
        <p className="max-w-xl text-sm text-gray-11">
          {t(
            "I don't just answer questions — I do the work, end to end, across every app you use. Whatever you're picturing, I can probably go further.",
          )}
        </p>
      )}
    </motion.div>
  );
}

const AppMarquee = memo(function AppMarquee() {
  const { pieces, isLoading } = piecesHooks.usePieces({});
  const reducedMotion = useReducedMotion();

  const columns = useMemo(() => {
    const byName = new Map((pieces ?? []).map((piece) => [piece.name, piece]));
    const apps = FEATURED_APP_NAMES.map((name) => {
      const piece = byName.get(name);
      if (!piece?.logoUrl) {
        return undefined;
      }
      return {
        name: piece.name,
        displayName: piece.displayName,
        logoUrl: piece.logoUrl,
      };
    }).filter((app): app is ResolvedApp => app !== undefined);

    return [0, 1, 2].map((col) => apps.filter((_, i) => i % 3 === col));
  }, [pieces]);

  if (isLoading) {
    return (
      <div className="flex shrink-0 gap-3 self-center">
        {[0, 1, 2].map((col) => (
          <div key={col} className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="size-14 rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (columns.every((col) => col.length === 0)) {
    return null;
  }

  const moreCount = Math.max(
    100,
    Math.floor((pieces?.length ?? 0) / 100) * 100,
  );

  return (
    <div className="flex shrink-0 flex-col items-center gap-3 self-center">
      <div className="relative flex h-56 gap-3 overflow-hidden">
        {columns.map((col, i) => (
          <MarqueeColumn
            key={i}
            apps={col}
            reverse={i % 2 === 1}
            paused={!!reducedMotion}
          />
        ))}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-linear-to-b from-gray-1 to-gray-1/0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-linear-to-t from-gray-1 to-gray-1/0" />
      </div>
      <span className="text-sm font-medium text-gray-11">
        {t('{count}+ apps', { count: moreCount })}
      </span>
    </div>
  );
});

// Each tile is `size-14` (56px) tall with a `mb-3` (12px) gap, so one logo advances the
// strip by 68px. The strip is duplicated, so one full copy is `apps.length * 68px`. The loop
// must translate by exactly that distance: `translateY(-50%)` cannot be used because the
// column is a stretched flex item (its height is the 224px row, not its 800px+ content).
const TILE_ADVANCE_PX = 68;

const MarqueeColumn = memo(function MarqueeColumn({
  apps,
  reverse,
  paused,
}: {
  apps: ResolvedApp[];
  reverse: boolean;
  paused: boolean;
}) {
  const strip = [...apps, ...apps];

  return (
    <div
      className={cn(
        'flex flex-col',
        !paused &&
          (reverse
            ? 'animate-[slot-spin_linear_infinite_reverse]'
            : 'animate-[slot-spin_linear_infinite]'),
      )}
      style={
        paused
          ? undefined
          : ({
              '--marquee-loop': `${apps.length * TILE_ADVANCE_PX}px`,
              animationDuration: `${apps.length * 2200}ms`,
            } as CSSProperties)
      }
    >
      {strip.map((app, i) => (
        <LogoPlate
          key={`${app.name}-${i}`}
          src={app.logoUrl}
          alt={app.displayName}
          className="mb-3 size-14 rounded-xl p-2.5 shadow-sm ring-1 ring-gray-6/50"
        />
      ))}
    </div>
  );
});

function ExampleCards({
  cards,
  onSuggestionClick,
}: {
  cards: ResolvedUseCase[];
  onSuggestionClick: (text: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const reducedMotion = useReducedMotion();

  const handleToggle = () => setExpanded((value) => !value);

  return (
    <div className={cn('mt-8', expanded && 'pb-8')}>
      {expanded ? (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {cards.map((card) => (
            <UseCaseCard
              key={card.key}
              card={card}
              delay={0}
              onSelect={onSuggestionClick}
              className="h-full w-full"
            />
          ))}
        </motion.div>
      ) : (
        <CardCarousel>
          {cards.slice(0, COLLAPSED_CARD_COUNT).map((card, i) => (
            <UseCaseCard
              key={card.key}
              card={card}
              delay={0.15 + i * 0.08}
              onSelect={onSuggestionClick}
              className="min-w-[150px] flex-1 basis-0"
            />
          ))}
        </CardCarousel>
      )}

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={handleToggle}
          className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-gray-11 transition-colors hover:text-gray-12"
        >
          {expanded ? t('Show less') : t('More and bigger')}
          <ChevronDown
            className={cn(
              'size-4 transition-transform duration-300',
              expanded && 'rotate-180',
            )}
          />
        </button>
      </div>
    </div>
  );
}

function CardCarousel({ children }: { children: ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  const updateEdges = () => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const atStart = el.scrollLeft <= 1;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
    setEdges({ atStart, atEnd });
  };

  useEffect(() => {
    updateEdges();
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const observer = new ResizeObserver(updateEdges);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) {
        return;
      }
      const lineHeight = 16;
      const amount = e.deltaMode === 1 ? e.deltaY * lineHeight : e.deltaY;
      const scrollParent = findScrollableAncestor(el);
      if (scrollParent) {
        scrollParent.scrollTop += amount;
      } else {
        window.scrollBy(0, amount);
      }
      e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    el.scrollBy({
      left: direction * Math.round(el.clientWidth * 0.8),
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-gray-1 to-transparent transition-opacity duration-300',
          edges.atStart ? 'opacity-0' : 'opacity-100',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-gray-1 to-transparent transition-opacity duration-300',
          edges.atEnd ? 'opacity-0' : 'opacity-100',
        )}
      />
      {!edges.atStart && (
        <CarouselArrow direction="left" onClick={() => scrollByPage(-1)} />
      )}
      {!edges.atEnd && (
        <CarouselArrow direction="right" onClick={() => scrollByPage(1)} />
      )}
      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        className="flex snap-x gap-4 overflow-x-auto scroll-smooth pt-0.5 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

function findScrollableAncestor(el: HTMLElement): HTMLElement | null {
  let node = el.parentElement;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    const scrollable =
      (overflowY === 'auto' ||
        overflowY === 'scroll' ||
        overflowY === 'overlay') &&
      node.scrollHeight > node.clientHeight;
    if (scrollable) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function CarouselArrow({
  direction,
  onClick,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
}) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={direction === 'left' ? t('Scroll left') : t('Scroll right')}
      onClick={onClick}
      className={cn(
        'absolute top-1/2 z-30 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-7 bg-panel text-gray-12 shadow-over transition-colors hover:bg-gray-3',
        direction === 'left' ? 'left-2' : 'right-2',
      )}
    >
      <Icon className="size-4" />
    </button>
  );
}

const GREETING_HEADLINES: GreetingHeadline[] = [
  { withName: 'Dream big, {name}.', plain: 'Dream big.' },
  { withName: 'Think bigger, {name}.', plain: 'Think bigger.' },
  { withName: 'Aim higher, {name}.', plain: 'Aim higher.' },
  { withName: 'Reach further, {name}.', plain: 'Reach further.' },
  { withName: 'Go all in, {name}.', plain: 'Go all in.' },
  { withName: 'Push harder, {name}.', plain: 'Push harder.' },
  { withName: 'Expect more, {name}.', plain: 'Expect more.' },
  { withName: 'Raise the bar, {name}.', plain: 'Raise the bar.' },
  { withName: 'Go bolder, {name}.', plain: 'Go bolder.' },
  { withName: 'Be ambitious, {name}.', plain: 'Be ambitious.' },
];

const FEATURED_APP_NAMES = [
  '@activepieces/piece-gmail',
  '@activepieces/piece-slack',
  '@activepieces/piece-microsoft-outlook',
  '@activepieces/piece-notion',
  '@activepieces/piece-hubspot',
  '@activepieces/piece-salesforce',
  '@activepieces/piece-google-sheets',
  '@activepieces/piece-stripe',
  '@activepieces/piece-microsoft-teams',
  '@activepieces/piece-google-drive',
  '@activepieces/piece-shopify',
  '@activepieces/piece-zendesk',
  '@activepieces/piece-github',
  '@activepieces/piece-jira-cloud',
  '@activepieces/piece-airtable',
  '@activepieces/piece-openai',
];

type ResolvedApp = {
  name: string;
  displayName: string;
  logoUrl: string;
};

type GreetingHeadline = {
  withName: string;
  plain: string;
};

function resolveCards({
  researched,
}: {
  researched: PersonalizationUseCase[] | null;
}): ResolvedUseCase[] {
  if (researched && researched.length > 0) {
    return researched.map((card) => ({
      key: card.id,
      imageId: card.imageId,
      title: card.title,
      prompt: card.prompt,
      ...(card.kind ? { kind: card.kind } : {}),
    }));
  }
  return DEFAULT_USE_CASES.map((card) => ({
    key: card.id,
    imageId: card.id,
    title: card.title,
    prompt: card.prompt,
  }));
}

const COLLAPSED_CARD_COUNT = 4;
