import { Agent } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ConversationsToggle } from '@/app/routes/chat-with-ai/components/conversations-toggle';
import { ConversationList } from '@/app/routes/chat-with-ai/conversation-list';
import { AgentChatWelcome } from '@/features/agents/agent-chat-welcome';
import { cn } from '@/lib/utils';

type AgentChatViewProps = {
  agent: Agent;
  conversationsOpen: boolean;
  openedConversationId: string | undefined;
  freshConversations: number;
  footerNote: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onCollapseConversations: () => void;
  onExpandConversations: () => void;
  onConversationCreated: (conversationId: string) => void;
};

export const AgentChatView = ({
  agent,
  conversationsOpen,
  openedConversationId,
  freshConversations,
  footerNote,
  onSelectConversation,
  onNewConversation,
  onCollapseConversations,
  onExpandConversations,
  onConversationCreated,
}: AgentChatViewProps) => {
  const queryClient = useQueryClient();

  return (
    <>
      <aside
        className={cn(
          SLIDING_ASIDE,
          'border-r',
          conversationsOpen ? 'w-[220px]' : 'w-[46px]',
        )}
      >
        {conversationsOpen ? (
          <div className="flex h-full w-[220px] flex-col">
            <ConversationList
              agentId={agent.id}
              selectedId={openedConversationId ?? null}
              onSelect={onSelectConversation}
              onNewChat={onNewConversation}
              onCollapse={onCollapseConversations}
            />
          </div>
        ) : (
          <div className="flex h-full w-[46px] shrink-0 flex-col items-center pt-3">
            <ConversationsToggle open={false} onClick={onExpandConversations} />
          </div>
        )}
      </aside>
      <div className="flex min-h-0 min-w-0 grow flex-col">
        <AIChatBox
          key={openedConversationId ?? `new-${freshConversations}`}
          incognito={false}
          agentId={agent.id}
          conversationId={openedConversationId ?? null}
          onConversationCreated={onConversationCreated}
          onTurnEnd={() =>
            void queryClient.invalidateQueries({
              queryKey: ['agents', 'one', agent.id],
            })
          }
          placeholder={t('Ask {name}...', { name: agent.displayName })}
          footerNote={footerNote}
          emptyState={
            <AgentChatWelcome
              displayName={agent.displayName}
              description={agent.description ?? null}
              icon={agent.icon}
              color={agent.color}
            />
          }
        />
      </div>
    </>
  );
};

export const SLIDING_ASIDE =
  'shrink-0 overflow-hidden border-border transition-[width] duration-200 ease-out';
