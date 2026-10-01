import { t } from 'i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RequiredActionGroupHeader } from '@/features/piece-sets';

import {
  RequiredActionGroup,
  useRequiredActionsGroupedByPiece,
} from './use-required-actions-grouped-by-piece';

export function ConfirmHidingRequiredActionsDialog({
  hiddenRequiredActions,
  reason,
  onConfirm,
  onCancel,
}: {
  hiddenRequiredActions: Record<string, string[]> | null;
  reason: HidingReason;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={hiddenRequiredActions !== null}
      onOpenChange={(open) => !open && onCancel()}
    >
      <DialogContent className="sm:max-w-md">
        {hiddenRequiredActions && (
          <ConfirmHidingRequiredActionsContent
            hiddenRequiredActions={hiddenRequiredActions}
            reason={reason}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConfirmHidingRequiredActionsContent({
  hiddenRequiredActions,
  reason,
  onConfirm,
  onCancel,
}: {
  hiddenRequiredActions: Record<string, string[]>;
  reason: HidingReason;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { requiredActionsGroupedByPiece } = useRequiredActionsGroupedByPiece({
    actions: hiddenRequiredActions,
  });
  const pieceCount = Object.keys(hiddenRequiredActions).length;
  const actionCount = Object.values(hiddenRequiredActions).flat().length;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Remove required actions?')}</DialogTitle>
        <DialogDescription>
          {reason === 'removePieces'
            ? t('removingPiecesRemovesRequiredActions', {
                count: pieceCount,
                actionCount,
              })
            : t('hidingActionsRemovesRequiredActions', {
                count: pieceCount,
                actionCount,
              })}
        </DialogDescription>
      </DialogHeader>
      <ScrollArea viewPortClassName="max-h-80">
        <RequiredActionsList
          requiredActionsGroupedByPiece={requiredActionsGroupedByPiece}
        />
      </ScrollArea>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('Cancel')}
        </Button>
        <Button type="button" onClick={onConfirm}>
          {t('Save and remove')}
        </Button>
      </DialogFooter>
    </>
  );
}

function RequiredActionsList({
  requiredActionsGroupedByPiece,
}: {
  requiredActionsGroupedByPiece: RequiredActionGroup[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {requiredActionsGroupedByPiece.map((group) => (
        <div key={group.pieceName} className="flex flex-col">
          <RequiredActionGroupHeader
            displayName={group.displayName}
            logoUrl={group.logoUrl}
          />
          {group.actions.map((action) => (
            <p key={action.name} className="py-1.5 pl-9 text-sm">
              {action.displayName}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export type HidingReason = 'removePieces' | 'hideActions';
