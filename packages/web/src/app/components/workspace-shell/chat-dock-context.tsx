import { createContext, useContext } from 'react';

// Exposes the workspace chat panel's dock state (and the dock/pop-out actions)
// to descendants rendered inside the Stage — notably the flow builder, which
// shows step settings as a floating card while the chat is docked and as the
// full sidebar once the chat pops out. Returns null outside the workspace shell
// (e.g. the embedded builder), where there is no chat to coordinate with.
export function ChatDockProvider({
  value,
  children,
}: {
  value: ChatDockContextValue;
  children: React.ReactNode;
}) {
  return (
    <ChatDockContext.Provider value={value}>
      {children}
    </ChatDockContext.Provider>
  );
}

export function useChatDockOptional(): ChatDockContextValue | null {
  return useContext(ChatDockContext);
}

const ChatDockContext = createContext<ChatDockContextValue | null>(null);

export type ChatDockContextValue = {
  chatPopped: boolean;
  chatCollapsed: boolean;
  // `teachDock` asks the shell to show a one-time hint on the dock control when
  // we pop the chat out for the user (vs. the user clicking pop-out themselves),
  // so they learn how to return to the docked side-by-side view.
  popOutChat: (options?: { teachDock?: boolean }) => void;
  dockChat: () => void;
};
