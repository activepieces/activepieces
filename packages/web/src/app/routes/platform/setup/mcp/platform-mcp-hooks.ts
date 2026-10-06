import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { mutationFeedback } from '@/lib/mutation-feedback';

import { platformMcpApi } from './platform-mcp-api';

const QUERY_KEY = ['platform-mcp-server'];

export const platformMcpHooks = {
  usePlatformMcpServer() {
    return useQuery({
      queryKey: QUERY_KEY,
      queryFn: () => platformMcpApi.get(),
      retry: false,
    });
  },

  useUpdatePlatformMcpTools() {
    const queryClient = useQueryClient();
    return useMutation({
      scope: { id: 'platform-mcp-server-tools' },
      mutationFn: platformMcpApi.update,
      onSuccess: (data) => {
        queryClient.setQueryData(QUERY_KEY, data);
      },
      onError: (error) => {
        mutationFeedback.error({
          error,
          title: t("Couldn't save the tools"),
        });
      },
    });
  },
};
