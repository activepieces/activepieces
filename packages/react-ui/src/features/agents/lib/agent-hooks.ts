import { useQuery, useMutation } from '@tanstack/react-query';

import {
  ListAgentRunsQueryParams,
  CreateAgentRequest,
  AgentRun,
  RunAgentRequestBody,
  EnhaceAgentPrompt,
} from '@activepieces/shared';

import { agentsApi, agentRunsApi } from './agents-api';

export const agentHooks = {
  useGet: (id: string | null | undefined) => {
    return useQuery({
      queryKey: ['agents', id],
      queryFn: () => agentsApi.get(id!),
      enabled: !!id,
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
