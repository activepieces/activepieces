import { PieceSelectorConfig } from '@activepieces/shared';
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
  useUpdatePieceSelectorConfig: ({
    platformId,
    refetch,
  }: {
    platformId: string;
    refetch: () => Promise<void>;
  }) => {
    return useMutation({
      mutationFn: async (pieceSelectorConfig: PieceSelectorConfig | null) => {
        await platformApi.update({ pieceSelectorConfig }, platformId);
        await refetch();
      },
      onSuccess: () => {
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
      },
      onError: () => {
        toast.error(t('Failed to save changes. Please try again.'));
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
  useToggleComponentVisibility: ({
    platformId,
    filteredActionNames,
    filteredTriggerNames,
    refetch,
  }: {
    platformId: string;
    filteredActionNames: Record<string, string[]>;
    filteredTriggerNames: Record<string, string[]>;
    refetch: () => Promise<void>;
  }) => {
    return useMutation({
      mutationFn: async ({
        pieceName,
        componentName,
        isAction,
      }: {
        pieceName: string;
        componentName: string;
        isAction: boolean;
      }) => {
        if (isAction) {
          const current = filteredActionNames[pieceName] ?? [];
          const updated = current.includes(componentName)
            ? current.filter((n) => n !== componentName)
            : [...current, componentName];
          await platformApi.update(
            {
              filteredActionNames: {
                ...filteredActionNames,
                [pieceName]: updated,
              },
            },
            platformId,
          );
        } else {
          const current = filteredTriggerNames[pieceName] ?? [];
          const updated = current.includes(componentName)
            ? current.filter((n) => n !== componentName)
            : [...current, componentName];
          await platformApi.update(
            {
              filteredTriggerNames: {
                ...filteredTriggerNames,
                [pieceName]: updated,
              },
            },
            platformId,
          );
        }
        await refetch();
      },
      onSuccess: () => {
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
      },
    });
  },
  useBatchHideComponents: ({
    platformId,
    filteredActionNames,
    filteredTriggerNames,
    refetch,
  }: {
    platformId: string;
    filteredActionNames: Record<string, string[]>;
    filteredTriggerNames: Record<string, string[]>;
    refetch: () => Promise<void>;
  }) => {
    return useMutation({
      mutationFn: async ({
        pieceName,
        actionNames,
        triggerNames,
      }: {
        pieceName: string;
        actionNames: string[];
        triggerNames: string[];
      }) => {
        const currentActions = filteredActionNames[pieceName] ?? [];
        const currentTriggers = filteredTriggerNames[pieceName] ?? [];
        const updatedActions = [
          ...new Set([...currentActions, ...actionNames]),
        ];
        const updatedTriggers = [
          ...new Set([...currentTriggers, ...triggerNames]),
        ];
        await platformApi.update(
          {
            filteredActionNames: {
              ...filteredActionNames,
              [pieceName]: updatedActions,
            },
            filteredTriggerNames: {
              ...filteredTriggerNames,
              [pieceName]: updatedTriggers,
            },
          },
          platformId,
        );
        await refetch();
      },
      onSuccess: () => {
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
      },
    });
  },
  useBatchShowComponents: ({
    platformId,
    filteredActionNames,
    filteredTriggerNames,
    refetch,
  }: {
    platformId: string;
    filteredActionNames: Record<string, string[]>;
    filteredTriggerNames: Record<string, string[]>;
    refetch: () => Promise<void>;
  }) => {
    return useMutation({
      mutationFn: async ({
        pieceName,
        actionNames,
        triggerNames,
      }: {
        pieceName: string;
        actionNames: string[];
        triggerNames: string[];
      }) => {
        const currentActions = filteredActionNames[pieceName] ?? [];
        const currentTriggers = filteredTriggerNames[pieceName] ?? [];
        const updatedActions = currentActions.filter(
          (n) => !actionNames.includes(n),
        );
        const updatedTriggers = currentTriggers.filter(
          (n) => !triggerNames.includes(n),
        );
        await platformApi.update(
          {
            filteredActionNames: {
              ...filteredActionNames,
              [pieceName]: updatedActions,
            },
            filteredTriggerNames: {
              ...filteredTriggerNames,
              [pieceName]: updatedTriggers,
            },
          },
          platformId,
        );
        await refetch();
      },
      onSuccess: () => {
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
      },
    });
  },
  useBulkSetPiecesVisibility: ({
    platformId,
    filteredPieceNames,
    refetch,
  }: {
    platformId: string;
    filteredPieceNames: string[];
    refetch: () => Promise<void>;
  }) => {
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
        await platformApi.update({ filteredPieceNames: next }, platformId);
        await refetch();
      },
      onSuccess: () => {
        toast.success(t('Your changes have been saved.'), { duration: 3000 });
      },
      onError: () => {
        toast.error(t('Failed to save changes. Please try again.'));
      },
    });
  },
};
