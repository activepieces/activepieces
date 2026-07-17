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

import { pieceSetsApi } from '../api/piece-sets-api';

export const pieceSetKeys = {
  all: ['piece-sets'] as const,
  one: (id: string) => ['piece-sets', id] as const,
};

export const pieceSetQueries = {
  usePieceSets: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: pieceSetKeys.all,
      queryFn: () => pieceSetsApi.list(),
      enabled: platform.plan.managePiecesEnabled,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    });
  },
  usePieceSet: (id: string) => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: pieceSetKeys.one(id),
      queryFn: () => pieceSetsApi.get(id),
      enabled: platform.plan.managePiecesEnabled && !!id,
      // meta: { showErrorDialog: true },
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
