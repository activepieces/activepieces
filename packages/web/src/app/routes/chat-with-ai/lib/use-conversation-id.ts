import { useParams } from 'react-router-dom';

import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';

export function useConversationId(): string | undefined {
  const fromStore = useChatStoreContext((s) => s.conversationId);
  const { conversationId } = useParams<{ conversationId: string }>();
  return (
    fromStore ??
    conversationId ??
    new URLSearchParams(window.location.search).get('conversation') ??
    window.location.pathname.match(/\/chat\/([^/]+)/)?.[1]
  );
}
