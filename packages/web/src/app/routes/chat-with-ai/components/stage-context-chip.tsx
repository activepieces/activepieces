import { t } from 'i18next';
import { Eye } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ActiveChatContext } from '@/features/chat/lib/chat-types';
import { cn } from '@/lib/utils';

// The always-on chip above the composer — the realtime "what the chat can see in
// the Stage" signal: the open page plus the selected item (focus). The per-message
// position trail in scrollback is handled separately by ContextPositionLine.
// A single mount fade keeps it calm — text updates happen in place, so moving
// between cells or navigating pages never replays an entrance animation.
export function StageContextChip({
  context,
  className,
}: {
  context: ActiveChatContext | undefined;
  className?: string;
}) {
  if (!context) {
    return null;
  }
  const name = context.name?.trim() || context.type;
  const focusLabel = context.focus?.label?.trim();
  return (
    <div className={cn('flex min-w-0', className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-foreground/10 bg-muted/40 px-2 py-1 text-xs text-muted-foreground animate-in fade-in duration-200">
            <Eye className="h-3 w-3 shrink-0 text-foreground/40" />
            <span className="truncate font-medium text-foreground/70">
              {name}
            </span>
            {focusLabel && (
              <>
                <span className="text-foreground/25" aria-hidden>
                  ·
                </span>
                <span className="truncate">{focusLabel}</span>
              </>
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" align="start">
          {t("I can see what you're looking at")}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
