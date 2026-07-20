import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { chatUtils } from '@/features/chat/lib/chat-utils';
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
  const chatDock = useChatDockOptional();
  const underShell = chatDock != null;
  const selectedConversationId = searchParams.get('chat');

  // A collapsed docked panel would swallow the action invisibly — expand it so the
  // user sees the chat they just targeted. A popped-out (floating) chat is already
  // visible and stays floating.
  const revealChatPanel = useCallback(() => {
    if (chatDock && chatDock.chatCollapsed && !chatDock.chatPopped) {
      chatDock.showChat();
    }
  }, [chatDock]);

  const selectConversation = useCallback(
    (id: string, options?: { takeOver?: boolean }) => {
      // `takeOver` closes the Stage and lands on /chat so the conversation fills
      // the full width (a focused, distraction-free mode) instead of opening in
      // the narrow docked side panel next to whatever flow/table is open.
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
        revealChatPanel();
      } else {
        navigate(`${CHAT_ROUTE}?chat=${id}`);
      }
    },
    [underShell, setSearchParams, navigate, revealChatPanel],
  );

  const newChat = useCallback(() => {
    // Under the shell the panel handles the event in place (clears its state and
    // strips ?chat/?new), so a new chat starts in the dock without leaving the page.
    if (underShell) {
      window.dispatchEvent(new Event(chatUtils.newChatEvent));
      revealChatPanel();
      return;
    }
    navigate(`${CHAT_ROUTE}?new=1`);
  }, [underShell, navigate, revealChatPanel]);

  return { selectedConversationId, selectConversation, newChat };
}
