import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { followAlong } from '@/features/chat/lib/follow/follow-along';
import { resourceRegistry } from '@/features/chat/lib/resources/registry';
import { isPlainLeftClick } from '@/lib/dom-utils';

import { chatPanelUtils, useChatPanel } from './chat-panel-open';

export function useOpenInApp() {
  const navigate = useNavigate();
  const open = useCallback(
    ({ route }: { route: string }) => {
      if (useChatPanel.getState().open) {
        openBeside(route);
        return;
      }
      navigate(route);
    },
    [navigate],
  );
  const onLinkClick = useCallback(
    ({ event, route }: { event: React.MouseEvent; route: string }) => {
      if (!isPlainLeftClick(event)) return;
      event.preventDefault();
      open({ route });
    },
    [open],
  );
  return { open, onLinkClick };
}

function openBeside(route: string): void {
  const ref = resourceRegistry.refAt(route);
  if (
    ref &&
    resourceRegistry.route(ref) === route &&
    resourceRegistry.isInCurrentProject(ref)
  ) {
    followAlong.view(ref);
    return;
  }
  chatPanelUtils.openBeside({ route, push: true });
}

export const openInAppUtils = { openBeside };
