import { useParams } from 'react-router-dom';

import { useChatStoreContext } from '@/features/chat/lib/chat-store-context';

// A card rendered inside a chat needs the conversation it belongs to, and only the surfaces that
// route by conversation carry it in the URL, so the live id on the store is the reliable source.
// The URL still covers the gap before the chat publishes that id on its first render. Must be
// called inside ChatStoreProvider, which every card is.
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
