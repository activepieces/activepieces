import { ChatConversation, SeekPage } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Ellipsis, Pencil, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { chatApi } from '@/features/chat/lib/chat-api';

import { AIChatBox } from './ai-chat-box';
import { TypewriterText } from './components/typewriter-text';
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
  const [titleResolved, setTitleResolved] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameCancelledRef = useRef(false);

  const selectedConversationId = urlConversationId ?? null;

  const handleNewChat = useCallback(() => {
    setResetKey((k) => k + 1);
    setPendingConversationId(null);
    setConversationTitle(null);
    setTitleResolved(false);
    navigate('/chat', { replace: true });
  }, [navigate]);

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      setPendingConversationId(null);
      setConversationTitle(null);
      setTitleResolved(false);
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
    (title: string) => {
      setConversationTitle(title);
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations'],
      });
    },
    [queryClient],
  );

  const handleRename = useCallback(async () => {
    if (renameCancelledRef.current) {
      renameCancelledRef.current = false;
      return;
    }
    const convId = selectedConversationId ?? pendingConversationId;
    if (!convId || !renameValue.trim()) {
      setIsRenaming(false);
      return;
    }
    renameCancelledRef.current = true;
    try {
      await chatApi.updateConversation(convId, {
        title: renameValue.trim(),
      });
      const currentConvId = selectedConversationId ?? pendingConversationId;
      if (currentConvId === convId) {
        setConversationTitle(renameValue.trim());
      }
      void queryClient.invalidateQueries({
        queryKey: ['chat-conversations'],
      });
    } catch {
      toast.error(t('Failed to rename conversation'));
    } finally {
      renameCancelledRef.current = false;
      setIsRenaming(false);
    }
  }, [selectedConversationId, pendingConversationId, renameValue, queryClient]);

  const handleDelete = useCallback(() => {
    const convId = selectedConversationId ?? pendingConversationId;
    if (!convId) return;
    handleNewChat();
    chatApi.deleteConversation(convId).then(
      () => {
        void queryClient.invalidateQueries({
          queryKey: ['chat-conversations'],
        });
      },
      () => {
        toast.error(t('Failed to delete conversation'));
      },
    );
  }, [
    selectedConversationId,
    pendingConversationId,
    queryClient,
    handleNewChat,
  ]);

  useEffect(() => {
    if (!selectedConversationId || conversationTitle) return;
    let cancelled = false;
    chatApi
      .getConversation(selectedConversationId)
      .then((conv) => {
        if (cancelled) return;
        if (conv.title) setConversationTitle(conv.title);
        setTitleResolved(true);
      })
      .catch(() => {
        if (!cancelled) setTitleResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedConversationId, conversationTitle]);

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
  const cachedTitle = useMemo(() => {
    if (conversationTitle) return conversationTitle;
    if (!selectedConversationId) return null;
    const cached = queryClient.getQueryData<SeekPage<ChatConversation>>([
      'chat-conversations',
    ]);
    return (
      cached?.data?.find((c) => c.id === selectedConversationId)?.title ?? null
    );
  }, [conversationTitle, selectedConversationId, queryClient]);
  const isTitleLoading =
    !!selectedConversationId && !cachedTitle && !titleResolved;
  const displayTitle = cachedTitle ?? t('New Chat');

  return (
    <div className="flex h-full overflow-hidden">
      <div className="shrink-0 overflow-hidden opacity-70 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
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
                if (e.key === 'Escape') {
                  renameCancelledRef.current = true;
                  setIsRenaming(false);
                }
              }}
              className="h-7 text-sm font-semibold max-w-[300px]"
            />
          ) : (
            <>
              {isTitleLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : (
                <TypewriterText
                  text={displayTitle}
                  className="text-sm font-semibold truncate max-w-[400px]"
                />
              )}
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
