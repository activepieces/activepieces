import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { domUtils } from '@/lib/dom-utils';

import { chatPanelUtils } from './chat-panel-open';

export function useOpenInApp() {
  const navigate = useNavigate();
  const open = useCallback(
    ({ route, name }: { route: string; name: string }) => {
      if (chatPanelUtils.openBeside({ route, push: true, name })) return;
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
      if (chatPanelUtils.openBeside({ route, push: true, name })) {
        event.preventDefault();
      }
    },
    [],
  );
  return { open, onLinkClick };
}
