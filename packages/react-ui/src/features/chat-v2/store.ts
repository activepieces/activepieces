import { create } from 'zustand';

import { ChatSession } from '@activepieces/shared';

type ChatSessionState = {
  session: ChatSession | null;
  setSession: (session: ChatSession | null) => void;
};

export const useChatSessionStore = create<ChatSessionState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
}));
