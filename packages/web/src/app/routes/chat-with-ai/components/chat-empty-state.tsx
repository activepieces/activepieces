import { t } from 'i18next';
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
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

import { useStageOptional } from '@/app/components/workspace-shell/stage-context';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
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
  const branding = flagsHooks.useWebsiteBranding();
  const stage = useStageOptional();
  const reducedMotion = useReducedMotion();

  const cards = EXAMPLE_CARDS.map(resolveDefaultCard);

  if (incognito) {
    return (
      <div className="flex min-h-full flex-col justify-center pt-8 pb-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full">
          <Greeting firstName={firstName} incognito />
        </div>
      </div>
    );
  }

  // When the chat is the secondary panel (Stage open), the empty state stays
  // quiet: no headline, no marquee, no use-case cards. Just the product mark and
  // one subtle line that step out of the way the moment the user starts typing.
  if (stage?.isStageOpen) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-4 sm:px-6 py-10 text-center">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={cn(
            'flex flex-col items-center gap-2.5 transition-opacity duration-300',
            hasInput && 'opacity-0',
          )}
        >
          <img
            src={branding.logos.logoIconUrl}
            alt=""
            aria-hidden
            className="size-5 object-contain opacity-30 brightness-0 dark:invert"
          />
          <p className="max-w-[13rem] text-sm text-muted-foreground">
            {t("Tell me what you need. I'll handle the rest.")}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className="flex min-h-full flex-col pt-12 sm:pt-16 pb-6"
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-8 sm:gap-10">
          <div className="min-w-0 sm:flex-1 sm:max-w-md">
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
    </motion.div>
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
        'grid transition-all duration-300 ease-out',
        collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100',
      )}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

export function SetupRequiredState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-20 flex-1 min-w-0">
      <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted">
        <Settings className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          {t('Set up an AI provider to get started')}
        </h2>
        <p className="text-muted-foreground text-sm max-w-md">
          {t(
            'AI Chat requires an AI provider. Add your provider in the AI settings to start chatting.',
          )}
        </p>
      </div>
      <Button onClick={() => navigate('/platform/setup/ai')} className="gap-2">
        <Settings className="h-4 w-4" />
        {t('Go to AI Settings')}
      </Button>
    </div>
  );
}

export function MessageSkeletons() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 py-4">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-48 rounded-2xl" />
      </div>
      <div className="space-y-2">
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
      className="flex flex-col items-start gap-3.5"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] text-balance font-sentient">
        {incognito
          ? t('Private Chat')
          : firstName
          ? t(headline.withName, { name: firstName })
          : t(headline.plain)}
      </h1>
      {!incognito && (
        <p className="text-base text-muted-foreground max-w-xl">
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
              <Skeleton key={i} className="size-14 rounded-2xl" />
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
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-linear-to-b from-background to-background/0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-linear-to-t from-background to-background/0" />
      </div>
      <span className="text-xs font-medium text-muted-foreground">
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
        <div
          key={`${app.name}-${i}`}
          className="size-14 shrink-0 overflow-hidden rounded-2xl bg-background shadow-sm ring-1 ring-border/50 mb-3"
        >
          <img
            src={app.logoUrl}
            alt={app.displayName}
            className="w-full h-full rounded-2xl object-contain p-2.5"
          />
        </div>
      ))}
    </div>
  );
});

function ExampleCards({
  cards,
  onSuggestionClick,
}: {
  cards: ResolvedCard[];
  onSuggestionClick: (text: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const reducedMotion = useReducedMotion();

  const handleToggle = () => setExpanded((value) => !value);

  const carouselCards = cards;
  const expandedCards = ALL_EXAMPLE_CARDS.map(resolveDefaultCard);

  return (
    <div className="mt-16">
      {expanded ? (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-6"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {expandedCards.map((card, i) => (
            <ExampleCard
              key={card.key}
              card={card}
              delay={0}
              animateIn={false}
              onSuggestionClick={onSuggestionClick}
              largeText={i < 2}
              className={i < 2 ? 'sm:col-span-3' : 'sm:col-span-2'}
            />
          ))}
        </motion.div>
      ) : (
        <CardCarousel>
          {carouselCards.map((card, i) => (
            <ExampleCard
              key={card.key}
              card={card}
              delay={0.15 + i * 0.08}
              onSuggestionClick={onSuggestionClick}
              large
            />
          ))}
        </CardCarousel>
      )}

      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
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
          'pointer-events-none absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-background to-transparent transition-opacity duration-300',
          edges.atStart ? 'opacity-0' : 'opacity-100',
        )}
      />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-background to-transparent transition-opacity duration-300',
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
        className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
        'absolute top-1/2 z-30 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-md backdrop-blur transition-colors hover:bg-background',
        direction === 'left' ? 'left-2' : 'right-2',
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

