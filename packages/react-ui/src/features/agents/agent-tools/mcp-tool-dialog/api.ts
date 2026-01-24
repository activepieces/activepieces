import { api } from '@/lib/api';
import {
  AgentMcpTool,
  ValidateAgentMcpToolResponse,
} from '@activepieces/shared';

export const mcpToolApi = {
  async validateAgentMcpTool(
    projectId: string,
    request: AgentMcpTool,
  ): Promise<ValidateAgentMcpToolResponse> {
    return await api.post<ValidateAgentMcpToolResponse>(
      `/v1/projects/${projectId}/mcp-server/validate-agent-mcp-tool`,
      request,
    );
  },
};
