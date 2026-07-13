import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
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

  const {
    mutate: setVisibility,
    mutateAsync: setVisibilityAsync,
    isPending,
    variables,
  } = platformPiecesMutations.useBulkSetPiecesVisibility({
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
      <ConfirmationDeleteDialog
        title={t('Hide Pieces')}
        message={t('These pieces will be hidden from all projects.')}
        warning={
          <div>
            {t('Any active flows using these pieces will be disabled.')}
          </div>
        }
        entityName={t('Pieces')}
        buttonText={t('Hide')}
        mutationFn={async () => {
          await setVisibilityAsync({ pieceNames: selectedNames, hidden: true });
          onComplete();
          resetSelection();
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          loading={isPending && variables?.hidden === true}
          disabled={!isEnabled || allHidden}
        >
          <EyeOff className="mr-1 size-4" />
          {t('Hide')}
        </Button>
      </ConfirmationDeleteDialog>
    </>
  );
};

BulkVisibilityActions.displayName = 'BulkVisibilityActions';
export { BulkVisibilityActions };
