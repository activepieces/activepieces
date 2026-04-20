import { t } from 'i18next';
import { useState, useEffect, useCallback, useRef } from 'react';

import { PageHeader } from '@/components/custom/page-header';
import { GhostIcon } from '@/components/icons/ghost';
import type { GhostIconHandle } from '@/components/icons/ghost';
import { SlidersHorizontalIcon } from '@/components/icons/sliders-horizontal';
import type { SlidersHorizontalIconHandle } from '@/components/icons/sliders-horizontal';
import { Separator } from '@/components/ui/separator';
import { TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col h-full">
      <div className="px-4 py-2 flex items-center justify-between">
        <PageHeader
          title={t('AI Piecer')}
          showSidebarToggle={true}
          className="flex-1 !p-0"
        />
        <div className="flex items-center gap-1 shrink-0">
          {incognito ? (
            <DelayedTooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleNewChat}
                  onMouseEnter={() => ghostRef.current?.startAnimation()}
                  onMouseLeave={() => ghostRef.current?.stopAnimation()}
                  className="flex items-center gap-1.5 h-7 px-2 rounded-md border-none cursor-pointer shrink-0 transition-colors text-xs font-medium bg-primary/10 dark:bg-primary/20 text-primary"
                >
                  <GhostIcon ref={ghostRef} size={16} />
                  Close Private Chat
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="center"
                className="pointer-events-none"
              >
                Switch to Default Chat
              </TooltipContent>
            </DelayedTooltip>
          ) : !chatStarted ? (
            <DelayedTooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIncognito(true)}
                  onMouseEnter={() => ghostRef.current?.startAnimation()}
                  onMouseLeave={() => ghostRef.current?.stopAnimation()}
                  className="flex items-center gap-1.5 h-7 px-2 rounded-md border-none cursor-pointer shrink-0 transition-colors text-xs font-medium bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
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
                Switch to Private Chat
              </TooltipContent>
            </DelayedTooltip>
          ) : null}
          {!incognito && (
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
          )}
        </div>
      </div>
      <Separator />
      <div className="flex-1 overflow-hidden relative">
        <div
          className={cn(
            'absolute top-0 left-0 bottom-[140px] z-10 transition-transform duration-300 ease-in-out',
            incognito && '-translate-x-full',
          )}
        >
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
