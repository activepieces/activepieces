import { useState, useEffect, useCallback } from 'react';
import { t } from 'i18next';

import { PageHeader } from '@/components/custom/page-header';
import { Separator } from '@/components/ui/separator';

import { AIChatBox } from './ai-chat-box';
import { ConversationList } from './conversation-list';

export function ChatWithAIPage() {
  const [newChat, setNewChat] = useState<{ title: string; key: number } | null>(null);
  const [chatKey, setChatKey] = useState(0);
  const [msgCounter, setMsgCounter] = useState(0);

  const handleNewChat = useCallback(() => {
    setChatKey((k) => k + 1);
    setNewChat(null);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleNewChat]);

  return (
    <div className="flex flex-col h-full -mx-4">
      <div style={{ padding: '8px' }}>
        <PageHeader
          title={t('AI Piecer')}
          showSidebarToggle={true}
          className="min-w-full !p-0"
        />
      </div>
      <Separator />
      <div className="flex-1 overflow-hidden" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: '130px', zIndex: 10 }}>
          <ConversationList newChat={newChat} onNewChat={handleNewChat} />
        </div>
        <AIChatBox key={chatKey} onFirstMessage={(text) => { setMsgCounter((c) => c + 1); setNewChat({ title: text, key: msgCounter + 1 }); }} />
      </div>
    </div>
  );
}
