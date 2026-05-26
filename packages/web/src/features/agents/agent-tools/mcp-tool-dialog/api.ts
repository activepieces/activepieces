import {
  AgentMcpTool,
  ValidateAgentMcpToolResponse,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const mcpToolApi = {
  async validateAgentMcpTool(
    projectId: string,
    request: AgentMcpTool,
  ): Promise<ValidateAgentMcpToolResponse> {
    return await api.post<ValidateAgentMcpToolResponse>(
      `/v1/projects/${projectId}/agent-tools/mcp/validate`,
      request,
    );
  },
};
