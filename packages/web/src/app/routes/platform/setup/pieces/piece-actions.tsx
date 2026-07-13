import { t } from 'i18next';
import { Eye, EyeOff, Pin, PinOff } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformPiecesMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';

type PieceActionsProps = {
  pieceName: string;
  isEnabled: boolean;
};

const PieceActions = ({ pieceName, isEnabled }: PieceActionsProps) => {
  const { platform, refetch } = platformHooks.useCurrentPlatform();

  const {
    mutate: togglePiece,
    mutateAsync: togglePieceAsync,
    isPending: isTogglePending,
  } = platformPiecesMutations.useTogglePieceVisibility({
    platformId: platform.id,
    filteredPieceNames: platform.filteredPieceNames,
    refetch,
  });
  const { mutate: togglePin, isPending: isPinPending } =
    platformPiecesMutations.useTogglePiecePin({
      platformId: platform.id,
      pinnedPieces: platform.pinnedPieces,
      refetch,
    });

  const filtered = platform.filteredPieceNames.includes(pieceName);
  const pinned = platform.pinnedPieces.includes(pieceName);

  const visibilityButton = filtered ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size={'sm'}
          loading={isTogglePending}
          disabled={!isEnabled}
          onClick={(e) => {
            if (!isEnabled) {
              e.preventDefault();
              return;
            }
            togglePiece(pieceName);
          }}
        >
          <EyeOff className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('Show this piece for all projects')}</TooltipContent>
    </Tooltip>
  ) : (
    <ConfirmationDeleteDialog
      title={t('Hide Piece')}
      message={t('This piece will be hidden from all projects.')}
      warning={
        <div>
          {t('Any active flows using this piece')}{' '}
          <strong>{t('will be disabled')}</strong>.
        </div>
      }
      entityName={t('Piece')}
      buttonText={t('Hide')}
      mutationFn={() => togglePieceAsync(pieceName)}
    >
      <Button
        variant="ghost"
        size={'sm'}
        loading={isTogglePending}
        disabled={!isEnabled}
      >
        <Eye className="size-4" />
      </Button>
    </ConfirmationDeleteDialog>
  );

  return (
    <div className="flex gap-2">
      {visibilityButton}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size={'sm'}
            loading={isPinPending}
            disabled={!isEnabled}
            onClick={(e) => {
              if (!isEnabled) {
                e.preventDefault();
                return;
              }
              togglePin(pieceName);
            }}
          >
            {pinned ? (
              <PinOff className="size-4" />
            ) : (
              <Pin className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {pinned ? t('Unpin this piece') : t('Pin this piece')}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

PieceActions.displayName = 'PieceActions';

export { PieceActions };
