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

export function ConfirmExcludingRequiredActionsDialog({
  excludedRequiredActions,
  reason,
  onConfirm,
  onCancel,
}: {
  excludedRequiredActions: Record<string, string[]> | null;
  reason: ExcludingReason;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      open={excludedRequiredActions !== null}
      onOpenChange={(open) => !open && onCancel()}
    >
      <DialogContent className="sm:max-w-md">
        {excludedRequiredActions && (
          <ConfirmExcludingRequiredActionsContent
            excludedRequiredActions={excludedRequiredActions}
            reason={reason}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConfirmExcludingRequiredActionsContent({
  excludedRequiredActions,
  reason,
  onConfirm,
  onCancel,
}: {
  excludedRequiredActions: Record<string, string[]>;
  reason: ExcludingReason;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { requiredActionsGroupedByPiece } = useRequiredActionsGroupedByPiece({
    actions: excludedRequiredActions,
  });
  const pieceCount = Object.keys(excludedRequiredActions).length;
  const actionCount = Object.values(excludedRequiredActions).flat().length;
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
            : t('excludingActionsRemovesRequiredActions', {
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

export type ExcludingReason = 'removePieces' | 'excludeActions';
