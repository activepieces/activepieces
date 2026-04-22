import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

import { authenticationSession } from '@/lib/authentication-session';

import { AIChatBox } from './ai-chat-box';
import { ConversationList } from './conversation-list';

export function ChatWithAIPage() {
  const queryClient = useQueryClient();
  const projectId = authenticationSession.getProjectId();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [chatKey, setChatKey] = useState(0);

  const handleNewChat = useCallback(() => {
    setChatKey((k) => k + 1);
    setSelectedConversationId(null);
  }, []);

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setChatKey((k) => k + 1);
  }, []);

  const handleTitleUpdate = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ['chat-conversations', projectId],
    });
  }, [queryClient, projectId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'o'
      ) {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNewChat]);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="shrink-0 border-r overflow-hidden">
        <ConversationList
          onNewChat={handleNewChat}
          onSelect={handleSelectConversation}
          selectedId={selectedConversationId}
        />
      </div>
      <AIChatBox
        key={`${projectId}-${chatKey}`}
        incognito={false}
        conversationId={selectedConversationId}
        onTitleUpdate={handleTitleUpdate}
        onConversationCreated={handleTitleUpdate}
        onFirstMessage={() => {}}
      />
    </div>
  );
}
