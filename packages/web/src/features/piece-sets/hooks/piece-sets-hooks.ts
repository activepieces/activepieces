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
import { toast } from 'sonner';

import { pieceCacheUtils } from '@/features/pieces';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

import { pieceSetsApi } from '../api/piece-sets-api';
import { PieceSetChange, pieceSetChanges } from '../utils/piece-set-changes';
import { pieceSetTerms } from '../utils/piece-set-terms';

export const pieceSetKeys = {
  all: ['piece-sets'] as const,
  list: ['piece-sets', 'list'] as const,
  one: (id: string) => ['piece-sets', id] as const,
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
        toast.success(t('{Term} created', pieceSetTerms.get()));
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
        toast.success(t('Changes saved'));
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
        await queryClient.cancelQueries({ queryKey });
        const current = queryClient.getQueryData<PieceSet>(queryKey);
        if (current !== undefined) {
          queryClient.setQueryData(
            queryKey,
            pieceSetChanges.apply({ pieceSet: current, change }),
          );
        }
      },
      onSuccess: ({ before, updated }, { change, isUndo }) => {
        if (isLastPending()) {
          queryClient.setQueryData(queryKey, updated);
        }
        latestChange.current += 1;
        const changeNumber = latestChange.current;
        toast.success(
          isUndo ? t('Change undone') : describeChange(change),
          isUndo
            ? undefined
            : {
                action: {
                  label: t('Undo'),
                  onClick: () => {
                    if (changeNumber !== latestChange.current) {
                      toast.info(t('Only the latest change can be undone'));
                      return;
                    }
                    mutation.mutate({
                      change: pieceSetChanges.inverse({
                        previous: before,
                        change,
                      }),
                      isUndo: true,
                    });
                  },
                },
              },
        );
      },
      onError: (error) => {
        if (isLastPending()) {
          queryClient.invalidateQueries({ queryKey }).catch(() => undefined);
        }
        toast.error(t("Couldn't save changes"), {
          description: errorDescription(error),
        });
      },
      onSettled: () => {
        Promise.all([
          queryClient.invalidateQueries({ queryKey: pieceSetKeys.list }),
          queryClient.invalidateQueries({
            queryKey: ['piece-sets', 'project'],
          }),
          pieceCacheUtils.invalidatePieceCaches(queryClient),
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
        toast.error(t("Couldn't delete the {term}", pieceSetTerms.get()), {
          description: errorDescription(error),
        }),
    });
  },
  useDuplicatePieceSet: ({ onError }: FormErrorHandler) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        pieceSetsApi.duplicate(id, { name }),
      onSuccess: () => {
        toast.success(t('{Term} duplicated', pieceSetTerms.get()));
        queryClient
          .invalidateQueries({ queryKey: pieceSetKeys.all })
          .catch(() => undefined);
      },
      onError,
    });
  },
  useSetProjects: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, added, removed }: SetProjectsRequest) => {
        await Promise.all([
          ...(added.length > 0
            ? [pieceSetsApi.assignProjects(id, { projectIds: added })]
            : []),
          ...removed.map((projectId) =>
            pieceSetsApi.removeProject(id, projectId),
          ),
        ]);
      },
      onSuccess: (_, { added, removed }) => {
        toast.success(
          t(
            '{count, plural, =1 {1 project updated} other {# projects updated}}',
            { count: added.length + removed.length },
          ),
        );
      },
      onError: (error) =>
        toast.error(t("Couldn't update the projects"), {
          description: errorDescription(error),
        }),
      onSettled: () => refreshAfterProjectChange({ queryClient }),
    });
  },
};

function describeChange(change: PieceSetChange): string {
  switch (change.type) {
    case 'visibility': {
      const values = Object.values(change.visible);
      const count = values.length;
      if (values.every(Boolean)) {
        return count === 1 && change.label
          ? t('{name} allowed', { name: change.label })
          : t(
              '{count, plural, =1 {1 piece allowed} other {# pieces allowed}}',
              { count },
            );
      }
      if (values.every((visible) => !visible)) {
        return count === 1 && change.label
          ? t('{name} blocked', { name: change.label })
          : t(
              '{count, plural, =1 {1 piece blocked} other {# pieces blocked}}',
              { count },
            );
      }
      return t('Changes saved');
    }
    case 'newPieces':
      return change.include
        ? t('New pieces are allowed automatically')
        : t('New pieces stay blocked until you allow them');
    case 'requiredMode':
    case 'required':
      return t('Publishing rule saved');
    case 'components':
      return t('Actions for {name} saved', { name: change.pieceDisplayName });
    case 'restore':
      return t('Changes saved');
  }
}

function errorDescription(error: unknown): string | undefined {
  return api.serverErrorMessage(error);
}

function refreshAfterProjectChange({
  queryClient,
}: {
  queryClient: QueryClient;
}): Promise<unknown> {
  projectCollectionUtils.refetchProjects();
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: pieceSetKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['projects-for-platforms'] }),
    pieceCacheUtils.invalidatePieceCaches(queryClient),
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

type SetProjectsRequest = {
  id: string;
  added: string[];
  removed: string[];
};
