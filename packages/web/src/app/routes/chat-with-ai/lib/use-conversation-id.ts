import { useParams, useSearchParams } from 'react-router-dom';

// The chat lives at `/chat?chat=<id>` (id in the query string), but it can also appear as a
// `/chat/<id>` path. Resolve from the route param first, then the `?chat=` query param, then the
// pathname — so the conversation id is available regardless of which URL shape is in use.
export function useConversationId(): string | undefined {
  const { conversationId } = useParams<{ conversationId: string }>();
  const [searchParams] = useSearchParams();
  return (
    conversationId ??
    searchParams.get('chat') ??
    window.location.pathname.match(/\/chat\/([^/]+)/)?.[1]
  );
}
