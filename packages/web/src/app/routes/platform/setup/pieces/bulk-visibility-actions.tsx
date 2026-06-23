import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { platformPiecesMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

type BulkVisibilityActionsProps = {
  selectedPieces: PieceMetadataModelSummary[];
  onComplete: () => void;
  resetSelection: () => void;
  isEnabled: boolean;
};

const BulkVisibilityActions = ({
  selectedPieces,
  onComplete,
  resetSelection,
  isEnabled,
}: BulkVisibilityActionsProps) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const { filteredPieceNames } = platform;

  const { mutate: bulkHide, isPending: isHidePending } =
    platformPiecesMutations.useBulkHidePieces({
      platformId: platform.id,
      filteredPieceNames,
      refetch,
    });

  const { mutate: bulkShow, isPending: isShowPending } =
    platformPiecesMutations.useBulkShowPieces({
      platformId: platform.id,
      filteredPieceNames,
      refetch,
    });

  const allHidden = selectedPieces.every((p) =>
    filteredPieceNames.includes(p.name),
  );
  const allVisible = selectedPieces.every(
    (p) => !filteredPieceNames.includes(p.name),
  );

  const selectedNames = selectedPieces.map((p) => p.name);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        loading={isShowPending}
        disabled={!isEnabled || allVisible}
        onClick={() => {
          bulkShow(selectedNames, {
            onSuccess: () => {
              onComplete();
              resetSelection();
            },
          });
        }}
      >
        <Eye className="mr-1 size-4" />
        {t('Show')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        loading={isHidePending}
        disabled={!isEnabled || allHidden}
        onClick={() => {
          bulkHide(selectedNames, {
            onSuccess: () => {
              onComplete();
              resetSelection();
            },
          });
        }}
      >
        <EyeOff className="mr-1 size-4" />
        {t('Hide')}
      </Button>
    </>
  );
};

BulkVisibilityActions.displayName = 'BulkVisibilityActions';
export { BulkVisibilityActions };
