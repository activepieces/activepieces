import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { EyeOff, Settings } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { PageHeader } from '@/components/custom/page-header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { authenticationSession } from '@/lib/authentication-session';

import { AIChatBox } from './ai-chat-box';
import { ChatSettingsDialog } from './chat-settings-dialog';
import { ConversationList } from './conversation-list';

export function ChatWithAIPage() {
  const queryClient = useQueryClient();
  const projectId = authenticationSession.getProjectId();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [newChat, setNewChat] = useState<{
    title: string;
    key: number;
  } | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const [msgCounter, setMsgCounter] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [incognito, setIncognito] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);

  const handleNewChat = useCallback(() => {
    setChatKey((k) => k + 1);
    setSelectedConversationId(null);
    setNewChat(null);
    setChatStarted(false);
    setIncognito(false);
  }, []);

  const handleSelectConversation = useCallback((conversationId: string) => {
    setSelectedConversationId(conversationId);
    setChatKey((k) => k + 1);
    setChatStarted(true);
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
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 flex items-center justify-between">
        <PageHeader
          title={t('Chat')}
          showSidebarToggle={true}
          className="flex-1 !p-0"
        />
        <div className="flex items-center gap-1 shrink-0">
          {incognito ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="text-xs gap-1.5 bg-primary/10 text-primary hover:bg-primary/20"
            >
              <EyeOff className="h-3.5 w-3.5" />
              {t('Close Private Chat')}
            </Button>
          ) : (
            !chatStarted && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIncognito(true)}
                    className="text-xs gap-1.5 text-muted-foreground"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    {t('Private')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Switch to Private Chat')}</TooltipContent>
              </Tooltip>
            )
          )}
          {!incognito && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('Settings')}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <Separator />
      <div className="flex-1 overflow-hidden flex">
        {!incognito && (
          <div className="shrink-0 border-r overflow-hidden">
            <ConversationList
              newChat={newChat}
              onNewChat={handleNewChat}
              onSelect={handleSelectConversation}
              selectedId={selectedConversationId}
            />
          </div>
        )}
        <AIChatBox
          key={chatKey}
          incognito={incognito}
          conversationId={selectedConversationId}
          onTitleUpdate={handleTitleUpdate}
          onConversationCreated={handleTitleUpdate}
          onFirstMessage={(text) => {
            setChatStarted(true);
          }}
        />
      </div>
      <ChatSettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
}