function ExampleCard({
  card,
  delay,
  onSuggestionClick,
  large = false,
  largeText = false,
  animateIn = true,
  className,
}: {
  card: ResolvedCard;
  delay: number;
  onSuggestionClick: (text: string) => void;
  large?: boolean;
  largeText?: boolean;
  animateIn?: boolean;
  className?: string;
}) {
  const emphasized = large || largeText;
  const [imgError, setImgError] = useState(false);

  return (
    // One springy entrance + a light hover lift, no exit/layout/blur
    // animation: the journey→cards hand-off is a single parent-level
    // crossfade — per-card morphs stacked on top of it caused visible flicker
    // inside the snap-scroll carousel.
    <motion.button
      type="button"
      className={cn(
        'group relative flex aspect-video cursor-pointer overflow-hidden rounded-xl text-left ring-1 ring-border/60',
        large
          ? 'w-[78vw] max-w-[360px] shrink-0 snap-start sm:w-[360px]'
          : 'w-full',
        imgError && 'bg-neutral-900',
        className,
      )}
      onClick={() => onSuggestionClick(card.prompt)}
      initial={animateIn ? { opacity: 0, y: 14 } : false}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26, delay }}
    >
      {!imgError && (
        <img
          src={card.imageSrc}
          alt=""
          aria-hidden
          loading="lazy"
          onError={() => setImgError(true)}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
      />
      <div
        className={cn(
          'relative z-10 flex h-full w-full items-end justify-start',
          emphasized ? 'p-5' : 'p-4',
        )}
      >
        <h3
          className={cn(
            'font-bold leading-tight text-white [text-shadow:_0_1px_12px_rgb(0_0_0_/_60%)]',
            emphasized ? 'text-2xl sm:text-3xl' : 'text-lg',
          )}
        >
          {card.title}
        </h3>
      </div>
      <ArrowUpRight className="absolute right-3 top-3 z-10 size-4 text-white/0 transition-colors duration-300 group-hover:text-white/90" />
    </motion.button>
  );
}

// Absolute forms only — comparatives ("think bigGER", "aim highER") read as
// telling the user they aren't doing enough.
const GREETING_HEADLINES: GreetingHeadline[] = [
  { withName: 'Dream big, {name}.', plain: 'Dream big.' },
  { withName: 'Think big, {name}.', plain: 'Think big.' },
  { withName: 'Aim high, {name}.', plain: 'Aim high.' },
  { withName: 'Go bold, {name}.', plain: 'Go bold.' },
  { withName: 'Go all in, {name}.', plain: 'Go all in.' },
  { withName: 'Be ambitious, {name}.', plain: 'Be ambitious.' },
  { withName: 'Make it happen, {name}.', plain: 'Make it happen.' },
  { withName: 'Own the day, {name}.', plain: 'Own the day.' },
  { withName: 'Take the leap, {name}.', plain: 'Take the leap.' },
  { withName: 'Start something big, {name}.', plain: 'Start something big.' },
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

const EXAMPLE_CARDS: ExampleCardData[] = [
  {
    id: 'fill-pipeline',
    title: 'Fill my pipeline',
    prompt: 'Fill my pipeline',
  },
  { id: 'close-deals', title: 'Close my deals', prompt: 'Close my deals' },
  {
    id: 'take-from-rivals',
    title: 'Take customers from my rivals',
    prompt: 'Take customers from my rivals',
  },
  { id: 'clone-me', title: 'Clone me', prompt: 'Clone me' },
];

const MORE_EXAMPLE_CARDS: ExampleCardData[] = [
  { id: 'chase-leads', title: 'Chase my leads', prompt: 'Chase my leads' },
  {
    id: 'get-invoices-paid',
    title: 'Get my invoices paid',
    prompt: 'Get my invoices paid',
  },
  {
    id: 'chase-late-payers',
    title: 'Chase down my late payers',
    prompt: 'Chase down my late payers',
  },
  {
    id: 'grow-following',
    title: 'Grow my following',
    prompt: 'Grow my following',
  },
  { id: 'run-socials', title: 'Run my socials', prompt: 'Run my socials' },
  { id: 'write-posts', title: 'Write my posts', prompt: 'Write my posts' },
  {
    id: 'win-back-customers',
    title: 'Win back my customers',
    prompt: 'Win back my customers',
  },
  {
    id: 'answer-customers',
    title: 'Answer my customers',
    prompt: 'Answer my customers',
  },
  {
    id: 'onboard-signups',
    title: 'Onboard my new signups',
    prompt: 'Onboard my new signups',
  },
  {
    id: 'prep-meetings',
    title: 'Prep me for meetings',
    prompt: 'Prep me for meetings',
  },
  { id: 'run-my-day', title: 'Run my day', prompt: 'Run my day' },
  { id: 'do-my-hiring', title: 'Do my hiring', prompt: 'Do my hiring' },
  { id: 'squash-bugs', title: 'Squash my bugs', prompt: 'Squash my bugs' },
];

const ALL_EXAMPLE_CARDS: ExampleCardData[] = [
  ...EXAMPLE_CARDS,
  ...MORE_EXAMPLE_CARDS,
];

function resolveDefaultCard(card: ExampleCardData): ResolvedCard {
  return {
    key: card.id,
    imageId: card.id,
    title: t(card.title),
    prompt: t(card.prompt),
    imageSrc: `/chat-suggestions/cards/${card.id}.webp`,
  };
}

type ResolvedApp = {
  name: string;
  displayName: string;
  logoUrl: string;
};

type ExampleCardData = {
  id: string;
  title: string;
  prompt: string;
};

type ResolvedCard = {
  key: string;
  imageId: string;
  title: string;
  prompt: string;
  imageSrc: string;
};

type GreetingHeadline = {
  withName: string;
  plain: string;
};
