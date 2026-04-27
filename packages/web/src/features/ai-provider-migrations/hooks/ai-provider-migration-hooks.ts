import {
  AIProviderModelType,
  AIProviderName,
  AIProviderWithoutSensitiveData,
  FlowMigration,
  FlowMigrationStatus,
  FlowMigrationType,
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
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
} from '@/components/custom/data-table';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { flowsApi } from '@/features/flows';
import { aiProviderApi } from '@/features/platform-admin';

function useAiProviderMigrations() {
  const [searchParams] = useSearchParams();
  return useQuery({
    queryKey: aiProviderMigrationKeys.list(searchParams.toString()),
    queryFn: () => {
      const cursor = searchParams.get(CURSOR_QUERY_PARAM) ?? undefined;
      const limit = searchParams.get(LIMIT_QUERY_PARAM);
      return aiProviderApi.listMigrations({
        cursor,
        limit: limit ? parseInt(limit) : 10,
      });
    },
    refetchInterval: (query) => {
      const hasRunning = query.state.data?.data.some(
        (m) => m.status === FlowMigrationStatus.RUNNING,
      );
      return hasRunning ? 3000 : false;
    },
  });
}

function useFilteredProviderOptions({
  providers,
  aiProviderModelType,
}: {
  providers: AIProviderWithoutSensitiveData[];
  aiProviderModelType: AIProviderModelType;
}) {
  const providerModelsQueries = useQueries({
    queries: providers.map((p) => ({
      queryKey: aiProviderMigrationKeys.providerModels(p.provider),
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

function useAiProviderModelsForMigrateSelect({
  provider,
  modelType,
}: {
  provider: AIProviderName | undefined;
  modelType: AIProviderModelType;
}) {
  const { data: models, isLoading } = useQuery({
    queryKey: aiProviderMigrationKeys.providerModels(provider ?? ''),
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

function useMigrateFlowsMutation({
  onClose,
  onError,
}: {
  onClose?: () => void;
  onError?: (error: unknown) => void;
} = {}) {
  const queryClient = useQueryClient();
  const [, setSearchParams] = useSearchParams();

  return useMutation({
    mutationFn: (data: MigrateFlowsModelRequest) =>
      aiProviderApi.migrateFlows(data),
    onSuccess: (migration) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete(CURSOR_QUERY_PARAM);
          return next;
        },
        { replace: true },
      );
      queryClient.invalidateQueries({
        queryKey: aiProviderMigrationKeys.all,
      });
      onClose?.();
      toast.success(migrationStartedToast(migration));
    },
    onError,
  });
}

function useMigrationsByIdWithRevertOrigins({
  rows,
}: {
  rows: FlowMigration[] | undefined;
}): Map<string, FlowMigration> {
  const inPageById = useMemo(() => {
    const map = new Map<string, FlowMigration>();
    for (const m of rows ?? []) map.set(m.id, m);
    return map;
  }, [rows]);

  const missingOriginalIds = useMemo(() => {
    const ids = new Set<string>();
    for (const m of rows ?? []) {
      if (
        m.type === FlowMigrationType.AI_PROVIDER_MODEL_REVERT &&
        !inPageById.has(m.params.revertOfMigrationId)
      ) {
        ids.add(m.params.revertOfMigrationId);
      }
    }
    return [...ids];
  }, [rows, inPageById]);

  const fetched = useQueries({
    queries: missingOriginalIds.map((id) => ({
      queryKey: aiProviderMigrationKeys.byId(id),
      queryFn: () => aiProviderApi.getMigration(id),
      staleTime: Infinity,
    })),
  });

  return useMemo(() => {
    const map = new Map<string, FlowMigration>(inPageById);
    for (const q of fetched) {
      if (q.data) map.set(q.data.id, q.data);
    }
    return map;
  }, [inPageById, fetched]);
}

function migrationStartedToast(migration: FlowMigration): string {
  if (migration.type === FlowMigrationType.AI_PROVIDER_MODEL_REVERT) {
    return t('Revert started. Track progress in the migrations table.');
  }
  if (migration.params.dryCheck) {
    return t(
      'Dry-check started. Results will appear in the migrations table when ready.',
    );
  }
  return t('Migration started.');
}

async function fetchAllFlowsForProject(
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

export const flowMigrationHooks = {
  useAiProviderMigrations,
  useFilteredProviderOptions,
  useAiProviderModelsForMigrateSelect,
  useMigrateFlowsMutation,
  useMigrationsByIdWithRevertOrigins,
};

export const aiProviderMigrationKeys = {
  all: ['ai-provider-migrations'] as const,
  list: (searchParams?: string) =>
    ['ai-provider-migrations', searchParams] as const,
  byId: (id: string) => ['flow-migration', id] as const,
  providerModels: (provider: string) =>
    ['ai-models-for-migrate', provider] as const,
  projectFlows: (projectId: string) =>
    ['migration-project-flows', projectId] as const,
};

export const migrationFlowFetchers = {
  fetchAllFlowsForProject,
};
