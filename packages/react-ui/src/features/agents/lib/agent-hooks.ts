import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  ListAgentsQueryParams,
  ListAgentRunsQueryParams,
  CreateAgentRequest,
  AgentRun,
  RunAgentRequestBody,
  EnhaceAgentPrompt,
  UpdateAgentRequestBody,
  PopulatedAgent,
} from '@activepieces/shared';

import { agentsApi, agentRunsApi } from './agents-api';

export const agentHooks = {
  useList: (params?: ListAgentsQueryParams) => {
    return useQuery({
      queryKey: ['agents', params],
      queryFn: () => agentsApi.list(params),
    });
  },

  useGet: (id: string | null | undefined) => {
    return useQuery({
      queryKey: ['agents', id],
      queryFn: () => agentsApi.get(id!),
      enabled: !!id,
    });
  },

  useGetByExternalId: (externalId: string | null | undefined) => {
    return useQuery({
      queryKey: ['agents', externalId],
      queryFn: () => agentsApi.findByExteranlId(externalId!),
      enabled: !!externalId,
    });
  },

  useCreate: () => {
    return useMutation({
      mutationFn: (request: CreateAgentRequest) => agentsApi.create(request),
    });
  },

  useEnhanceAgentPrompt: () => {
    return useMutation({
      mutationFn: (request: EnhaceAgentPrompt) =>
        agentsApi.enhanceAgentPrompt(request),
    });
  },

  useDelete: () => {
    return useMutation({
      mutationFn: (id: string) => agentsApi.delete(id),
    });
  },
  useUpdate: (id: string, updateAgent: (agent: PopulatedAgent) => void) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: UpdateAgentRequestBody) =>
        agentsApi.update(id!, request),
      onSuccess: (agent) => {
        queryClient.invalidateQueries({ queryKey: ['agents', id] });
        updateAgent(agent);
      },
    });
  },
};

export const agentRunHooks = {
  useList: (params: ListAgentRunsQueryParams) => {
    return useQuery({
      queryKey: ['agent-runs', params],
      queryFn: () => agentRunsApi.list(params),
    });
  },
  useGet: (id: string | null | undefined) => {
    return useQuery<AgentRun>({
      queryKey: ['agent-run', id],
      queryFn: () => agentRunsApi.get(id!),
      enabled: !!id,
      refetchInterval: 2000,
    });
  },

  useRun: () => {
    return useMutation({
      mutationFn: (request: RunAgentRequestBody) => agentRunsApi.run(request),
    });
  },
};
