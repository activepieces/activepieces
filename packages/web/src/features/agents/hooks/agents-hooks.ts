import { isNil } from '@activepieces/core-utils';
import {
  Agent,
  AgentConversationStatus,
  AgentListSort,
  CreateAgentRequest,
  DraftAgentRequest,
  MoveAgentRequest,
  Permission,
  UpdateAgentRequest,
} from '@activepieces/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import {
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';
import { internalErrorToast } from '@/components/ui/sonner';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { agentsApi } from '../api/agents';

const AGENTS_KEY = 'agents';

export const useAgentsAvailable = (): boolean => {
  const { platform } = platformHooks.useCurrentPlatform();
  return platform.plan.agentsEnabled;
};

export const useAgentsNavVisible = (): boolean => {
  const available = useAgentsAvailable();
  const { checkAccess } = useAuthorization();
  return available && checkAccess(Permission.READ_AGENT);
};

const AGENTS_PAGE_SIZE = 100;
const AGENT_RUNS_ACTIVE_POLL_MS = 5 * 1000;
const AGENT_RUNS_IDLE_POLL_MS = 15 * 1000;

export const agentsQueries = {
  useAgents: ({
    projectId,
    search,
    sort,
    enabled = true,
  }: {
    projectId?: string;
    search?: string;
    sort?: AgentListSort;
    enabled?: boolean;
  }) =>
    useInfiniteQuery({
      queryKey: [
        AGENTS_KEY,
        projectId ?? 'all',
        search ?? '',
        sort ?? 'default',
      ],
      queryFn: ({ pageParam }) =>
        agentsApi.list({
          limit: AGENTS_PAGE_SIZE,
          ...(projectId ? { projectId } : {}),
          ...(search ? { search } : {}),
          ...(sort ? { sort } : {}),
          ...(pageParam ? { cursor: pageParam } : {}),
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.next ?? undefined,
      enabled,
    }),
  useMovePreview: ({
    id,
    targetProjectId,
    enabled,
  }: {
    id: string;
    targetProjectId: string | null;
    enabled: boolean;
  }) =>
    useQuery({
      queryKey: [AGENTS_KEY, 'move-preview', id, targetProjectId],
      queryFn: () => agentsApi.movePreview(id, targetProjectId ?? ''),
      enabled: enabled && targetProjectId !== null,
    }),
  useAgent: ({
    id,
    enabled = true,
    includeUsage = false,
  }: {
    id: string;
    enabled?: boolean;
    includeUsage?: boolean;
  }) =>
    useQuery({
      queryKey: [AGENTS_KEY, 'one', id, includeUsage ? 'usage' : 'plain'],
      queryFn: () => agentsApi.get(id, { includeUsage }),
      enabled,
    }),
  useAgentRun: ({
    runId,
    projectId,
  }: {
    runId: string | null;
    projectId: string;
  }) =>
    useQuery({
      queryKey: [AGENTS_KEY, 'run', runId],
      enabled: !isNil(runId),
      queryFn: () => agentsApi.getRun(runId ?? '', projectId),
    }),
  useAgentRuns: ({
    agentId,
    projectId,
  }: {
    agentId: string;
    projectId: string;
  }) => {
    const [searchParams] = useSearchParams();
    const cursor = searchParams.get(CURSOR_QUERY_PARAM);
    const limit = searchParams.get(LIMIT_QUERY_PARAM);
    return useQuery({
      queryKey: [AGENTS_KEY, 'runs', agentId, cursor, limit],
      queryFn: () =>
        agentsApi.listRuns({
          agentId,
          projectId,
          cursor: cursor ?? undefined,
          limit: limit === null ? undefined : parseInt(limit),
        }),
      refetchInterval: (query) => {
        const stillRunning = query.state.data?.data.some(
          (run) => run.status === AgentConversationStatus.STREAMING,
        );
        return stillRunning === true
          ? AGENT_RUNS_ACTIVE_POLL_MS
          : AGENT_RUNS_IDLE_POLL_MS;
      },
    });
  },
};

export const agentsMutations = {
  useCreateAgent: ({
    onSuccess,
    onError,
  }: {
    onSuccess?: (agent: Agent) => void;
    onError?: (error: Error) => void;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: CreateAgentRequest) => agentsApi.create(request),
      onSuccess: async (agent) => {
        await queryClient.invalidateQueries({ queryKey: [AGENTS_KEY] });
        onSuccess?.(agent);
      },
      onError: onError ?? internalErrorToast,
    });
  },
  useUpdateAgent: ({ id }: { id: string }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: UpdateAgentRequest) =>
        agentsApi.update(id, request),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [AGENTS_KEY] });
      },
      onError: internalErrorToast,
    });
  },
  useMoveAgent: ({
    id,
    onSuccess,
  }: {
    id: string;
    onSuccess?: (agent: Agent) => void;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: MoveAgentRequest) => agentsApi.move(id, request),
      onSuccess: async (agent) => {
        await queryClient.invalidateQueries({ queryKey: [AGENTS_KEY] });
        onSuccess?.(agent);
      },
    });
  },
  useDraftAgent: () =>
    useMutation({
      mutationFn: (request: DraftAgentRequest) => agentsApi.draft(request),
      onError: () => undefined,
    }),
};
