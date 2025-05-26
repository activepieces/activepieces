import { api } from '@/lib/api';
import {
  McpToolHistory,
  ListMcpToolHistoryRequest,
  SeekPage,
} from '@activepieces/shared';

export const mcpToolHistoryApi = {
  async list(
    request: ListMcpToolHistoryRequest,
  ): Promise<SeekPage<McpToolHistory>> {
    return await api.get<SeekPage<McpToolHistory>>(
      `/v1/mcp-tools-history`,
      request,
    );
  },
};
