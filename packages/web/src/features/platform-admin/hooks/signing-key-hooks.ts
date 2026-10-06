import {
  AddSigningKeyRequestBody,
  AddSigningKeyResponse,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { platformHooks } from '@/hooks/platform-hooks';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { signingKeyApi } from '../api/signing-key-api';

export const signingKeyKeys = {
  all: ['signing-keys'] as const,
};

export const signingKeyQueries = {
  useSigningKeys: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: signingKeyKeys.all,
      gcTime: 0,
      staleTime: 0,
      queryFn: () => signingKeyApi.list(),
      enabled: platform.plan.embeddingEnabled,
    });
  },
};

export const signingKeyMutations = {
  useCreateSigningKey: ({
    onSuccess,
    onError,
  }: {
    onSuccess: (key: AddSigningKeyResponse) => Promise<unknown> | void;
    onError?: (error: Error) => void;
  }) => {
    return useMutation({
      mutationFn: (request: AddSigningKeyRequestBody) =>
        signingKeyApi.create(request),
      onSuccess,
      onError,
    });
  },
  useDeleteSigningKey: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (keyId: string) => {
        await signingKeyApi.delete(keyId);
        await queryClient.invalidateQueries({ queryKey: signingKeyKeys.all });
      },
      onError: (error) => {
        mutationFeedback.error({
          error,
          title: t("Couldn't delete the signing key"),
        });
      },
    });
  },
};
