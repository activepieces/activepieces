import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronsLeft, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { chatApi } from '@/features/chat/lib/chat-api';
import { cn } from '@/lib/utils';

type AgentConversationListProps = {
  agentId: string;
  activeConversationId?: string;
  onSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onCollapse: () => void;
};

export const AgentConversationList = ({
  agentId,
  activeConversationId,
  onSelect,
  onNewConversation,
  onCollapse,
}: AgentConversationListProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ['agent-conversations', agentId],
    queryFn: () => chatApi.listConversations({ agentId, limit: 100 }),
  });
  const conversations = data?.data ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2 p-3">
        <Button
          type="button"
          variant="outline"
          className="h-9 grow justify-start gap-2"
          onClick={onNewConversation}
        >
          <Plus size={16} />
          {t('New conversation')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('Collapse conversations')}
          onClick={onCollapse}
        >
          <ChevronsLeft size={16} />
        </Button>
      </div>

      <ScrollArea className="min-h-0 grow">
        <div className="flex flex-col gap-1 px-3 pb-3">
          {isLoading &&
            [0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-9 rounded-md" />
            ))}
          {!isLoading && conversations.length === 0 && (
            <p className="px-2 py-6 text-center text-[13px] leading-4 text-muted-foreground">
              {t('No conversations yet')}
            </p>
          )}
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={cn(
                'truncate rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent',
                conversation.id === activeConversationId && 'bg-sidebar-accent',
              )}
            >
              {conversation.title ?? t('New conversation')}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
