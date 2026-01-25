import { t } from 'i18next';
import { Trash } from 'lucide-react';

import quickLogoUrl from '@/assets/img/custom/quick-logo.svg';
import { Button } from '@/components/ui/button';
import { Conversation } from '@/features/chat-v2/conversation';
import { EmptyConversation } from '@/features/chat-v2/empty-conversation';
import { chatHooks } from '@/features/chat-v2/lib/chat-hooks';
import { PromptInput } from '@/features/chat-v2/prompt-input';
import { useChatSessionStore } from '@/features/chat-v2/store';
import { isNil } from '@activepieces/shared';

export function QuickPage() {
  const { session, setSession } = useChatSessionStore();
  const { mutate: deleteChatSession, isPending: deletingChatSession } =
    chatHooks.useDeleteChatSession(setSession);

  const hasConversation = !isNil(session?.conversation) && session.conversation.length > 0;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="flex-1 flex flex-col">
        {hasConversation && (
          <div className="h-16 border-b flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <img src={quickLogoUrl} alt="Quick Logo" className="size-8" />
              <h1 className="text-lg font-semibold">Quick</h1>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                deleteChatSession({
                  currentSession: !isNil(session) ? session : null,
                })
              }
              loading={deletingChatSession}
              disabled={deletingChatSession}
              className="gap-2"
            >
              <Trash className="size-4" />
              {t('Clear Chat')}
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto w-full">
            {hasConversation ? (
              <Conversation
                conversation={session.conversation}
                className="px-6 py-8 space-y-6"
              />
            ) : (
              <EmptyConversation />
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto w-full px-6 py-4">
          <PromptInput placeholder="Ask Quick..." />
        </div>
      </div>
    </div>
  );
}
