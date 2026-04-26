import {
  AIProviderModelType,
  AIProviderName,
  AIProviderWithoutSensitiveData,
  FlowMigrationStatus,
  MigrateFlowsModelRequest,
  PopulatedFlow,
} from '@activepieces/shared';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useMemo } from 'react';
import { toast } from 'sonner';

import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { flowsApi } from '@/features/flows';
import { aiProviderApi } from '@/features/platform-admin';

export const AI_PROVIDER_MIGRATE_MODELS_QUERY_KEY_PREFIX =
  'ai-models-for-migrate' as const;

export function aiProviderMigrateModelsQueryKey(provider: string) {
  return [AI_PROVIDER_MIGRATE_MODELS_QUERY_KEY_PREFIX, provider] as const;
}

export const aiProviderMigrationKeys = {
  list: (cursor?: string) => ['ai-provider-migrations', cursor] as const,
};

export function useAiProviderMigrations({
  cursor,
  limit = 10,
}: {
  cursor?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: aiProviderMigrationKeys.list(cursor),
    queryFn: () => aiProviderApi.listMigrations({ cursor, limit }),
    refetchInterval: (query) => {
      const hasRunning = query.state.data?.data.some(
        (m) => m.status === FlowMigrationStatus.RUNNING,
      );
      return hasRunning ? 3000 : false;
    },
  });
}

export function useFilteredProviderOptions({
  providers,
  aiProviderModelType,
}: {
  providers: AIProviderWithoutSensitiveData[];
  aiProviderModelType: AIProviderModelType;
}) {
  const providerModelsQueries = useQueries({
    queries: providers.map((p) => ({
      queryKey: aiProviderMigrateModelsQueryKey(p.provider),
      queryFn: () => aiProviderApi.listModelsForProvider(p.provider),
    })),
  });

  return useMemo(
    () =>
      providers
        .filter((p, idx) => {
          const models = providerModelsQueries[idx]?.data;
          return !models || models.some((m) => m.type === aiProviderModelType);
        })
        .map((p) => ({
          value: p.provider,
          label: p.name,
          logoUrl: SUPPORTED_AI_PROVIDERS.find(
            (sp) => sp.provider === p.provider,
          )?.logoUrl,
        })),
    [providers, providerModelsQueries, aiProviderModelType],
  );
}

export function useAiProviderModelsForMigrateSelect({
  provider,
  modelType,
}: {
  provider: AIProviderName | undefined;
  modelType: AIProviderModelType;
}) {
  const { data: models, isLoading } = useQuery({
    queryKey: aiProviderMigrateModelsQueryKey(provider ?? ''),
    queryFn: () => aiProviderApi.listModelsForProvider(provider!),
    enabled: !!provider,
  });

  const options = useMemo(
    () =>
      (models ?? [])
        .filter((m) => m.type === modelType)
        .map((m) => ({ value: m.id, label: m.name })),
    [models, modelType],
  );

  return { options, isLoading };
}

export const MIGRATION_PROJECT_FLOWS_QUERY_KEY_PREFIX =
  'migration-project-flows' as const;

export function migrationProjectFlowsQueryKey(projectId: string) {
  return [MIGRATION_PROJECT_FLOWS_QUERY_KEY_PREFIX, projectId] as const;
}

export async function fetchAllFlowsForProject(
  projectId: string,
): Promise<PopulatedFlow[]> {
  const PAGE_SIZE = 1000;
  const all: PopulatedFlow[] = [];
  let cursor: string | undefined = undefined;
  do {
    const page = await flowsApi.list({ projectId, cursor, limit: PAGE_SIZE });
    all.push(...page.data);
    cursor = page.next ?? undefined;
  } while (cursor);
  return all;
}

export function useMigrateFlowsMutation({
  onClose,
  onError,
}: {
  onClose: () => void;
  onError: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MigrateFlowsModelRequest) =>
      aiProviderApi.migrateFlows(data),
    onSuccess: (migration) => {
      queryClient.invalidateQueries({
        queryKey: aiProviderMigrationKeys.list(),
      });
      onClose();
      toast.success(
        migration.params.dryCheck
          ? t(
              'Dry-check started. Results will appear in the migrations table when ready.',
            )
          : t('Migration started.'),
      );
    },
    onError,
  });
}
