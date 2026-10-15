import { createContext, useContext } from 'react';

const ChatVariantContext = createContext<ChatVariant>('page');

export const ChatVariantProvider = ChatVariantContext.Provider;

export function useIsPanelChat() {
  return useContext(ChatVariantContext) === 'panel';
}

export type ChatVariant = 'page' | 'panel';
