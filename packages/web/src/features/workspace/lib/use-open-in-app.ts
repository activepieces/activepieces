import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  chatPanelIsDocked,
  chatTransitions,
  useChatPanel,
} from './chat-panel-open';

export function useOpenInApp() {
  const navigate = useNavigate();
  const open = useCallback(
    ({ route }: { route: string }) => {
      if (chatPanelIsDocked(useChatPanel.getState())) {
        chatTransitions.openBeside({ route, push: true });
        return;
      }
      navigate(route);
    },
    [navigate],
  );
  const onLinkClick = useCallback(
    ({ event, route }: { event: React.MouseEvent; route: string }) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      event.preventDefault();
      open({ route });
    },
    [open],
  );
  return { open, onLinkClick };
}
