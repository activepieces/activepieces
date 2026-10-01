import { isNil, unique } from '@activepieces/core-utils';
import { Agent, AgentToolType } from '@activepieces/shared';
import { t } from 'i18next';
import {
  ChevronLeft,
  History,
  MessageSquare,
  SearchX,
  Settings2,
} from 'lucide-react';
import { useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';

import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgentsAvailable } from '@/features/agents';
import { AgentMark } from '@/features/agents/agent-mark';
import { agentsQueries } from '@/features/agents/hooks/agents-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';

import { AgentChatView } from './agent-chat-view';
import { AgentConfigurePanel } from './configure-panel';
import { AgentRuns } from './runs';

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
const RUNS_TAB = 'runs';
const CHAT_TAB = 'chat';
const SLIDING_ASIDE =
  'shrink-0 overflow-hidden border-gray-6 transition-[width] duration-200';

const needsAModel = (agent: Agent): boolean => {
  const running = agent.published ?? agent.draft;
  return isNil(running.provider) || isNil(running.modelName);
};

const AgentEditorSkeleton = () => (
  <div className="flex h-full w-full flex-col">
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-6 px-4">
      <Skeleton className="size-8 rounded-xl" />
      <Skeleton className="h-5 w-56" />
    </div>
    <div className="flex grow items-center justify-center p-6">
      <Skeleton className="h-96 w-full max-w-3xl rounded-2xl" />
    </div>
  </div>
);
const AgentEditorContent = () => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const { pathname } = useLocation();
  const agentsAvailable = useAgentsAvailable();
  const [openPanel, setOpenPanel] = useState<OpenPanel>();
  const [configureMounted, setConfigureMounted] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId =
    searchParams.get(CONVERSATION_QUERY_PARAM) ?? undefined;
  const [openedConversationId, setOpenedConversationId] =
    useState(conversationId);
  const [chatSessionKey, setChatSessionKey] = useState(
    () => conversationId ?? 'new',
  );

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
    setChatSessionKey(nextConversationId);
    writeConversationParam(nextConversationId);
  };
  const runsOpen = pathname.endsWith(`/${RUNS_TAB}`);
  const showTab = (nextTab: string) => {
    const suffix = nextTab === RUNS_TAB ? `/${RUNS_TAB}` : '';
    const carried = new URLSearchParams();
    const openedConversation =
      openedConversationId ?? searchParams.get(CONVERSATION_QUERY_PARAM);
    if (!isNil(openedConversation)) {
      carried.set(CONVERSATION_QUERY_PARAM, openedConversation);
    }
    const query = carried.toString();
    navigate(
      authenticationSession.appendProjectRoutePrefix(
        `/agents/${agentId}${suffix}${query.length > 0 ? `?${query}` : ''}`,
      ),
    );
  };
  const startNewConversation = () => {
    setOpenedConversationId(undefined);
    setChatSessionKey(`new-${Date.now()}`);
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
        <EmptyContent>
          <Button variant="outline" onClick={() => navigate('/agents')}>
            {t('Back to agents')}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex h-full w-full">
      <div className="flex min-w-0 grow flex-col">
        <div
          className={cn(
            'flex h-14 shrink-0 items-center gap-3 px-4',
            !runsOpen && 'border-b border-gray-6',
          )}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('Back to agents')}
            onClick={() => navigate('/agents')}
            className="shrink-0 text-gray-11"
          >
            <ChevronLeft />
          </Button>
          <AgentMark size="sm" icon={agent.icon} color={agent.color} />
          <div className="flex min-w-0 grow basis-0 flex-col">
            <span className="truncate text-sm font-semibold">
              {agent.displayName}
            </span>
            <span className="truncate text-xs text-gray-11">
              {agent.description ?? t('No description yet')}
            </span>
          </div>
          <Tabs
            value={runsOpen ? RUNS_TAB : CHAT_TAB}
            onValueChange={showTab}
            className="h-full self-stretch"
          >
            <TabsList variant="line" className="h-full gap-1">
              <TabsTrigger value={CHAT_TAB} className="h-full rounded-none">
                <MessageSquare />
                {t('Chat')}
              </TabsTrigger>
              <TabsTrigger value={RUNS_TAB} className="h-full rounded-none">
                <History />
                {t('Runs')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {!configureOpen && (
            <div className="flex min-w-0 shrink items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="shrink-0 animate-in fade-in duration-200"
                onClick={() => setOpenPanel('configure')}
              >
                <Settings2 />
                {t('Configure')}
              </Button>
            </div>
          )}
        </div>
        <div className="flex min-h-0 grow">
          {runsOpen ? (
            <AgentRuns agentId={agent.id} />
          ) : (
            <AgentChatView
              agent={agent}
              conversationsOpen={conversationsOpen}
              openedConversationId={openedConversationId ?? conversationId}
              chatSessionKey={chatSessionKey}
              footerNote={buildCapabilityNote(agent)}
              onSelectConversation={openConversation}
              onNewConversation={startNewConversation}
              onCollapseConversations={() => setOpenPanel('none')}
              onExpandConversations={() => setOpenPanel('conversations')}
              onConversationCreated={writeConversationParam}
            />
          )}
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
      featureKey="AGENTS"
      locked={!agentsAvailable}
      lockTitle={t('Agents')}
      lockDescription={t('Build an agent once, then use it in any flow.')}
    >
      <AgentEditorContent />
    </LockedFeatureGuard>
  );
};

export { AgentEditorPage };
