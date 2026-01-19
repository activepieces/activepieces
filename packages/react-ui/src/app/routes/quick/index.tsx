import { t } from 'i18next';
import { useState } from 'react';

import quickLogoUrl from '@/assets/img/custom/quick-logo.svg';
import { Conversation } from '@/features/chat-v2/conversation';
import { Plan } from '@/features/chat-v2/plan/plan';
import PromptInput from '@/features/chat-v2/prompt-input';
import { ChatSession, DEFAULT_CHAT_MODEL, isNil } from '@activepieces/shared';

import { chatHooks } from './chat-hooks';

export function QuickPage() {
  const [session, setSession] = useState<ChatSession | null>();
  const { mutate: sendMessage, isPending: isStreaming } =
    chatHooks.useSendMessage(setSession);
  const { mutate: updateChatModel } = chatHooks.useUpdateChatModel(setSession);
  const { mutate: toggleSearchTool } =
    chatHooks.useToggleSearchTool(setSession);

  console.log('2222222222222222222222');
  console.log(session);
  console.log('2222222222222222222222');

  return (
    <div className="flex gap-8 w-full min-h-screen px-4">
      <div className="flex-1 flex flex-col gap-2 relative">
        <div className="h-10"></div>
        <div className="flex-1">
          {!isNil(session) && !isNil(session.conversation) ? (
            <Conversation
              conversation={session.conversation}
              className="w-full max-w-4xl px-4 py-4 space-y-10"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <img
                src={quickLogoUrl}
                alt="Quick Logo"
                className="size-16 mb-4"
              />
              <p className="text-muted-foreground text-center">
                {t('Ask Quick to help with your tasks')}
              </p>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 z-10 bg-background py-4 flex justify-center border">
          <div className="w-4xl px-4">
            <PromptInput
              enabled={
                !isNil(session?.webSearchEnabled)
                  ? session.webSearchEnabled
                  : true
              }
              toggleWebSearchTool={(enabled) =>
                toggleSearchTool({
                  enabled,
                  currentSession: isNil(session) ? null : session,
                })
              }
              defaultModel={
                !isNil(session?.modelId) ? session.modelId : DEFAULT_CHAT_MODEL
              }
              updateChatModel={(modelId) =>
                updateChatModel({
                  modelId,
                  currentSession: isNil(session) ? null : session,
                })
              }
              onMessageSend={(message) =>
                sendMessage({
                  message,
                  currentSession: isNil(session) ? null : session,
                })
              }
              placeholder="Ask Quick..."
              loading={isStreaming}
            />
          </div>
        </div>
      </div>
      <div className="w-100 sticky top-4 h-fit">
        <Plan items={session?.plan ?? []} />
      </div>
    </div>
  );
}
