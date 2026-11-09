import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { domUtils } from '@/lib/dom-utils';

import { chatPanelUtils, useChatPanel } from './chat-panel-open';

// Links inside the app open beside the chat when it is open, so the user
// keeps the conversation; otherwise they navigate normally.
export function useOpenInApp() {
  const navigate = useNavigate();
  const open = useCallback(
    ({ route, name }: { route: string; name: string }) => {
      if (useChatPanel.getState().open) {
        chatPanelUtils.openBeside({ route, push: true, name });
        return;
      }
      navigate(route);
    },
    [navigate],
  );
  const onLinkClick = useCallback(
    ({
      event,
      route,
      name,
    }: {
      event: React.MouseEvent;
      route: string;
      name: string;
    }) => {
      if (!domUtils.isPlainLeftClick(event)) return;
      event.preventDefault();
      open({ route, name });
    },
    [open],
  );
  return { open, onLinkClick };
}
