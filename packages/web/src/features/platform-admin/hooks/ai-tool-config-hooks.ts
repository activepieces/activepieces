import {
  ApEdition,
  AiToolConfigWithoutSensitiveData,
  ApFlagId,
  CreateAiToolConfigRequest,
  UpdateAiToolConfigRequest,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { t } from 'i18next';

import { flagsHooks } from '@/hooks/flags-hooks';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { mutationFeedback } from '@/lib/mutation-feedback';

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
    });
  },
};

export const aiToolConfigMutations = {
  useUpsertAiToolConfig: ({ onSuccess, onError }: MutationOptions) =>
    useMutation({
      mutationFn: (request: CreateAiToolConfigRequest) =>
        aiToolConfigApi.upsert(request),
      onSuccess,
      onError,
    }),
  useUpdateAiToolConfig: ({ onSuccess, onError }: MutationOptions) =>
    useMutation({
      mutationFn: ({
        id,
        request,
      }: {
        id: string;
        request: UpdateAiToolConfigRequest;
      }) => aiToolConfigApi.update(id, request),
      onSuccess,
      onError,
    }),
  useDeleteAiToolConfig: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id: string) => {
        await aiToolConfigApi.delete(id);
        await queryClient.invalidateQueries({ queryKey: aiToolConfigKeys.all });
      },
      onError: (error) => {
        mutationFeedback.error({ error, title: t("Couldn't disconnect") });
      },
    });
  },
  useDisconnectWithUndo: () =>
    useOptimisticMutation<
      AiToolConfigChange,
      AiToolConfigWithoutSensitiveData[]
    >({
      queryKey: aiToolConfigKeys.all,
      scope: 'ai-tool-configs',
      mutationFn: ({ type, config }) =>
        type === 'disconnect'
          ? aiToolConfigApi.delete(config.id)
          : aiToolConfigApi.upsert({
              capability: config.capability,
              provider: config.provider,
              config: config.config ?? undefined,
              enabled: config.enabled,
            }),
      apply: ({ current, vars }) =>
        vars.type === 'disconnect'
          ? current.filter((item) => item.id !== vars.config.id)
          : [
              ...current.filter(
                (item) => item.capability !== vars.config.capability,
              ),
              vars.config,
            ],
      success: ({ vars }) => t('{name} disconnected', { name: vars.name }),
      undo: ({ vars }) => ({ ...vars, type: 'restore' }),
      errorTitle: t("Couldn't disconnect"),
    }),
};

type MutationOptions = {
  onSuccess: () => void;
  onError: (
    error: AxiosError<{ message?: string; params?: { message: string } }>,
  ) => void;
};

export type AiToolConfigChange = {
  type: 'disconnect' | 'restore';
  config: AiToolConfigWithoutSensitiveData;
  name: string;
};
