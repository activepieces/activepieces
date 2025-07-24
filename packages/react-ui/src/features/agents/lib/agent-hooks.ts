import { useQuery, useMutation } from '@tanstack/react-query';

import {
  ListAgentsQueryParams,
  CreateAgentRequest,
  UpdateAgentRequestBody,
  AgentRun,
} from '@activepieces/shared';

import { agentsApi, agentRunsApi } from './agents-api';

export const agentHooks = {
  useList: (params?: ListAgentsQueryParams) => {
    return useQuery({
      queryKey: ['agents', params],
      queryFn: () => agentsApi.list(params),
    });
  },

  useGet: (id: string) => {
    return useQuery({
      queryKey: ['agents', id],
      queryFn: () => agentsApi.get(id),
      enabled: !!id,
    });
  },

  useCreate: () => {
    return useMutation({
      mutationFn: (request: CreateAgentRequest) => agentsApi.create(request),
    });
  },

  useUpdate: () => {
    return useMutation({
      mutationFn: ({
        id,
        request,
      }: {
        id: string;
        request: UpdateAgentRequestBody;
      }) => agentsApi.update(id, request),
    });
  },

  useDelete: () => {
    return useMutation({
      mutationFn: (id: string) => agentsApi.delete(id),
    });
  },
};

export const agentRunHooks = {
  useGet: (id: string | null | undefined) => {
    return useQuery<AgentRun>({
      queryKey: ['agent-run', id],
      queryFn: () => agentRunsApi.get(id!),
      enabled: !!id,
      refetchInterval: 2000,
    });
  },
};
