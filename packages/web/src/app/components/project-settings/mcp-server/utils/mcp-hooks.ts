import { useQuery } from '@tanstack/react-query';

import { mcpApi } from './mcp-api';

export const MCP_SERVER_QUERY_KEY = ['mcp-server'];

export const mcpHooks = {
  useMcpServer(options: { enabled?: boolean } = {}) {
    return useQuery({
      queryKey: MCP_SERVER_QUERY_KEY,
      queryFn: () => mcpApi.get(),
      retry: false,
      enabled: options.enabled ?? true,
    });
  },
};
