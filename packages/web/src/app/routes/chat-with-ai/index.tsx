import { t } from 'i18next';
import { useState, useEffect, useCallback } from 'react';

import { PageHeader } from '@/components/custom/page-header';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

import { AIChatBox } from './ai-chat-box';
import { ChatSettingsDialog } from './chat-settings-dialog';
import { ConversationList } from './conversation-list';

export function ChatWithAIPage() {
  const [newChat, setNewChat] = useState<{ title: string; key: number } | null>(
    null,
  );
  const [chatKey, setChatKey] = useState(0);
  const [msgCounter, setMsgCounter] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [incognito, setIncognito] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);

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
      <div
        style={{
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <PageHeader
          title={t('AI Piecer')}
          showSidebarToggle={true}
          className="flex-1 !p-0"
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
          }}
        >
          {!chatStarted ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIncognito(!incognito)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: 'none',
                    background: incognito
                      ? 'hsl(var(--primary) / 0.1)'
                      : 'transparent',
                    cursor: 'pointer',
                    color: incognito
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--muted-foreground))',
                    transition: 'background 0.15s, color 0.15s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!incognito) {
                      e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
                      e.currentTarget.style.color = 'hsl(var(--foreground))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!incognito) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color =
                        'hsl(var(--muted-foreground))';
                    }
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill={incognito ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 18a2 2 0 0 0-4 0" />
                    <path d="m19 11-2.11-6.657a2 2 0 0 0-2.752-1.148l-1.276.61A2 2 0 0 1 12 4H8.5a2 2 0 0 0-1.925 1.456L5 11" />
                    <path d="M2 11h20" />
                    <circle cx="17" cy="18" r="3" />
                    <circle cx="7" cy="18" r="3" />
                  </svg>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                {incognito ? 'Exit Incognito' : 'Incognito Chat'}
              </TooltipContent>
            </Tooltip>
          ) : incognito ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: '#9ca3af',
                    fontSize: '12px',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 18a2 2 0 0 0-4 0" />
                    <path d="m19 11-2.11-6.657a2 2 0 0 0-2.752-1.148l-1.276.61A2 2 0 0 1 12 4H8.5a2 2 0 0 0-1.925 1.456L5 11" />
                    <path d="M2 11h20" />
                    <circle cx="17" cy="18" r="3" />
                    <circle cx="7" cy="18" r="3" />
                  </svg>
                  Incognito Chat
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                align="center"
                style={{ whiteSpace: 'pre-line', textAlign: 'center' }}
              >
                {"This chat won't appear\nin your chat history."}
              </TooltipContent>
            </Tooltip>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSettingsOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: 'hsl(var(--muted-foreground))',
                  transition: 'background 0.15s, color 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
                  e.currentTarget.style.color = 'hsl(var(--foreground))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'hsl(var(--muted-foreground))';
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 17H5" />
                  <path d="M19 7h-9" />
                  <circle cx="17" cy="17" r="3" />
                  <circle cx="7" cy="7" r="3" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end">
              Settings
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <Separator />
      <div className="flex-1 overflow-hidden" style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: '140px',
            zIndex: 10,
          }}
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
