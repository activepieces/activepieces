import {
  PieceSet,
  pieceSetConfigUtil,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';
import {
  QueryClient,
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { z } from 'zod';

import { pieceCacheUtils } from '@/features/pieces';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { pieceSetsApi } from '../api/piece-sets-api';

export const pieceSetKeys = {
  all: ['piece-sets'] as const,
  page: (cursor: string | undefined, limit: number | undefined) =>
    ['piece-sets', 'page', cursor ?? null, limit ?? null] as const,
  one: (id: string) => ['piece-sets', id] as const,
  project: (projectId: string) => ['piece-sets', 'project', projectId] as const,
  update: ['piece-sets', 'update'] as const,
};

export const pieceSetQueryOptions = {
  project: (projectId: string) => ({
    queryKey: pieceSetKeys.project(projectId),
    queryFn: () => pieceSetsApi.getForProject(projectId),
  }),
};

export const pieceSetQueries = {
  usePieceSets: ({
    cursor,
    limit,
  }: { cursor?: string; limit?: number } = {}) => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: pieceSetKeys.page(cursor, limit),
      queryFn: () => pieceSetsApi.list({ cursor, limit }),
      enabled: platform.plan.managePiecesEnabled,
    });
  },
  usePieceSet: (id: string) => {
    const { platform } = platformHooks.useCurrentPlatform();
    const query = useQuery({
      queryKey: pieceSetKeys.one(id),
      queryFn: () => pieceSetsApi.get(id),
      enabled: platform.plan.managePiecesEnabled && !!id,
    });
    const pendingUpdates = useMutationState({
      filters: { mutationKey: pieceSetKeys.update, status: 'pending' },
      select: (mutation) =>
        UpdatePieceSetVariables.safeParse(mutation.state.variables),
    });
    const pendingRequests = pendingUpdates.flatMap((parsed) =>
      parsed.success && parsed.data.id === id ? [parsed.data.request] : [],
    );
    const data = query.data
      ? applyPendingRequests({ pieceSet: query.data, pendingRequests })
      : undefined;
    return { ...query, data };
  },
  useProjectPieceSet: (projectId: string | null) => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      ...pieceSetQueryOptions.project(projectId ?? ''),
      enabled: platform.plan.managePiecesEnabled && !!projectId,
    });
  },
};

export const pieceSetMutations = {
  useUpdatePieceSet: ({ announce = true }: { announce?: boolean } = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationKey: pieceSetKeys.update,
      scope: { id: 'piece-set-update' },
      mutationFn: ({
        id,
        request,
      }: {
        id: string;
        request: UpdatePieceSetRequestBody;
      }) => pieceSetsApi.update(id, request),
      onSuccess: async (_, { id }) => {
        pieceCacheUtils.invalidatePieceCaches(queryClient);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: pieceSetKeys.all }),
          queryClient.invalidateQueries({ queryKey: pieceSetKeys.one(id) }),
        ]);
        if (announce) {
          mutationFeedback.success(t('Changes saved'));
        }
      },
      onError: (error) => {
        mutationFeedback.error({ error, title: t("Couldn't save changes") });
      },
    });
  },
};

export const pieceSetCacheUtils = {
  refreshAfterProjectChange: async ({
    queryClient,
    id,
  }: {
    queryClient: QueryClient;
    id?: string;
  }) => {
    pieceCacheUtils.invalidatePieceCaches(queryClient);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: pieceSetKeys.all }),
      id === undefined
        ? Promise.resolve()
        : queryClient.invalidateQueries({ queryKey: pieceSetKeys.one(id) }),
      queryClient.invalidateQueries({ queryKey: ['projects-for-platforms'] }),
      projectCollectionUtils.refetchProjects(),
    ]);
  },
};

function applyPendingRequests({
  pieceSet,
  pendingRequests,
}: {
  pieceSet: PieceSet;
  pendingRequests: UpdatePieceSetRequestBody[];
}): PieceSet {
  return pendingRequests.reduce<PieceSet>(
    (current, request) => ({
      ...current,
      name: request.name ?? current.name,
      config: pieceSetConfigUtil.applyUpdate({
        current: current.config,
        request,
      }),
    }),
    pieceSet,
  );
}

const UpdatePieceSetVariables = z.object({
  id: z.string(),
  request: UpdatePieceSetRequestBody,
});
