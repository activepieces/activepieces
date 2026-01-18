'use client';

import { t } from 'i18next';
import { useState } from 'react';

import quickLogoUrl from '@/assets/img/custom/quick-logo.svg';
import { Conversation } from '@/features/chat-v2/conversation';
import { Plan } from '@/features/chat-v2/plan/plan';
import PromptInput from '@/features/chat-v2/prompt-input';
import { ChatSession, isNil } from '@activepieces/shared';

import { chatHooks } from './chat-hooks';

export function QuickPage() {
  const [session, setSession] = useState<ChatSession | null>();
  const { mutate: sendMessage, isPending: isStreaming } =
    chatHooks.useSendMessage(setSession);

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
        <div className="sticky bottom-0 left-0 right-0 pb-4 pt-4 bg-background z-10">
          <div className="max-w-4xl px-4">
            <PromptInput
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
