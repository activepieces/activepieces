import { PieceSelectorConfig } from '@activepieces/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { pieceCacheUtils, piecesApi } from '@/features/pieces';

import { platformPieceFilterApi } from '../api/platform-piece-filter-api';

import { platformPieceFilterKeys } from './platform-piece-filter-hooks';

export const platformPiecesMutations = {
  useTogglePieceVisibility: ({
    filteredPieceNames,
  }: {
    filteredPieceNames: string[];
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (pieceName: string) => {
        const newFilteredPieceNames = filteredPieceNames.includes(pieceName)
          ? filteredPieceNames.filter((name) => name !== pieceName)
          : [...filteredPieceNames, pieceName];
        await platformPieceFilterApi.update({
          filteredPieceNames: newFilteredPieceNames,
        });
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: platformPieceFilterKeys.all,
        });
        pieceCacheUtils.invalidatePieceCaches(queryClient);
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
      },
    });
  },
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
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
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
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
      },
      onError: () => {
        toast.error(t('Failed to save changes. Please try again.'));
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
        toast.success(t('Pieces synced'), {
          description: t(
            'Pieces have been synced from the activepieces cloud.',
          ),
        });
      },
    });
  },
  useSetPieceComponentVisibility: ({
    filteredActionNames,
    filteredTriggerNames,
  }: {
    filteredActionNames: Record<string, string[]>;
    filteredTriggerNames: Record<string, string[]>;
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({
        pieceName,
        hiddenActions,
        hiddenTriggers,
      }: {
        pieceName: string;
        hiddenActions: string[];
        hiddenTriggers: string[];
      }) => {
        await platformPieceFilterApi.update({
          filteredActionNames: {
            ...filteredActionNames,
            [pieceName]: hiddenActions,
          },
          filteredTriggerNames: {
            ...filteredTriggerNames,
            [pieceName]: hiddenTriggers,
          },
        });
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: platformPieceFilterKeys.all,
        });
        pieceCacheUtils.invalidatePieceCaches(queryClient);
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
      },
    });
  },
  useBulkSetPiecesVisibility: ({
    filteredPieceNames,
  }: {
    filteredPieceNames: string[];
  }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({
        pieceNames,
        hidden,
      }: {
        pieceNames: string[];
        hidden: boolean;
      }) => {
        const next = hidden
          ? [...new Set([...filteredPieceNames, ...pieceNames])]
          : filteredPieceNames.filter((n) => !pieceNames.includes(n));
        await platformPieceFilterApi.update({ filteredPieceNames: next });
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: platformPieceFilterKeys.all,
        });
        pieceCacheUtils.invalidatePieceCaches(queryClient);
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
      },
      onError: () => {
        toast.error(t('Failed to save changes. Please try again.'));
      },
    });
  },
};
