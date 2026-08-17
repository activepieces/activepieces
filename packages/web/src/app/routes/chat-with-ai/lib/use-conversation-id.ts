import { createContext, useContext } from 'react';
import { useParams } from 'react-router-dom';

const ActiveConversationContext = createContext<string | undefined>(undefined);

export function useConversationId(): string | undefined {
  const fromHost = useContext(ActiveConversationContext);
  const { conversationId } = useParams<{ conversationId: string }>();
  return (
    fromHost ??
    conversationId ??
    window.location.pathname.match(/\/chat\/([^/]+)/)?.[1]
  );
}

export const ActiveConversationProvider = ActiveConversationContext.Provider;
