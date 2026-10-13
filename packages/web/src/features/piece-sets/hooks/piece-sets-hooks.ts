import {
  CreatePieceSetRequestBody,
  PieceSet,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useRef } from 'react';

import { pieceCacheUtils } from '@/features/pieces';
import { projectCollectionUtils, projectQueryKeys } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { pieceSetsApi } from '../api/piece-sets-api';
import {
  ChangePieceSet,
  PieceSetChange,
  pieceSetChanges,
} from '../utils/piece-set-changes';
import { pieceSetTerms } from '../utils/piece-set-terms';

export const pieceSetKeys = {
  all: ['piece-sets'] as const,
  list: ['piece-sets', 'list'] as const,
  one: (id: string) => ['piece-sets', id] as const,
  projects: ['piece-sets', 'project'] as const,
  project: (projectId: string) => ['piece-sets', 'project', projectId] as const,
};

export const pieceSetQueryOptions = {
  project: (projectId: string) => ({
    queryKey: pieceSetKeys.project(projectId),
    queryFn: () => pieceSetsApi.getForProject(projectId),
  }),
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
  useProjectPieceSet: (projectId: string | null) => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      ...pieceSetQueryOptions.project(projectId ?? ''),
      enabled: platform.plan.managePiecesEnabled && !!projectId,
    });
  },
};

export const pieceSetMutations = {
  useCreatePieceSet: ({ onError }: FormErrorHandler) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: CreatePieceSetRequestBody) =>
        pieceSetsApi.create(request),
      onSuccess: () => {
        mutationFeedback.success(t('{Term} created', pieceSetTerms.get()));
        queryClient
          .invalidateQueries({ queryKey: pieceSetKeys.all })
          .catch(() => undefined);
      },
      onError,
    });
  },
  useUpdatePieceSet: ({ onError }: FormErrorHandler) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({
        id,
        request,
      }: {
        id: string;
        request: UpdatePieceSetRequestBody;
      }) => pieceSetsApi.update(id, request),
      onSuccess: (updated) => {
        queryClient.setQueryData(pieceSetKeys.one(updated.id), updated);
        mutationFeedback.success(t('Changes saved'));
        queryClient
          .invalidateQueries({ queryKey: pieceSetKeys.all })
          .catch(() => undefined);
      },
      onError,
    });
  },
  useChangePieceSet: (id: string) => {
    const queryClient = useQueryClient();
    const queryKey = pieceSetKeys.one(id);
    const mutationKey = [...queryKey, 'change'];
    const latestChange = useRef(0);
    const isLastPending = () => queryClient.isMutating({ mutationKey }) <= 1;
    const mutation = useMutation({
      mutationKey,
      scope: { id: `piece-set-${id}` },
      mutationFn: async ({ change }: ChangeVariables) => {
        const before = await pieceSetsApi.get(id);
        const updated = await pieceSetsApi.update(
          id,
          pieceSetChanges.toRequest({ pieceSet: before, change }),
        );
        return { before, updated };
      },
      onMutate: async ({ change }) => {
        await Promise.all([
          queryClient.cancelQueries({ queryKey }),
          queryClient.cancelQueries({ queryKey: pieceSetKeys.list }),
        ]);
        const current = queryClient.getQueryData<PieceSet>(queryKey);
        if (current !== undefined) {
          queryClient.setQueryData(
            queryKey,
            pieceSetChanges.apply({ pieceSet: current, change }),
          );
        }
        replaceInList({
          queryClient,
          id,
          update: (pieceSet) => pieceSetChanges.apply({ pieceSet, change }),
        });
      },
      onSuccess: ({ before, updated }, { change, isUndo }) => {
        if (isLastPending()) {
          queryClient.setQueryData(queryKey, updated);
          replaceInList({ queryClient, id, update: () => updated });
        }
        latestChange.current += 1;
        if (isUndo) {
          return;
        }
        const changeNumber = latestChange.current;
        mutationFeedback.undo({
          message: describeChange(change),
          undoneMessage: t('Change undone'),
          onUndo: async () => {
            if (changeNumber !== latestChange.current) {
              throw mutationFeedback.userError(
                t('Only the latest change can be undone'),
              );
            }
            await mutation.mutateAsync({
              change: pieceSetChanges.inverse({ previous: before, change }),
              isUndo: true,
            });
          },
        });
      },
      onError: (error) => {
        if (isLastPending()) {
          queryClient.invalidateQueries({ queryKey }).catch(() => undefined);
        }
        mutationFeedback.error({ error, title: t("Couldn't save changes") });
      },
      onSettled: () => {
        Promise.all([
          queryClient.invalidateQueries({ queryKey: pieceSetKeys.list }),
          queryClient.invalidateQueries({
            queryKey: pieceSetKeys.projects,
          }),
          pieceCacheUtils.invalidateProjectPieceCaches(queryClient),
        ]).catch(() => undefined);
      },
    });
    return mutation;
  },
  useDeletePieceSet: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => pieceSetsApi.delete(id),
      onSuccess: (_, id) => {
        queryClient.removeQueries({ queryKey: pieceSetKeys.one(id) });
        refreshAfterProjectChange({ queryClient }).catch(() => undefined);
      },
      onError: (error) =>
        mutationFeedback.error({
          error,
          title: t("Couldn't delete the {term}", pieceSetTerms.get()),
        }),
    });
  },
  useDuplicatePieceSet: ({ onError }: FormErrorHandler) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        pieceSetsApi.duplicate(id, { name }),
      onSuccess: () => {
        mutationFeedback.success(t('{Term} duplicated', pieceSetTerms.get()));
        queryClient
          .invalidateQueries({ queryKey: pieceSetKeys.all })
          .catch(() => undefined);
      },
      onError,
    });
  },
};

