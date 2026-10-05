import {
  CreatePieceSetRequestBody,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { pieceCacheUtils } from '@/features/pieces';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

import { pieceSetsApi } from '../api/piece-sets-api';

export const pieceSetKeys = {
  all: ['piece-sets'] as const,
  list: ['piece-sets', 'list'] as const,
  one: (id: string) => ['piece-sets', id] as const,
};

export const pieceSetQueries = {
  useAllPieceSets: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: pieceSetKeys.list,
      queryFn: () => pieceSetsApi.listAll(),
      enabled: platform.plan.managePiecesEnabled,
    });
  },
  usePieceSet: (id: string) => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: pieceSetKeys.one(id),
      queryFn: () => pieceSetsApi.get(id),
      enabled: platform.plan.managePiecesEnabled && !!id,
      retry: (failureCount, error) =>
        !isNotFound(error) && failureCount < MAX_RETRIES,
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
        toast.success(t('Policy created'));
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
      },
      onError: () => {
        toast.error(t('Could not create the policy. Try again.'));
      },
    });
  },
  useUpdatePieceSet: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({
        id,
        request,
      }: {
        id: string;
        request: UpdatePieceSetRequestBody;
      }) => pieceSetsApi.update(id, request),
      onSuccess: (_, { id }) => {
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.one(id) });
        pieceCacheUtils.invalidatePieceCaches(queryClient);
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
        toast.success(t('Policy deleted'));
        queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
        pieceCacheUtils.invalidatePieceCaches(queryClient);
        projectCollectionUtils.refetchProjects();
      },
      onError: () => {
        toast.error(t('Could not delete the policy. Try again.'));
      },
    });
  },
  useDuplicatePieceSet: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        pieceSetsApi.duplicate(id, { name }),
      onSuccess: () => {
        toast.success(t('Policy duplicated'));
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

function isNotFound(error: unknown): boolean {
  return api.isError(error) && error.response?.status === 404;
}

const MAX_RETRIES = 3;
