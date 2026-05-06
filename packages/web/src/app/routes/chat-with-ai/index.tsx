import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { chatApi } from '@/features/chat/lib/chat-api';

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
  const [conversationTitle, setConversationTitle] = useState<string | null>(
    null,
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const selectedConversationId = urlConversationId ?? null;

  const handleNewChat = useCallback(() => {
    setResetKey((k) => k + 1);
    setPendingConversationId(null);
    setConversationTitle(null);
    navigate('/chat', { replace: true });
  }, [navigate]);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setPendingConversationId(null);
      setConversationTitle(null);
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
    (title: string, conversationId?: string) => {
      setConversationTitle(title);
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

  const handleRename = useCallback(async () => {
    const convId = selectedConversationId ?? pendingConversationId;
    if (!convId || !renameValue.trim()) {
      setIsRenaming(false);
      return;
    }
    await chatApi.updateConversation(convId, {
      title: renameValue.trim(),
    });
    setConversationTitle(renameValue.trim());
    setIsRenaming(false);
    void queryClient.invalidateQueries({
      queryKey: ['chat-conversations'],
    });
  }, [selectedConversationId, pendingConversationId, renameValue, queryClient]);

  const handleDelete = useCallback(async () => {
    const convId = selectedConversationId ?? pendingConversationId;
    if (!convId) return;
    await chatApi.deleteConversation(convId);
    void queryClient.invalidateQueries({
      queryKey: ['chat-conversations'],
    });
    handleNewChat();
  }, [
    selectedConversationId,
    pendingConversationId,
    queryClient,
    handleNewChat,
  ]);

  useEffect(() => {
    if (!selectedConversationId) return;
    chatApi
      .getConversation(selectedConversationId)
      .then((conv) => {
        setConversationTitle(conv.title ?? null);
      })
      .catch(() => undefined);
  }, [selectedConversationId]);

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

  const activeConversationId = selectedConversationId ?? pendingConversationId;
  const displayTitle = conversationTitle ?? t('New conversation');

  return (
    <div className="flex h-full overflow-hidden">
      <div className="shrink-0 overflow-hidden opacity-40 hover:opacity-100 transition-opacity duration-200">
        <ConversationList
          onNewChat={handleNewChat}
          onSelect={handleSelectConversation}
          selectedId={pendingConversationId ?? selectedConversationId}
        />
      </div>
      <div className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        <div className="shrink-0 flex items-center gap-1.5 px-6 py-3 border-b">
          {isRenaming ? (
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => void handleRename()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              className="h-7 text-sm font-semibold max-w-[300px]"
            />
          ) : (
            <>
              <span className="text-sm font-semibold truncate max-w-[400px]">
                {displayTitle}
              </span>
              {activeConversationId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                    >
                      <Ellipsis className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => {
                        setRenameValue(conversationTitle ?? '');
                        setIsRenaming(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      {t('Rename')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => void handleDelete()}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('Delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>
        <div className="flex-1 min-h-0">
          <AIChatBox
            key={`${selectedConversationId ?? 'new'}-${resetKey}`}
            incognito={false}
            conversationId={selectedConversationId}
            onTitleUpdate={handleTitleUpdate}
            onConversationCreated={handleConversationCreated}
          />
        </div>
      </div>
    </div>
  );
}
