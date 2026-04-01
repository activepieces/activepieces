import { t } from 'i18next';
import { useState, useEffect, useCallback, useRef } from 'react';

import { cn } from '@/lib/utils';
import { GhostIcon } from '@/components/icons/ghost';
import type { GhostIconHandle } from '@/components/icons/ghost';
import { SlidersHorizontalIcon } from '@/components/icons/sliders-horizontal';
import type { SlidersHorizontalIconHandle } from '@/components/icons/sliders-horizontal';
import { PageHeader } from '@/components/custom/page-header';
import { Separator } from '@/components/ui/separator';
import {
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

import { AIChatBox } from './ai-chat-box';
import { ChatSettingsDialog } from './chat-settings-dialog';
import { ConversationList } from './conversation-list';
import { DelayedTooltip } from './delayed-tooltip';

export function ChatWithAIPage() {
  const [newChat, setNewChat] = useState<{ title: string; key: number } | null>(
    null,
  );
  const [chatKey, setChatKey] = useState(0);
  const [msgCounter, setMsgCounter] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [incognito, setIncognito] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const ghostRef = useRef<GhostIconHandle>(null);
  const settingsRef = useRef<SlidersHorizontalIconHandle>(null);

  const handleNewChat = useCallback(() => {
    setChatKey((k) => k + 1);
    setNewChat(null);
    setChatStarted(false);
    setIncognito(false);
  }, []);

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
    <div className="flex flex-col h-full -mx-4">
      <div className="p-2 flex items-center justify-between">
        <PageHeader
          title={t('AI Piecer')}
          showSidebarToggle={true}
          className="flex-1 !p-0"
        />
        <div className="flex items-center gap-1 shrink-0">
          {!chatStarted ? (
            <DelayedTooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIncognito(!incognito)}
                  onMouseEnter={() => ghostRef.current?.startAnimation()}
                  onMouseLeave={() => ghostRef.current?.stopAnimation()}
                  className={cn(
                    'flex items-center gap-1.5 h-7 px-2 rounded-md border-none cursor-pointer shrink-0 transition-colors text-xs font-medium',
                    incognito
                      ? 'bg-primary/10 dark:bg-primary/20 text-primary'
                      : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <GhostIcon ref={ghostRef} size={16} />
                  Private
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="center"
                className="pointer-events-none"
              >
                {incognito ? 'Switch to Default Chat' : 'Switch to Private Chat'}
              </TooltipContent>
            </DelayedTooltip>
          ) : incognito ? (
            <DelayedTooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium shrink-0 text-muted-foreground">
                  <GhostIcon size={16} />
                  Private Chat
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="center"
                className="pointer-events-none whitespace-pre-line text-center"
              >
                {"This chat won't appear\nin your chat history."}
              </TooltipContent>
            </DelayedTooltip>
          ) : null}
          <DelayedTooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSettingsOpen(true)}
                onMouseEnter={() => settingsRef.current?.startAnimation()}
                onMouseLeave={() => settingsRef.current?.stopAnimation()}
                className="flex items-center justify-center w-7 h-7 rounded-md border-none bg-transparent cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
              >
                <SlidersHorizontalIcon ref={settingsRef} size={16} />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              align="end"
              className="pointer-events-none"
            >
              Settings
            </TooltipContent>
          </DelayedTooltip>
        </div>
      </div>
      <Separator />
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute top-0 left-0 bottom-[140px] z-10">
          <ConversationList newChat={newChat} onNewChat={handleNewChat} />
        </div>
        <AIChatBox
          key={chatKey}
          incognito={incognito}
          onFirstMessage={(text) => {
            if (!incognito) {
              setMsgCounter((c) => c + 1);
              setNewChat({ title: text, key: msgCounter + 1 });
            }
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
