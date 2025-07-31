import { nanoid } from 'nanoid';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSearchParam } from 'react-use';

import { ChatDrawerSource } from '@/app/builder/builder-hooks';
import { Messages } from '@/components/ui/chat/chat-message-list';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { flowsHooks } from '@/features/flows/lib/flows-hooks';
import { isNil, USE_DRAFT_QUERY_PARAM_NAME } from '@activepieces/shared';

import { ChatNotFound, FlowChat } from './flow-chat';

export function ChatPage() {
  const { flowId } = useParams();
  const hasDraftSearchParam =
    useSearchParam(USE_DRAFT_QUERY_PARAM_NAME) === 'true';

  const [messages, setMessages] = useState<Messages>([]);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const { data: flow, isLoading } = flowsHooks.useGetFlow(flowId ?? '');
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
  if (isLoading) {
    return <LoadingScreen />;
  }

  const isDraft =
    hasDraftSearchParam || (flow && isNil(flow.publishedVersionId));
  return (
    <FlowChat
      flowId={flowId}
      mode={isDraft ? ChatDrawerSource.TEST_FLOW : null}
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
