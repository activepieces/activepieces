'use client';

import { useState } from 'react';

import { Conversation } from '@/features/chat-v2/conversation';
import PromptInput from '@/features/chat-v2/prompt-input';
import { ChatSession, isNil } from '@activepieces/shared';

import { chatHooks } from './chat-hooks';

export function QuickPage() {
  const [session, setSession] = useState<ChatSession | null>();
  const { mutate: sendMessage, isPending: isStreaming } =
    chatHooks.useSendMessage(setSession);

  return (
    <div className="flex flex-col gap-2 w-full min-h-screen relative">
      <div className="h-10"></div>
      <div className="flex-1 flex justify-center">
        {!isNil(session) && !isNil(session.conversation) && (
          <Conversation
            conversation={session.conversation}
            className="w-full max-w-4xl px-4 py-4 space-y-10"
          />
        )}
      </div>
      <div className="sticky bottom-0 left-0 right-0 flex justify-center pb-4 pt-4 bg-background z-10">
        <div className="w-full max-w-4xl px-4">
          <PromptInput
            onMessageSend={(message) =>
              sendMessage({
                message,
                sessionId: isNil(session) ? null : session.id,
              })
            }
            placeholder="Ask Quick..."
            loading={isStreaming}
          />
        </div>
      </div>
    </div>
  );
}
