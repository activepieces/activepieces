import { Navigate, useParams } from 'react-router-dom';

import { CHAT_ROUTE } from '@/lib/route-utils';

// Legacy /chat/:conversationId deep links open the conversation in the persistent
// chat panel, which keys off ?chat=. The login guard runs on /chat itself.
export function ChatRouteRedirect() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const target = conversationId
    ? `${CHAT_ROUTE}?chat=${conversationId}`
    : CHAT_ROUTE;
  return <Navigate to={target} replace />;
}
