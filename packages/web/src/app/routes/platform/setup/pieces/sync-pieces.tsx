import { ApFlagId, PieceSyncMode } from '@activepieces/shared';
import { RefreshCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { platformPiecesMutations } from '@/features/platform-admin';
import { flagsHooks } from '@/hooks/flags-hooks';

const SyncPiecesButton = () => {
  const { data: piecesSyncMode } = flagsHooks.useFlag<string>(
    ApFlagId.PIECES_SYNC_MODE,
  );
  const { mutate: syncPieces, isPending } =
    platformPiecesMutations.useSyncPieces();

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
