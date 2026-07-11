import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { CHAT_ROUTE } from '@/lib/route-utils';

import { useChatDockOptional } from './chat-dock-context';

// Drives the persistent chat panel from anywhere in the sidebar without touching the
// panel's conversation-identity state machine. Under the workspace shell the panel syncs
// itself from the `?chat=` param and the `ap:new-chat` event, so selecting a conversation
// there just updates the URL in place (preserving the current Stage). Outside the shell
// (e.g. the standalone analytics pages) there is no panel to sync, so we navigate to /chat.
export function useChatNavigation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const underShell = useChatDockOptional() != null;
  const selectedConversationId = searchParams.get('chat');

  const selectConversation = useCallback(
    (id: string, options?: { takeOver?: boolean }) => {
      // `takeOver` closes the Stage and lands on /chat so the conversation fills
      // the full width (a focused, distraction-free mode) instead of opening in
      // the narrow docked side panel next to whatever flow/table is open. Used
      // for the $10 mission, which wants the user's full attention.
      if (underShell && !options?.takeOver) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set('chat', id);
            next.delete('new');
            return next;
          },
          { replace: true },
        );
      } else {
        navigate(`${CHAT_ROUTE}?chat=${id}`);
      }
    },
    [underShell, setSearchParams, navigate],
  );

  const newChat = useCallback(() => {
    navigate(`${CHAT_ROUTE}?new=1`);
  }, [navigate]);

  return { selectedConversationId, selectConversation, newChat };
}
