import { isObject } from '@activepieces/core-utils';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useChatPanel } from '@/features/workspace/lib/chat-panel-open';
import { CHAT_ROUTE } from '@/lib/route-utils';

export function ChatWithAIPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId: urlId } = useParams<{ conversationId: string }>();
  const storeId = useChatPanel((s) => s.conversationId);
  const lastSynced = useRef<string | null | undefined>(undefined);
  const handedOverPrompt =
    isObject(location.state) && typeof location.state.prompt === 'string'
      ? location.state.prompt
      : undefined;

  useEffect(() => {
    if (handedOverPrompt === undefined) return;
    useChatPanel.getState().newChat(handedOverPrompt);
    navigate(CHAT_ROUTE, { replace: true, state: null });
  }, [handedOverPrompt, navigate]);

  useEffect(() => {
    if (
      handedOverPrompt !== undefined ||
      urlId === undefined ||
      urlId === lastSynced.current
    ) {
      return;
    }
    lastSynced.current = urlId;
    useChatPanel.getState().openConversation(urlId);
  }, [urlId, handedOverPrompt]);

  useEffect(() => {
    const id = useChatPanel.getState().conversationId;
    if (id !== lastSynced.current) {
      lastSynced.current = id;
    } else if (urlId !== undefined) {
      return;
    }
    if ((id ?? undefined) !== urlId) {
      navigate(id ? `${CHAT_ROUTE}/${id}` : CHAT_ROUTE, { replace: true });
    }
  }, [storeId, urlId, navigate]);

  return null;
}
