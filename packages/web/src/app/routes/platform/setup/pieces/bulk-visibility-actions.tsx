import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  platformPiecesMutations,
  platformPieceFilterQueries,
} from '@/features/platform-admin';

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
  const { pieceFilter } = platformPieceFilterQueries.usePlatformPieceFilter();
  const { filteredPieceNames } = pieceFilter;

  const {
    mutate: setVisibility,
    isPending,
    variables,
  } = platformPiecesMutations.useBulkSetPiecesVisibility({
    filteredPieceNames,
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
        loading={isPending && variables?.hidden === false}
        disabled={!isEnabled || allVisible}
        onClick={() => {
          setVisibility(
            { pieceNames: selectedNames, hidden: false },
            {
              onSuccess: () => {
                onComplete();
                resetSelection();
              },
            },
          );
        }}
      >
        <Eye className="mr-1 size-4" />
        {t('Show')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        loading={isPending && variables?.hidden === true}
        disabled={!isEnabled || allHidden}
        onClick={() => {
          setVisibility(
            { pieceNames: selectedNames, hidden: true },
            {
              onSuccess: () => {
                onComplete();
                resetSelection();
              },
            },
          );
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
