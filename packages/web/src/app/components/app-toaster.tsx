import { useState } from 'react';
import { useSonner } from 'sonner';

import { Toaster } from '@/components/ui/sonner';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

import { useChatWidth } from './chat-panel/chat-window';

export function AppToaster() {
  const panelMounted = useChatPanel((s) => s.panelMounted);
  const chatWidth = useChatWidth();
  const target = panelMounted ? chatWidth : null;
  const showing = useSonner().toasts.length > 0;
  const [placedFor, setPlacedFor] = useState(target);
  if (!showing && placedFor !== target) {
    setPlacedFor(target);
  }
  const placement = chatLayoutUtils.toastPlacementFor(placedFor);
  return (
    <Toaster
      position={placement.position}
      offset={placement.offset}
      mobileOffset={placement.offset}
    />
  );
}
