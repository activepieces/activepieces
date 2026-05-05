import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AIChatBox } from './ai-chat-box';
import { ConversationList } from './conversation-list';

export function ChatWithAIPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams<{
    conversationId: string;
  }>();
  const [resetKey, setResetKey] = useState(0);
  const [pendingConversationId, setPendingConversationId] = useState<
    string | null
  >(null);

  const selectedConversationId = urlConversationId ?? null;

  const handleNewChat = useCallback(() => {
    setResetKey((k) => k + 1);
    setPendingConversationId(null);
    navigate('/chat', { replace: true });
  }, [navigate]);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setPendingConversationId(null);
      navigate(`/chat/${conversationId}`, {
        replace: true,
      });
    },
    [navigate],
  );

  const handleConversationCreated = useCallback(
    (conversationId: string) => {
      setPendingConversationId(conversationId);
      window.history.replaceState(null, '', `/chat/${conversationId}`);
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations'],
      });
    },
    [queryClient],
  );

  const handleTitleUpdate = useCallback(
    (_title: string, conversationId?: string) => {
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations'],
      });
      if (conversationId && !selectedConversationId) {
        setPendingConversationId(null);
        navigate(`/chat/${conversationId}`, {
          replace: true,
        });
      }
    },
    [queryClient, selectedConversationId, navigate],
  );

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
          selectedId={pendingConversationId ?? selectedConversationId}
        />
      </div>
      <AIChatBox
        key={`${selectedConversationId ?? 'new'}-${resetKey}`}
        incognito={false}
        conversationId={selectedConversationId}
        onTitleUpdate={handleTitleUpdate}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}
