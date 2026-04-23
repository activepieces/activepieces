import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { chatApi } from '@/features/chat/lib/chat-api';
import { authenticationSession } from '@/lib/authentication-session';

import { AIChatBox } from './ai-chat-box';
import { ConversationList } from './conversation-list';

export function ChatWithAIPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { projectId: routeProjectId, conversationId: urlConversationId } =
    useParams<{ projectId: string; conversationId: string }>();
  const projectId =
    routeProjectId ?? authenticationSession.getProjectId() ?? '';
  const [chatKey, setChatKey] = useState(0);

  const selectedConversationId = urlConversationId ?? null;

  useEffect(() => {
    setChatKey((k) => k + 1);
  }, [projectId]);

  useEffect(() => {
    void chatApi.warm();
  }, []);

  const handleNewChat = useCallback(() => {
    setChatKey((k) => k + 1);
    navigate(`/projects/${projectId}/chat`, { replace: true });
  }, [navigate, projectId]);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setChatKey((k) => k + 1);
      navigate(`/projects/${projectId}/chat/${conversationId}`, {
        replace: true,
      });
    },
    [navigate, projectId],
  );

  const handleConversationCreated = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ['chat-conversations', projectId],
    });
  }, [queryClient, projectId]);

  const handleTitleUpdate = useCallback(
    (title: string, conversationId?: string) => {
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations', projectId],
      });
      if (conversationId && !selectedConversationId) {
        navigate(`/projects/${projectId}/chat/${conversationId}`, {
          replace: true,
        });
      }
    },
    [queryClient, projectId, selectedConversationId, navigate],
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
          selectedId={selectedConversationId}
        />
      </div>
      <AIChatBox
        key={`${projectId}-${chatKey}`}
        incognito={false}
        conversationId={selectedConversationId}
        onTitleUpdate={handleTitleUpdate}
        onConversationCreated={handleConversationCreated}
        onFirstMessage={() => {}}
      />
    </div>
  );
}
