import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { ApFlagId, PieceSyncMode } from '@activepieces/shared';

const SyncPiecesButton = () => {
  const { data: piecesSyncMode } = flagsHooks.useFlag<string>(
    ApFlagId.PIECES_SYNC_MODE,
  );
  const { mutate: syncPieces, isPending } = useMutation({
    mutationFn: async () => {
      await piecesApi.syncFromCloud();
    },
    onSuccess: () => {
      toast({
        title: t('Pieces synced'),
        description: t('Pieces have been synced from the activepieces cloud.'),
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <>
      {piecesSyncMode === PieceSyncMode.OFFICIAL_AUTO && (
        <Button
          variant={'outline'}
          onClick={() => syncPieces()}
          loading={isPending}
          size={'sm'}
        >
          <RefreshCcw className="w-4 h-4 mr-2" /> Sync from Cloud
        </Button>
      )}
    </>
  );
};

SyncPiecesButton.displayName = 'SyncPiecesButton';
export { SyncPiecesButton };
