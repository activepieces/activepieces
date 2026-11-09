import { useEffect, useState } from 'react';
import { useSonner } from 'sonner';

import { Toaster } from '@/components/ui/sonner';
import {
  ChatWidth,
  chatLayoutUtils,
} from '@/features/workspace/lib/chat-layout';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

import { useChatWidth } from './chat-panel/chat-window';

export function AppToaster() {
  const panelMounted = useChatPanel((s) => s.panelMounted);
  const [chatWidth, setChatWidth] = useState<ChatWidth | null>(null);
  const target = panelMounted ? chatWidth : null;
  const showing = useSonner().toasts.length > 0;
  const [placedFor, setPlacedFor] = useState(target);
  if (!showing && placedFor !== target) {
    setPlacedFor(target);
  }
  const placement = chatLayoutUtils.toastPlacementFor(placedFor);
  return (
    <>
      {panelMounted && <ChatWidthProbe onChange={setChatWidth} />}
      <Toaster
        position={placement.position}
        offset={placement.offset}
        mobileOffset={placement.offset}
      />
    </>
  );
}

function ChatWidthProbe({
  onChange,
}: {
  onChange: (chatWidth: ChatWidth) => void;
}) {
  const chatWidth = useChatWidth();
  useEffect(() => {
    onChange(chatWidth);
  }, [chatWidth, onChange]);
  return null;
}
