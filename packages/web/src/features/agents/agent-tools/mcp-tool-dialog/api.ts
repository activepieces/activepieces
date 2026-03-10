import {
  AgentMcpTool,
  ValidateAgentMcpToolResponse,
} from '@activepieces/shared';

import { api } from '@/lib/api';

export const mcpToolApi = {
  async validateAgentMcpTool(
    request: AgentMcpTool,
  ): Promise<ValidateAgentMcpToolResponse> {
    return await api.post<ValidateAgentMcpToolResponse>(
      `/v1/mcp-server/validate-agent-mcp-tool`,
      request,
    );
  },
};