export function usePieceSetChange(id: string): ChangePieceSet {
  const { mutateAsync } = pieceSetMutations.useChangePieceSet(id);
  return (change) =>
    mutateAsync({ change }).then(
      () => true,
      () => false,
    );
}

export function usePieceSetProjectMoves() {
  const queryClient = useQueryClient();
  return async ({
    pieceSetId,
    added,
    removed,
    defaultSetId,
  }: ProjectMoves): Promise<void> => {
    try {
      const results = await Promise.allSettled([
        ...(added.length > 0
          ? [pieceSetsApi.assignProjects(pieceSetId, { projectIds: added })]
          : []),
        ...(removed.length > 0
          ? [
              defaultSetId === undefined
                ? Promise.all(
                    removed.map((projectId) =>
                      pieceSetsApi.removeProject(pieceSetId, projectId),
                    ),
                  )
                : pieceSetsApi.assignProjects(defaultSetId, {
                    projectIds: removed,
                  }),
            ]
          : []),
      ]);
      const failure = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
      );
      if (failure) {
        throw failure.reason;
      }
    } finally {
      await refreshAfterProjectChange({ queryClient });
    }
  };
}

function describeChange(change: PieceSetChange): string {
  switch (change.type) {
    case 'visibility': {
      const values = Object.values(change.visible);
      const count = values.length;
      if (values.every(Boolean)) {
        return count === 1 && change.label
          ? t('{name} shown', { name: change.label })
          : t('{count, plural, =1 {1 piece shown} other {# pieces shown}}', {
              count,
            });
      }
      if (values.every((visible) => !visible)) {
        return count === 1 && change.label
          ? t('{name} hidden', { name: change.label })
          : t('{count, plural, =1 {1 piece hidden} other {# pieces hidden}}', {
              count,
            });
      }
      return t('Changes saved');
    }
    case 'newPieces':
      return change.include
        ? t('New pieces are shown automatically')
        : t('New pieces stay hidden until you show them');
    case 'requiredMode':
    case 'required':
      return t('Publishing rule saved');
    case 'components':
      return t('Actions for {name} saved', { name: change.pieceDisplayName });
    case 'patch':
      return t('Changes saved');
  }
}

function replaceInList({
  queryClient,
  id,
  update,
}: {
  queryClient: QueryClient;
  id: string;
  update: (pieceSet: PieceSet) => PieceSet;
}): void {
  queryClient.setQueryData<PieceSet[]>(pieceSetKeys.list, (sets) =>
    sets?.map((pieceSet) => (pieceSet.id === id ? update(pieceSet) : pieceSet)),
  );
}

function refreshAfterProjectChange({
  queryClient,
}: {
  queryClient: QueryClient;
}): Promise<unknown> {
  projectCollectionUtils.refetchProjects();
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: pieceSetKeys.all }),
    queryClient.invalidateQueries({ queryKey: projectQueryKeys.forPlatforms }),
    pieceCacheUtils.invalidateProjectPieceCaches(queryClient),
  ]);
}

function isNotFound(error: unknown): boolean {
  return api.isError(error) && error.response?.status === 404;
}

const MAX_RETRIES = 3;

type ChangeVariables = { change: PieceSetChange; isUndo?: boolean };

type FormErrorHandler = {
  onError: (error: Error) => void;
};

type ProjectMoves = {
  pieceSetId: string;
  added: string[];
  removed: string[];
  defaultSetId: string | undefined;
};
