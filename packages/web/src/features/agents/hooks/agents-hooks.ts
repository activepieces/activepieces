import {
  Agent,
  ApFlagId,
  CreateAgentRequest,
  DraftAgentRequest,
  Permission,
  UpdateAgentRequest,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { internalErrorToast } from '@/components/ui/sonner';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

import { agentsApi } from '../api/agents';

const AGENTS_KEY = 'agents';
const AGENT_TEMPLATES_KEY = 'agent-templates';

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

export const agentsQueries = {
  useAgents: ({
    projectId,
    enabled = true,
  }: {
    projectId?: string;
    enabled?: boolean;
  }) =>
    useQuery({
      queryKey: [AGENTS_KEY, projectId ?? 'all'],
      queryFn: () => agentsApi.listAll({ ...(projectId ? { projectId } : {}) }),
      enabled,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    }),
  useAgent: ({ id, enabled = true }: { id: string; enabled?: boolean }) =>
    useQuery({
      queryKey: [AGENTS_KEY, 'one', id],
      queryFn: () => agentsApi.get(id),
      enabled,
    }),
  useAgentTemplates: () =>
    useQuery({
      queryKey: [AGENT_TEMPLATES_KEY],
      queryFn: () => agentsApi.templates(),
      staleTime: Infinity,
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
