import {
  Agent,
  AgentListSort,
  ApFlagId,
  CreateAgentRequest,
  DraftAgentRequest,
  Permission,
  UpdateAgentRequest,
} from '@activepieces/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { internalErrorToast } from '@/components/ui/sonner';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { agentsApi } from '../api/agents';

const AGENTS_KEY = 'agents';

export const useAgentsEnabled = (): boolean => {
  const { data: agentsEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.AGENTS_ENABLED,
  );
  return agentsEnabled === true;
};

export const useAgentsAvailable = (): boolean => {
  const releaseEnabled = useAgentsEnabled();
  const { platform } = platformHooks.useCurrentPlatform();
  return releaseEnabled && platform.plan.agentsEnabled;
};

export const useAgentsNavVisible = (): boolean => {
  const available = useAgentsAvailable();
  const { checkAccess } = useAuthorization();
  return available && checkAccess(Permission.READ_AGENT);
};

const AGENTS_PAGE_SIZE = 100;

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
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
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
      meta: { showErrorDialog: !includeUsage, loadSubsetOptions: {} },
    }),
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
  useDraftAgent: () =>
    useMutation({
      mutationFn: (request: DraftAgentRequest) => agentsApi.draft(request),
      onError: () => undefined,
    }),
};
