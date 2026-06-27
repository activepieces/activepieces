import { t } from 'i18next';
import {
  Eye,
  History,
  Plug,
  Rocket,
  Settings,
  Table2,
  Variable,
  Workflow,
  type LucideIcon,
} from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ActiveChatContext } from '@/features/chat/lib/chat-types';
import { cn } from '@/lib/utils';

// One chip, one visual vocabulary for "what the chat is aware of in the Stage".
//   variant="live"      — above the composer, always shown while the Stage is
//                         open. Shows the open page + the selected item (focus).
//   variant="committed" — below a user bubble, shown when that message's
//                         page or selected item changed from the previous one,
//                         so scrollback proves what each sent message saw
//                         (including the step). Focus rides on the live message
//                         only — it isn't persisted, so it survives the session
//                         but not a reload.
// A single mount fade keeps it calm — text updates happen in place, so moving
// between cells or navigating pages never replays an entrance animation.
export function StageContextChip({
  context,
  variant,
  className,
}: {
  context: ActiveChatContext | undefined;
  variant: 'live' | 'committed';
  className?: string;
}) {
  if (!context) {
    return null;
  }
  const isLive = variant === 'live';
  // The live chip leads with an eye to signal "I can see what you're looking at";
  // the committed history tag keeps the resource-type icon so scrollback still
  // distinguishes which page each message was about.
  const Icon = isLive ? Eye : iconForType(context.type);
  const name = context.name?.trim() || context.type;
  const focusLabel = context.focus?.label?.trim();
  const chip = (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-foreground/10 bg-muted/40 px-2 py-1 text-xs text-muted-foreground animate-in fade-in duration-200">
      <Icon className="h-3 w-3 shrink-0 text-foreground/40" />
      <span className="truncate font-medium text-foreground/70">{name}</span>
      {focusLabel && (
        <>
          <span className="text-foreground/25" aria-hidden>
            ·
          </span>
          <span className="truncate">{focusLabel}</span>
        </>
      )}
    </span>
  );
  return (
    <div className={cn('flex min-w-0', !isLive && 'justify-end', className)}>
      {isLive ? (
        <Tooltip>
          <TooltipTrigger asChild>{chip}</TooltipTrigger>
          <TooltipContent side="top" align="start">
            {t("I can see what you're looking at")}
          </TooltipContent>
        </Tooltip>
      ) : (
        chip
      )}
    </div>
  );
}

function iconForType(type: string): LucideIcon {
  switch (type) {
    case 'table':
      return Table2;
    case 'flow':
    case 'automations':
      return Workflow;
    case 'run':
    case 'runs':
      return History;
    case 'connections':
      return Plug;
    case 'variables':
      return Variable;
    case 'release':
    case 'releases':
      return Rocket;
    case 'settings':
      return Settings;
    default:
      return Workflow;
  }
}
