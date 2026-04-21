import {
  AgentMcpTool,
  ValidateAgentMcpToolResponse,
} from '@activepieces/shared';

import { validateAgentMcpTool } from './validate-mcp-tool';

export const mcpToolApi = {
  async validateAgentMcpTool(
    request: AgentMcpTool,
  ): Promise<ValidateAgentMcpToolResponse> {
    return validateAgentMcpTool(request);
  },
};
