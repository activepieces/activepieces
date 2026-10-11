import { PieceSelectorConfig } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { platformApi } from '@/api/platforms-api';
import { pieceCacheUtils, piecesApi } from '@/features/pieces';
import { mutationFeedback } from '@/lib/mutation-feedback';

export const platformPiecesMutations = {
  useTogglePiecePin: ({
    platformId,
    pinnedPieces,
    refetch,
  }: {
    platformId: string;
    pinnedPieces: string[];
    refetch: () => Promise<void>;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (pieceName: string) => {
        const newPinnedPieces = pinnedPieces.includes(pieceName)
          ? pinnedPieces.filter((name) => name !== pieceName)
          : [...pinnedPieces, pieceName];
        await platformApi.update({ pinnedPieces: newPinnedPieces }, platformId);
        await refetch();
      },
      onSuccess: () => {
        pieceCacheUtils.invalidatePieceCaches(queryClient);
        mutationFeedback.success(t('Changes saved'));
      },
      onError: (error) => {
        mutationFeedback.error({ error, title: t("Couldn't save changes") });
      },
    });
  },
  useUpdatePieceSelectorConfig: ({
    platformId,
    refetch,
  }: {
    platformId: string;
    refetch: () => Promise<void>;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (pieceSelectorConfig: PieceSelectorConfig | null) => {
        await platformApi.update({ pieceSelectorConfig }, platformId);
        await refetch();
      },
      onSuccess: () => {
        pieceCacheUtils.invalidatePieceCaches(queryClient);
        mutationFeedback.success(t('Changes saved'));
      },
      onError: (error) => {
        mutationFeedback.error({ error, title: t("Couldn't save changes") });
      },
    });
  },
  useSyncPieces: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async () => {
        await piecesApi.syncFromCloud();
      },
      onSuccess: () => {
        pieceCacheUtils.invalidatePieceCaches(queryClient);
        mutationFeedback.success(
          t('Pieces synced'),
          t('Pieces have been synced from the activepieces cloud.'),
        );
      },
      onError: (error) => {
        mutationFeedback.error({ error, title: t("Couldn't sync pieces") });
      },
    });
  },
};
