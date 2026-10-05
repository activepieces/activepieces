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
import { toast } from 'sonner';

import { pieceCacheUtils } from '@/features/pieces';
import { projectCollectionUtils } from '@/features/projects';
import { platformHooks } from '@/hooks/platform-hooks';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { api } from '@/lib/api';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { pieceSetsApi } from '../api/piece-sets-api';
import { PieceSetChange, pieceSetChanges } from '../utils/piece-set-changes';

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
  useCreatePieceSet: ({ onError }: FormErrorHandler) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: CreatePieceSetRequestBody) =>
        pieceSetsApi.create(request),
      onSuccess: () => {
        toast.success(t('Policy created'));
        void queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
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
        void queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
      },
      onError,
    });
  },
  useChangePieceSet: (id: string) => {
    const queryClient = useQueryClient();
    return useOptimisticMutation<PieceSetChange, PieceSet, PieceSet>({
      queryKey: pieceSetKeys.one(id),
      scope: `piece-set-${id}`,
      mutationFn: async (change) => {
        const latest =
          queryClient.getQueryData<PieceSet>(pieceSetKeys.one(id)) ??
          (await pieceSetsApi.get(id));
        return pieceSetsApi.update(
          id,
          pieceSetChanges.toRequest({ pieceSet: latest, change }),
        );
      },
      apply: ({ current, vars }) =>
        pieceSetChanges.apply({ pieceSet: current, change: vars }),
      invalidate: [pieceSetKeys.list, ...PIECE_CACHE_KEYS],
      success: ({ vars }) => describeChange(vars),
      undo: ({ vars, previous }) =>
        previous === undefined
          ? vars
          : pieceSetChanges.inverse({ previous, change: vars }),
      errorTitle: t("Couldn't save changes"),
    });
  },
  useDeletePieceSet: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id: string) => pieceSetsApi.delete(id),
      onSuccess: (_, id) => {
        queryClient.removeQueries({ queryKey: pieceSetKeys.one(id) });
        void refreshAfterProjectChange({ queryClient });
      },
      onError: (error) =>
        mutationFeedback.error({
          error,
          title: t("Couldn't delete the policy"),
        }),
    });
  },
  useDuplicatePieceSet: ({ onError }: FormErrorHandler) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
        pieceSetsApi.duplicate(id, { name }),
      onSuccess: () => {
        toast.success(t('Policy duplicated'));
        void queryClient.invalidateQueries({ queryKey: pieceSetKeys.all });
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
  }
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

const PIECE_CACHE_KEYS = [['pieces'], ['pieces-metadata'], ['piece']];

const MAX_RETRIES = 3;

type FormErrorHandler = {
  onError: (error: Error) => void;
};

type SetProjectsRequest = {
  id: string;
  added: string[];
  removed: string[];
};
