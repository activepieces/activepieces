import {
  cardInnerWidth,
  dockWidthFor,
} from '@/features/workspace/lib/chat-layout';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { useRailOpen } from '@/features/workspace/lib/rail-collapsed';
import { cn } from '@/lib/utils';

import { useChatWidth, useWindowWidth } from './chat-window';
import { FollowBar } from './follow-bar';

export function ChatContentColumn({ children }: { children: React.ReactNode }) {
  const chatWidth = useChatWidth();
  const moving = useChatPanel((s) => s.moving);
  const savedWidth = useChatPanel((s) => s.dockWidth);
  const railOpen = useRailOpen();
  const viewportWidth = useWindowWidth();
  const full = chatWidth === 'full';
  const cardWidth = cardInnerWidth(viewportWidth, railOpen);
  const pinnedWidth =
    moving === 'enter' && chatWidth === 'left'
      ? cardWidth - dockWidthFor(savedWidth, cardWidth)
      : moving === 'exit'
      ? 0
      : null;
  return (
    <div
      inert={full}
      className={cn(
        'min-w-0 overflow-hidden',
        pinnedWidth === null ? 'relative flex-1' : 'absolute inset-y-0 right-0',
      )}
      style={pinnedWidth === null ? undefined : { width: pinnedWidth }}
    >
      <div className="flex h-full flex-col">
        <FollowBar />
        {children}
      </div>
    </div>
  );
}
