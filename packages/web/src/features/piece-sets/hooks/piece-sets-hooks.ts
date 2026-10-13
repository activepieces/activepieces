import {
  CreatePieceSetRequestBody,
  PieceSet,
  pieceSetConfigUtil,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';
import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { pieceCacheUtils } from '@/features/pieces';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';

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
  useCreatePieceSet: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: CreatePieceSetRequestBody) =>
        pieceSetsApi.create(request),
      onSuccess: () => {
        toast.success(t('Piece set created'));
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
      },
      onError: () => {
        toast.error(t('Failed to create piece set. Please try again.'));
      },
    });
  },
  useUpdatePieceSet: () => {
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
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
      },
      onError: () => {
        toast.error(t('Failed to save changes. Please try again.'));
      },
    });
  },
  useDeletePieceSet: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => pieceSetsApi.delete(id),
      onSuccess: () => {
        toast.success(t('Piece set deleted'));
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
        pieceCacheUtils.invalidatePieceCaches(queryClient);
        projectCollectionUtils.refetchProjects();
      },
      onError: () => {
        toast.error(t('Failed to delete piece set. Please try again.'));
      },
    });
  },
  useDuplicatePieceSet: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        pieceSetsApi.duplicate(id, { name }),
      onSuccess: () => {
        toast.success(t('Piece set duplicated'));
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
      },
    });
  },
  useAssignProjects: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, projectIds }: { id: string; projectIds: string[] }) =>
        pieceSetsApi.assignProjects(id, { projectIds }),
      onSuccess: (_, { id }) => {
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.one(id) });
        queryClient.invalidateQueries({ queryKey: ['projects-for-platforms'] });
        pieceCacheUtils.invalidatePieceCaches(queryClient);
        projectCollectionUtils.refetchProjects();
      },
    });
  },
  useRemoveProject: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
        pieceSetsApi.removeProject(id, projectId),
      onSuccess: (_, { id }) => {
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.one(id) });
        queryClient.invalidateQueries({ queryKey: ['projects-for-platforms'] });
        pieceCacheUtils.invalidatePieceCaches(queryClient);
        projectCollectionUtils.refetchProjects();
      },
    });
  },
  useBulkRemoveProjects: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, projectIds }: { id: string; projectIds: string[] }) =>
        Promise.all(
          projectIds.map((projectId) =>
            pieceSetsApi.removeProject(id, projectId),
          ),
        ),
      onSuccess: (_, { id }) => {
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.one(id) });
        queryClient.invalidateQueries({ queryKey: ['projects-for-platforms'] });
        pieceCacheUtils.invalidatePieceCaches(queryClient);
        projectCollectionUtils.refetchProjects();
      },
    });
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
