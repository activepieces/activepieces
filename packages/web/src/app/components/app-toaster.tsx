import { Toaster } from '@/components/ui/sonner';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';
import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';

import { useChatWidth } from './chat-panel/chat-window';

export function AppToaster() {
  const panelMounted = useChatPanel((s) => s.panelMounted);
  const chatWidth = useChatWidth();
  const placement = chatLayoutUtils.toastPlacementFor(
    panelMounted ? chatWidth : null,
  );
  return (
    <Toaster
      position={placement.position}
      offset={placement.offset}
      mobileOffset={placement.offset}
    />
  );
}
