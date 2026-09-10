import { isNil, unique } from '@activepieces/core-utils';
import { Agent, AgentToolType } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronLeft, SearchX, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ConversationsToggle } from '@/app/routes/chat-with-ai/components/conversations-toggle';
import { ConversationList } from '@/app/routes/chat-with-ai/conversation-list';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/custom/empty';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentsAvailable } from '@/features/agents';
import { AgentChatWelcome } from '@/features/agents/agent-chat-welcome';
import { AgentMark } from '@/features/agents/agent-mark';
import { agentsQueries } from '@/features/agents/hooks/agents-hooks';
import { cn } from '@/lib/utils';

import { AgentConfigurePanel } from './configure-panel';

const pieceDisplayName = (pieceName: string): string =>
  pieceName.replace('@activepieces/piece-', '');

const buildCapabilityNote = (agent: Agent): string => {
  const toolNames = unique(
    agent.draft.tools.map((tool) =>
      tool.type === AgentToolType.PIECE
        ? pieceDisplayName(tool.pieceMetadata.pieceName)
        : tool.toolName,
    ),
  );
  if (toolNames.length === 0) {
    return t('{name} has no tools yet, so replies may need review', {
      name: agent.displayName,
    });
  }
  return t('{name} can use {tools} and replies may need review', {
    name: agent.displayName,
    tools: toolNames.join(', '),
  });
};

type OpenPanel = 'conversations' | 'configure' | 'none';

const CONVERSATION_QUERY_PARAM = 'conversation';
const SLIDING_ASIDE =
  'shrink-0 overflow-hidden border-border transition-[width] duration-200 ease-out';

const needsAModel = (agent: Agent): boolean => {
  const running = agent.published ?? agent.draft;
  return isNil(running.provider) || isNil(running.modelName);
};

const AgentEditorSkeleton = () => (
  <div className="flex h-full w-full flex-col">
    <div className="flex h-[60px] shrink-0 items-center gap-[14px] border-b border-border px-6">
      <Skeleton className="size-12 rounded-[14px]" />
      <Skeleton className="h-5 w-[220px]" />
    </div>
    <div className="flex grow items-center justify-center p-6">
      <Skeleton className="h-[360px] w-full max-w-[720px] rounded-[19px]" />
    </div>
  </div>
);
const AgentEditorContent = () => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const agentsAvailable = useAgentsAvailable();
  const [openPanel, setOpenPanel] = useState<OpenPanel>();
  const [configureMounted, setConfigureMounted] = useState(false);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId =
    searchParams.get(CONVERSATION_QUERY_PARAM) ?? undefined;
  const [openedConversationId, setOpenedConversationId] =
    useState(conversationId);
  const [freshConversations, setFreshConversations] = useState(0);

  const writeConversationParam = (nextConversationId: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (nextConversationId === null) {
      next.delete(CONVERSATION_QUERY_PARAM);
    } else {
      next.set(CONVERSATION_QUERY_PARAM, nextConversationId);
    }
    setSearchParams(next, { replace: true });
  };
  const openConversation = (nextConversationId: string) => {
    setOpenedConversationId(nextConversationId);
    writeConversationParam(nextConversationId);
  };
  const startNewConversation = () => {
    setOpenedConversationId(undefined);
    setFreshConversations((count) => count + 1);
    writeConversationParam(null);
  };
  const {
    data: agent,
    isLoading,
    isError,
  } = agentsQueries.useAgent({
    id: agentId ?? '',
    enabled: agentId !== undefined && agentsAvailable,
  });

  const needsModel = agent !== undefined && needsAModel(agent);
  const panel: OpenPanel =
    openPanel ?? (needsModel ? 'configure' : 'conversations');
  const configureOpen = panel === 'configure';
  const conversationsOpen = panel === 'conversations';
  if (configureOpen && !configureMounted) {
    setConfigureMounted(true);
  }

  if (isLoading) {
    return <AgentEditorSkeleton />;
  }

  if (agent === undefined) {
    return (
      <Empty className="h-full">
        <EmptyHeader className="max-w-md">
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>
            {isError
              ? t('That agent could not be loaded')
              : t('That agent is gone')}
          </EmptyTitle>
          <EmptyDescription>
            {isError
              ? t('It may have been deleted, or the connection dropped.')
              : t('It may have been deleted by someone else on the project.')}
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" onClick={() => navigate('/agents')}>
          {t('Back to agents')}
        </Button>
      </Empty>
    );
  }

  return (
    <div className="flex h-full w-full">
      <div className="flex min-w-0 grow flex-col">
        <div className="flex h-[60px] shrink-0 items-center gap-3 border-b border-border px-5">
          <button
            type="button"
            aria-label={t('Back to agents')}
            onClick={() => navigate('/agents')}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </button>
          <AgentMark size="sm" icon={agent.icon} color={agent.color} />
          <div className="flex min-w-0 grow basis-0 flex-col gap-px">
            <span className="truncate text-base font-semibold leading-5 tracking-[-0.01em]">
              {agent.displayName}
            </span>
            <span className="truncate text-xs leading-4 text-muted-foreground">
              {agent.description ?? t('No description yet')}
            </span>
          </div>
          {!configureOpen && (
            <div className="flex min-w-0 shrink items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-[34px] shrink-0 gap-2 rounded-lg px-[13px] animate-in fade-in duration-200"
                onClick={() => setOpenPanel('configure')}
              >
                <Settings2 size={15} />
                {t('Configure')}
              </Button>
            </div>
          )}
        </div>
        <div className="flex min-h-0 grow">
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
                  selectedId={openedConversationId ?? conversationId ?? null}
                  onSelect={openConversation}
                  onNewChat={startNewConversation}
                  onCollapse={() => setOpenPanel('none')}
                />
              </div>
            ) : (
              <div className="flex h-full w-[46px] shrink-0 flex-col items-center pt-3">
                <ConversationsToggle
                  open={false}
                  onClick={() => setOpenPanel('conversations')}
                />
              </div>
            )}
          </aside>
          <div className="flex min-h-0 min-w-0 grow flex-col">
            <AIChatBox
              key={openedConversationId ?? `new-${freshConversations}`}
              incognito={false}
              agentId={agent.id}
              conversationId={openedConversationId ?? null}
              onConversationCreated={writeConversationParam}
              onTurnEnd={() =>
                void queryClient.invalidateQueries({
                  queryKey: ['agents', 'one', agent.id],
                })
              }
              placeholder={t('Ask {name}...', { name: agent.displayName })}
              footerNote={buildCapabilityNote(agent)}
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
        </div>
      </div>
      <aside
        onTransitionEnd={(event) => {
          if (event.propertyName === 'width' && !configureOpen) {
            setConfigureMounted(false);
          }
        }}
        className={cn(
          SLIDING_ASIDE,
          'border-l',
          configureOpen ? 'w-[452px]' : 'w-0',
        )}
      >
        <div className="flex h-full w-[452px] flex-col">
          {configureMounted && (
            <AgentConfigurePanel
              key={agent.id}
              agent={agent}
              onExit={() => setOpenPanel('none')}
            />
          )}
        </div>
      </aside>
    </div>
  );
};

const AgentEditorPage = () => {
  const agentsAvailable = useAgentsAvailable();
  return (
    <LockedFeatureGuard
      locked={!agentsAvailable}
      lockTitle={t('Unlock Agents')}
      lockDescription={t('Build an agent once, then use it in any flow.')}
      featureKey="AGENTS"
    >
      <AgentEditorContent />
    </LockedFeatureGuard>
  );
};

export { AgentEditorPage };
