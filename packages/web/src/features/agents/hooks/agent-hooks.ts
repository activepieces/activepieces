import {
  AgentMcpTool,
  ValidateAgentMcpToolResponse,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { flowsApi } from '@/features/flows/api/flows-api';
import { authenticationSession } from '@/lib/authentication-session';

import { mcpToolApi } from '../agent-tools/mcp-tool-dialog/api';

export const agentQueries = {
  useFlowsForAgent: () => {
    const projectId = authenticationSession.getProjectId();
    return useQuery({
      queryKey: ['flows', projectId],
      queryFn: async () => {
        return await flowsApi.list({
          cursor: undefined,
          limit: 1000,
          projectId: projectId!,
        });
      },
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });
  },
};

export const agentMutations = {
  useValidateMcpTool: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (data: ValidateAgentMcpToolResponse) => void;
    onError: (error: Error) => void;
  }) => {
    return useMutation<
      ValidateAgentMcpToolResponse,
      Error,
      { tool: AgentMcpTool }
    >({
      mutationFn: ({ tool }) => mcpToolApi.validateAgentMcpTool(tool),
      onSuccess,
      onError,
    });
  },
};
