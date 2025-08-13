import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { tablesApi } from '@/features/tables/lib/tables-api';
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
import { toast } from '@/components/ui/use-toast';

import { agentsApi, agentRunsApi } from './agents-api';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    return useMutation({
      mutationFn: (request: UpdateAgentRequestBody) =>
        agentsApi.update(id!, request),
      onSuccess: (agent) => {
        updateAgent(agent);
        queryClient.invalidateQueries({ queryKey: ['agents', id] });
        toast({
          title: t('Agent Saved'),
          duration: 1000,
          description: t(
            'Successfully saved the agent settings',
          ),
        });
      },
    });
  },
  useAutomate: (
    tableId: string,
    selectedServerRecords: string[],
    onSuccess?: (runs: AgentRun[]) => void,
  ) => {
    return useMutation({
      mutationFn: () => {
        return tablesApi.automate(tableId, {
          recordIds: selectedServerRecords,
        });
      },
      onError: (error) => {
        console.error('Failed to automate table:', error);
      },
      onSuccess: (runs) => {
        onSuccess?.(runs);
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
