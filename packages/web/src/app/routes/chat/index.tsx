import { USE_DRAFT_QUERY_PARAM_NAME } from '@activepieces/shared';
import { nanoid } from 'nanoid';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSearchParam } from 'react-use';

import { ChatDrawerSource } from '@/app/builder/types';
import { Messages } from '@/features/chat';

import { ChatNotFound, FlowChat } from './flow-chat';

export function ChatPage() {
  const { flowId } = useParams();
  const hasDraftSearchParam =
    useSearchParam(USE_DRAFT_QUERY_PARAM_NAME) === 'true';

  const [messages, setMessages] = useState<Messages>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  useEffect(() => {
    if (!chatSessionId) {
      setChatSessionId(nanoid());
    }
  }, [chatSessionId]);

  const addMessage = (message: Messages[0]) => {
    setMessages((prev) => [...prev, message]);
  };

  if (!flowId) {
    return <ChatNotFound />;
  }
  return (
    <FlowChat
      flowId={flowId}
      mode={hasDraftSearchParam ? ChatDrawerSource.TEST_FLOW : null}
      onSendingMessage={() => {}}
      onError={(error) => {
        console.error('Chat error:', error);
      }}
      messages={messages}
      chatSessionId={chatSessionId}
      onAddMessage={addMessage}
      onSetSessionId={setChatSessionId}
    />
  );
}
