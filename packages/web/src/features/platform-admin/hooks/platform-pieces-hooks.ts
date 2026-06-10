import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { piecesApi } from '@/features/pieces';

export const platformPiecesMutations = {
  useTogglePieceVisibility: ({
    platformId,
    filteredPieceNames,
    refetch,
  }: {
    platformId: string;
    filteredPieceNames: string[];
    refetch: () => Promise<void>;
  }) => {
    return useMutation({
      mutationFn: async (pieceName: string) => {
        const newFilteredPieceNames = filteredPieceNames.includes(pieceName)
          ? filteredPieceNames.filter((name) => name !== pieceName)
          : [...filteredPieceNames, pieceName];
        await platformApi.update(
          { filteredPieceNames: newFilteredPieceNames },
          platformId,
        );
        await refetch();
      },
      onSuccess: () => {
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
    return useMutation({
      mutationFn: async (pieceName: string) => {
        const newPinnedPieces = pinnedPieces.includes(pieceName)
          ? pinnedPieces.filter((name) => name !== pieceName)
          : [...pinnedPieces, pieceName];
        await platformApi.update({ pinnedPieces: newPinnedPieces }, platformId);
        await refetch();
      },
      onSuccess: () => {
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
      },
    });
  },
  useSyncPieces: () => {
    return useMutation({
      mutationFn: async () => {
        await piecesApi.syncFromCloud();
      },
      onSuccess: () => {
        toast.success(t('Pieces synced'), {
          description: t(
            'Pieces have been synced from the activepieces cloud.',
          ),
        });
      },
    });
  },
};
