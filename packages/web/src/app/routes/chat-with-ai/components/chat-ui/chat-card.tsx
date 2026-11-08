import { t } from 'i18next';
import { ChevronDown, LucideIcon } from 'lucide-react';
import { createContext, ReactNode, useContext, useState } from 'react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { cn } from '@/lib/utils';

export function ChatCard({ turn, flat, className, children }: ChatCardProps) {
  const nested = useContext(ChatCardNestedContext);
  const isFlat = flat || nested;
  return (
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
  );
}

export function ChatCardHeader({
  tile,
  title,
  meta,
  trailing,
}: ChatCardHeaderProps) {
  return (
    <div className="flex min-w-0 items-center gap-3 py-3 pl-3 pr-4">
      {tile}
      <div className="flex min-w-0 flex-1 flex-col">
        <TextWithTooltip tooltipMessage={title}>
          <p className="truncate text-sm font-medium text-gray-12">{title}</p>
        </TextWithTooltip>
        {meta && (
          <TextWithTooltip tooltipMessage={meta}>
            <p className="truncate text-xs text-gray-11">{meta}</p>
          </TextWithTooltip>
        )}
      </div>
      {trailing && (
        <div className="flex shrink-0 items-center gap-1">{trailing}</div>
      )}
    </div>
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
      className={cn(
        'flex min-w-0 flex-col gap-3 pb-4 pl-14 pr-4 @max-chat-narrow/chat:pl-3',
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
      className={cn(
        'flex flex-wrap items-center gap-2 border-t border-gray-4 pb-3.5 pl-14 pr-4 pt-3 @max-chat-narrow/chat:pl-3',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ChatCardFold({
  defaultOpen,
  tile,
  title,
  meta,
  trailing,
  children,
}: ChatCardFoldProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <ChatCardHeader
        tile={tile}
        title={title}
        meta={meta}
        trailing={
          <>
            {trailing}
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-gray-9"
                aria-label={open ? t('Hide details') : t('Show details')}
              >
                <ChevronDown
                  className={cn(
                    'size-4 transition-transform',
                    open && 'rotate-180',
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          </>
        }
      />
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
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

const ChatCardNestedContext = createContext(false);

type ChatCardProps = {
  turn?: boolean;
  flat?: boolean;
  className?: string;
  children: ReactNode;
};

type ChatCardHeaderProps = {
  tile: ReactNode;
  title: string;
  meta?: string;
  trailing?: ReactNode;
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
