import { useParams } from 'react-router-dom';

import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';

// A card rendered inside a chat needs the conversation it belongs to. The URL only carries it for
// the surfaces that route by conversation, so the live id on the store is the reliable source and
// the URL is the fallback for cards rendered outside a store.
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
