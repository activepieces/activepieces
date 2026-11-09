import { isObject } from '@activepieces/core-utils';
import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { CHAT_ROUTE } from '@/lib/route-utils';

export function ChatWithAIPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId } = useParams<{ conversationId: string }>();
  const urlId = conversationId ?? null;
  const handedOverPrompt =
    isObject(location.state) && typeof location.state.prompt === 'string'
      ? location.state.prompt
      : undefined;

  useEffect(() => {
    if (handedOverPrompt === undefined) {
      useChatPanel.getState().showConversation(urlId);
      return;
    }
    useChatPanel.getState().newChat(handedOverPrompt);
    navigate(CHAT_ROUTE, { replace: true, state: null });
  }, [urlId, handedOverPrompt, navigate]);

  return null;
}
