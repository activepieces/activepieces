import {
  AddSigningKeyRequestBody,
  AddSigningKeyResponse,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { signingKeyApi } from '../api/signing-key-api';

export const signingKeyKeys = {
  all: ['signing-keys'] as const,
};

export const signingKeyQueries = {
  useSigningKeys: () =>
    useQuery({
      queryKey: signingKeyKeys.all,
      gcTime: 0,
      staleTime: 0,
      queryFn: () => signingKeyApi.list(),
    }),
};

export const signingKeyMutations = {
  useCreateSigningKey: ({
    onSuccess,
  }: {
    onSuccess: (key: AddSigningKeyResponse) => void;
  }) => {
    return useMutation({
      mutationFn: (request: AddSigningKeyRequestBody) =>
        signingKeyApi.create(request),
      onSuccess,
    });
  },
};
