import {
  ApEdition,
  ApFlagId,
  CreateAiToolConfigRequest,
  UpdateAiToolConfigRequest,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { flagsHooks } from '@/hooks/flags-hooks';

import { aiToolConfigApi } from '../api/ai-tool-config-api';

export const aiToolConfigKeys = {
  all: ['ai-tool-configs'] as const,
};

export const aiToolConfigQueries = {
  useAiToolConfigs: () => {
    const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
    return useQuery({
      queryKey: aiToolConfigKeys.all,
      queryFn: () => aiToolConfigApi.list(),
      enabled: edition !== ApEdition.COMMUNITY,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });
  },
};

export const aiToolConfigMutations = {
  useUpsertAiToolConfig: ({ onSuccess, onError }: UpsertOptions) =>
    useMutation({
      mutationFn: (request: CreateAiToolConfigRequest) =>
        aiToolConfigApi.upsert(request),
      onSuccess,
      onError,
    }),
  useUpdateAiToolConfig: ({ onSuccess }: { onSuccess: () => void }) =>
    useMutation({
      mutationFn: ({
        id,
        request,
      }: {
        id: string;
        request: UpdateAiToolConfigRequest;
      }) => aiToolConfigApi.update(id, request),
      onSuccess,
    }),
  useDeleteAiToolConfig: ({ onSuccess }: { onSuccess: () => void }) =>
    useMutation({
      mutationFn: (id: string) => aiToolConfigApi.delete(id),
      onSuccess,
    }),
};

type UpsertOptions = {
  onSuccess: () => void;
  onError: (
    error: AxiosError<{ message?: string; params?: { message: string } }>,
  ) => void;
};
