import { useQuery, useMutation } from '@tanstack/react-query';

import {
  ListAgentsQueryParams,
  CreateAgentRequest,
  UpdateAgentRequest,
  RunAgentRequest,
} from '@activepieces/shared';

import { agentsApi } from './agents-api';

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
        request: UpdateAgentRequest;
      }) => agentsApi.update(id, request),
    });
  },

  useDelete: () => {
    return useMutation({
      mutationFn: (id: string) => agentsApi.delete(id),
    });
  },

  useRun: () => {
    return useMutation({
      mutationFn: ({ id, request }: { id: string; request: RunAgentRequest }) =>
        agentsApi.run(id, request),
    });
  },
};
