import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { platformMcpApi } from './platform-mcp-api';

const QUERY_KEY = ['platform-mcp-server'];

export const platformMcpHooks = {
  usePlatformMcpServer() {
    return useQuery({
      queryKey: QUERY_KEY,
      queryFn: () => platformMcpApi.get(),
      retry: false,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });
  },

  useUpdatePlatformMcpTools() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: platformMcpApi.update,
      onSuccess: (data) => {
        queryClient.setQueryData(QUERY_KEY, data);
      },
    });
  },
};
