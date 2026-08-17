import {
  Agent,
  CreateAgentRequest,
  DraftAgentRequest,
  UpdateAgentRequest,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { internalErrorToast } from '@/components/ui/sonner';

import { agentsApi } from '../api/agents';

const AGENTS_KEY = 'agents';
const AGENT_TEMPLATES_KEY = 'agent-templates';

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
  usePublishAgent: ({ id }: { id: string }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: () => agentsApi.publish(id),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [AGENTS_KEY] });
        toast(t('Agent published'));
      },
      onError: internalErrorToast,
    });
  },
  useUnpublishAgent: ({ id }: { id: string }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: () => agentsApi.unpublish(id),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [AGENTS_KEY] });
        toast(t('Agent unpublished'));
      },
      onError: internalErrorToast,
    });
  },
  useDeleteAgent: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => agentsApi.delete(id),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: [AGENTS_KEY] });
        toast(t('Agent deleted'));
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
