import {
  PieceSelectorConfig,
  PlatformWithoutSensitiveData,
} from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { pieceCacheUtils, piecesApi } from '@/features/pieces';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { mutationFeedback } from '@/lib/mutation-feedback';

export const platformPiecesMutations = {
  useTogglePiecePin: ({ platformId }: { platformId: string }) => {
    const queryClient = useQueryClient();
    const queryKey = platformQueryKey(platformId);
    return useOptimisticMutation<
      PiecePinChange,
      PlatformWithoutSensitiveData,
      PlatformWithoutSensitiveData
    >({
      queryKey,
      scope: `platform-pins-${platformId}`,
      mutationFn: async (change) => {
        const latest =
          queryClient.getQueryData<PlatformWithoutSensitiveData>(queryKey);
        const pinnedPieces = withPin({
          pinnedPieces: latest?.pinnedPieces ?? [],
          change,
        });
        return platformApi.update({ pinnedPieces }, platformId);
      },
      apply: ({ current, vars }) => ({
        ...current,
        pinnedPieces: withPin({
          pinnedPieces: current.pinnedPieces,
          change: vars,
        }),
      }),
      invalidate: PIECE_CACHE_KEYS,
      success: ({ vars }) =>
        vars.pinned
          ? t('{name} pinned to the piece menu', { name: vars.displayName })
          : t('{name} unpinned from the piece menu', {
              name: vars.displayName,
            }),
      undo: ({ vars, previous }) => ({
        ...vars,
        pinned: !vars.pinned,
        position: previous?.pinnedPieces.indexOf(vars.pieceName),
      }),
      errorTitle: t("Couldn't save changes"),
    });
  },
  useUpdatePieceSelectorConfig: ({
    platformId,
    onError,
  }: {
    platformId: string;
    onError: (error: Error) => void;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (pieceSelectorConfig: PieceSelectorConfig | null) =>
        platformApi.update({ pieceSelectorConfig }, platformId),
      onSuccess: (updated) => {
        queryClient.setQueryData<PlatformWithoutSensitiveData>(
          platformQueryKey(platformId),
          (current) =>
            current && {
              ...current,
              pieceSelectorConfig: updated.pieceSelectorConfig,
            },
        );
        pieceCacheUtils
          .invalidatePieceCaches(queryClient)
          .catch(() => undefined);
      },
      onError,
      onSettled: () =>
        queryClient.invalidateQueries({
          queryKey: platformQueryKey(platformId),
        }),
    });
  },
  useSyncPieces: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: () => piecesApi.syncFromCloud(),
      onMutate: () => {
        toast.loading(t('Syncing pieces from the cloud…'), {
          id: SYNC_TOAST_ID,
        });
      },
      onSuccess: () => {
        pieceCacheUtils
          .invalidatePieceCaches(queryClient)
          .catch(() => undefined);
        toast.success(t('Pieces synced'), {
          id: SYNC_TOAST_ID,
          description: t('The catalog now matches the cloud.'),
        });
      },
      onError: (error) => {
        toast.dismiss(SYNC_TOAST_ID);
        mutationFeedback.error({ error, title: t("Couldn't sync pieces") });
      },
    });
  },
};

function withPin({
  pinnedPieces,
  change,
}: {
  pinnedPieces: string[];
  change: PiecePinChange;
}): string[] {
  if (!change.pinned) {
    return pinnedPieces.filter((name) => name !== change.pieceName);
  }
  if (pinnedPieces.includes(change.pieceName)) {
    return pinnedPieces;
  }
  const position =
    change.position !== undefined && change.position >= 0
      ? change.position
      : pinnedPieces.length;
  return [
    ...pinnedPieces.slice(0, position),
    change.pieceName,
    ...pinnedPieces.slice(position),
  ];
}

function platformQueryKey(platformId: string) {
  return ['platform', platformId];
}

const PIECE_CACHE_KEYS = [['pieces'], ['pieces-metadata']];

const SYNC_TOAST_ID = 'pieces-sync';

export type PiecePinChange = {
  pieceName: string;
  displayName: string;
  pinned: boolean;
  position?: number;
};
