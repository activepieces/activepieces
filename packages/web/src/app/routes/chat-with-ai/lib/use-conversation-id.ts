import { useParams } from 'react-router-dom';

export function useConversationId(): string | undefined {
  const { conversationId } = useParams<{ conversationId: string }>();
  return (
    conversationId ?? window.location.pathname.match(/\/chat\/([^/]+)/)?.[1]
  );
}
