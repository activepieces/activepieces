import { ApiKeyResponseWithValue } from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiKeyApi } from '../api/api-key-api';

export const apiKeyKeys = {
  all: ['api-keys'] as const,
};

export const apiKeyQueries = {
  useApiKeys: () =>
    useQuery({
      queryKey: apiKeyKeys.all,
      gcTime: 0,
      staleTime: 0,
      queryFn: () => apiKeyApi.list(),
    }),
};

export const apiKeyMutations = {
  useCreateApiKey: ({ onCreate }: { onCreate: () => void }) => {
    return useMutation({
      mutationFn: (request: { displayName: string }) =>
        apiKeyApi.create(request),
      onSuccess: () => {
        onCreate();
      },
    });
  },
  useDeleteApiKey: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (keyId: string) => apiKeyApi.delete(keyId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: apiKeyKeys.all });
      },
    });
  },
};

type CreateApiKeyRequest = {
  displayName: string;
};
