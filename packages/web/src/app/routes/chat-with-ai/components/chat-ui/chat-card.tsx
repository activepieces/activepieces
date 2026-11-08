import { t } from 'i18next';
import { ChevronDown, LucideIcon, MoreHorizontal } from 'lucide-react';
import { createContext, ReactNode, useContext, useState } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { cn } from '@/lib/utils';

export function ChatCard({
  turn,
  flat,
  foldable = false,
  defaultOpen,
  className,
  children,
}: ChatCardProps) {
  const nested = useContext(ChatCardNestedContext);
  const isFlat = flat || nested;
  return (
    <FoldScope foldable={foldable} defaultOpen={defaultOpen}>
      <div
        className={cn(
          'flex min-w-0 flex-col rounded-xl motion-safe:animate-chat-enter',
          !isFlat && !turn && 'border border-gray-6 bg-panel',
          turn && 'chat-turn-ring',
          className,
        )}
      >
        {children}
      </div>
    </FoldScope>
  );
}

export function ChatCardHeader({
  tile,
  title,
  titleText,
  titleLines = 1,
  meta,
  metaText,
  summary,
  leading,
  trailing,
}: ChatCardHeaderProps) {
  const fold = useContext(FoldContext);
  const titleTooltip = titleText ?? (typeof title === 'string' ? title : null);
  const metaTooltip = metaText ?? (typeof meta === 'string' ? meta : null);
  const titleClass = cn(
    'text-sm font-medium text-gray-12',
    titleLines === 2 ? 'line-clamp-2 break-words' : 'truncate',
  );
  return (
    <div className="flex min-w-0 items-center gap-3 py-3 pl-3 pr-4 @max-chat-narrow/chat:pr-3">
      {leading && <div className="flex shrink-0">{leading}</div>}
      {tile}
      <div className="flex min-w-0 flex-1 flex-col">
        {titleTooltip === null ? (
          <div className={titleClass}>{title}</div>
        ) : (
          <TextWithTooltip tooltipMessage={titleTooltip}>
            <div className={titleClass}>{title}</div>
          </TextWithTooltip>
        )}
        {meta &&
          (metaTooltip === null ? (
            <div className="truncate text-xs text-gray-11">{meta}</div>
          ) : (
            <TextWithTooltip tooltipMessage={metaTooltip}>
              <div className="truncate text-xs text-gray-11">{meta}</div>
            </TextWithTooltip>
          ))}
        {summary && <div className="mt-1 min-w-0 text-xs">{summary}</div>}
      </div>
      {(trailing || fold.foldable) && (
        <div className="flex shrink-0 items-center gap-1">
          {trailing}
          {fold.foldable && <FoldTrigger open={fold.open} />}
        </div>
      )}
    </div>
  );
}

export function ChatCardHeaderActions({ actions }: ChatCardHeaderActionsProps) {
  const collapses = actions.length > MAX_INLINE_NARROW_ACTIONS;
  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1',
          collapses && '@max-chat-narrow/chat:hidden',
        )}
      >
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            size="icon-xs"
            className="text-gray-11"
            aria-label={action.label}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            <action.icon className="size-4" />
          </Button>
        ))}
      </div>
      {collapses && (
        <div className="hidden @max-chat-narrow/chat:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-gray-11"
                aria-label={t('More actions')}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  disabled={action.disabled}
                  onSelect={action.onClick}
                >
                  <action.icon className="size-4" />
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </>
  );
}

export function ChatCardTile(props: ChatCardTileProps) {
  if (props.kind === 'app') {
    return <AppTile pieceName={props.pieceName} />;
  }
  const Icon = props.icon;
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg',
        props.kind === 'bits'
          ? 'bg-accent-3 text-accent-11'
          : 'border border-gray-5 bg-panel text-gray-11',
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

export function ChatCardBody({ className, children }: ChatCardSectionProps) {
  return (
    <div
      data-slot="chat-card-body"
      className={cn(
        'flex min-w-0 flex-col gap-3 pb-4 pl-14 pr-4 @max-chat-narrow/chat:pl-3 [&:has(+[data-slot=chat-card-actions])]:pb-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ChatCardActions({ className, children }: ChatCardSectionProps) {
  return (
    <div
      data-slot="chat-card-actions"
      className={cn(
        'flex flex-wrap items-center gap-2 pb-4 pl-14 pr-4 pt-0 @max-chat-narrow/chat:pl-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ChatCardFoldContent({ children }: { children: ReactNode }) {
  const fold = useContext(FoldContext);
  if (!fold.foldable) return <>{children}</>;
  return <CollapsibleContent>{children}</CollapsibleContent>;
}

export function ChatCardFold({
  defaultOpen,
  children,
  ...header
}: ChatCardFoldProps) {
  return (
    <FoldScope foldable defaultOpen={defaultOpen}>
      <div>
        <ChatCardHeader {...header} />
        <ChatCardFoldContent>{children}</ChatCardFoldContent>
      </div>
    </FoldScope>
  );
}

function FoldScope({
  foldable,
  defaultOpen,
  children,
}: {
  foldable: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(!foldable || defaultOpen === true);
  const isOpen = !foldable || open;
  return (
    <FoldContext.Provider value={{ foldable, open: isOpen }}>
      <Collapsible asChild open={isOpen} onOpenChange={setOpen}>
        {children}
      </Collapsible>
    </FoldContext.Provider>
  );
}

function FoldTrigger({ open }: { open: boolean }) {
  return (
    <CollapsibleTrigger asChild>
      <Button
        variant="ghost"
        size="icon-xs"
        className="text-gray-9"
        aria-label={open ? t('Hide details') : t('Show details')}
      >
        <ChevronDown
          className={cn('size-4 transition-transform', open && 'rotate-180')}
        />
      </Button>
    </CollapsibleTrigger>
  );
}

export function ChatCardNested({ children }: { children: ReactNode }) {
  return (
    <ChatCardNestedContext.Provider value={true}>
      {children}
    </ChatCardNestedContext.Provider>
  );
}

function AppTile({ pieceName }: { pieceName: string }) {
  const { summary } = piecesHooks.usePieceSummary({ name: pieceName });
  return (
    <LogoPlate
      src={summary?.logoUrl}
      alt={summary?.displayName}
      className="size-8 rounded-lg border border-gray-5"
      innerClassName="p-1.5"
    />
  );
}

const MAX_INLINE_NARROW_ACTIONS = 2;

const FoldContext = createContext<{ foldable: boolean; open: boolean }>({
  foldable: false,
  open: true,
});

const ChatCardNestedContext = createContext(false);

type ChatCardProps = {
  turn?: boolean;
  flat?: boolean;
  foldable?: boolean;
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
};

type ChatCardHeaderProps = {
  tile: ReactNode;
  title: ReactNode;
  titleText?: string;
  titleLines?: 1 | 2;
  meta?: ReactNode;
  metaText?: string;
  summary?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
};

type ChatCardHeaderAction = {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type ChatCardHeaderActionsProps = {
  actions: ChatCardHeaderAction[];
};

type ChatCardTileProps =
  | { kind: 'app'; pieceName: string }
  | { kind: 'bits' | 'file'; icon: LucideIcon };

type ChatCardSectionProps = {
  className?: string;
  children: ReactNode;
};

type ChatCardFoldProps = ChatCardHeaderProps & {
  defaultOpen: boolean;
  children: ReactNode;
};

export type { ChatCardHeaderAction };
