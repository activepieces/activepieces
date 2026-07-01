import { t } from 'i18next';
import { MapPin } from 'lucide-react';

import {
  ActiveChatContext,
  activeContextUtils,
} from '@/features/chat/lib/chat-types';
import { cn } from '@/lib/utils';

// A bare, italic, muted one-liner printed ABOVE a user message when the user's
// position in the Stage changed since their previous message (and on the very
// first message that has a position). It is intentionally not a chip or a
// bubble — it reads as a quiet narration of where the user was when they typed.
// The same fact is mirrored into the agent's message history server-side, so the
// model sees the exact trail the user sees.
export function ContextPositionLine({
  context,
  previous,
  className,
}: {
  context: ActiveChatContext;
  previous: ActiveChatContext | undefined;
  className?: string;
}) {
  const location = activeContextUtils.formatPositionLabel(context);
  const text = buildText({ context, previous, location });
  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1.5 py-1 text-xs italic text-muted-foreground',
        className,
      )}
    >
      <MapPin className="h-3 w-3 shrink-0 text-foreground/40" />
      <span className="truncate">{text}</span>
    </div>
  );
}

function buildText({
  context,
  previous,
  location,
}: {
  context: ActiveChatContext;
  previous: ActiveChatContext | undefined;
  location: string;
}): string {
  if (!previous) {
    return t('User is on {location}', { location });
  }
  // Within the same resource, "from" is the previously-selected item (cell/step);
  // across resources it's the previous resource itself — mirrors the server's
  // switch-line dedup so we never read "moved to X (from X)".
  const sameResource = activeContextUtils.isSame(context, previous);
  const from = sameResource
    ? previous.focus?.label?.trim()
    : previous.name?.trim() || previous.type;
  return from
    ? t('User moved to {location} (from {previous})', {
        location,
        previous: from,
      })
    : t('User moved to {location}', { location });
}
