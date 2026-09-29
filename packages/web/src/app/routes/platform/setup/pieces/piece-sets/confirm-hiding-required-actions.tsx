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
import {
  RequiredActionsList,
  useRequiredActionGroups,
} from '@/features/piece-sets';

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
  const { groups } = useRequiredActionGroups({
    actions: hiddenRequiredActions,
  });
  const pieceCount = Object.keys(hiddenRequiredActions).length;
  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('Remove required actions?')}</DialogTitle>
        <DialogDescription>
          {reason === 'removePieces'
            ? t('removingPiecesRemovesRequiredActions', { count: pieceCount })
            : t('hidingActionsRemovesRequiredActions', { count: pieceCount })}
        </DialogDescription>
      </DialogHeader>
      <ScrollArea viewPortClassName="max-h-80">
        <RequiredActionsList groups={groups} />
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

export type HidingReason = 'removePieces' | 'hideActions';
