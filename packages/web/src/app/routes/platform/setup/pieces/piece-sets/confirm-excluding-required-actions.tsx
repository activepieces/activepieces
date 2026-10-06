import { t } from 'i18next';

import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { RequiredActionGroupHeader } from '@/features/piece-sets';

import { useRequiredActionsGroupedByPiece } from './use-required-actions-grouped-by-piece';

export function ConfirmExcludingRequiredActionsDialog({
  excludedRequiredActions,
  reason,
  onConfirm,
  onCancel,
}: {
  excludedRequiredActions: Record<string, string[]> | null;
  reason: ExcludingReason;
  onConfirm: () => Promise<unknown> | unknown;
  onCancel: () => void;
}) {
  const actionCount = Object.values(excludedRequiredActions ?? {}).flat()
    .length;
  return (
    <ConfirmDialog
      open={excludedRequiredActions !== null}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
      title={t('Remove required actions?')}
      description={
        reason === 'removePieces'
          ? t('blockingPiecesRemovesRequiredActions', { actionCount })
          : t('limitingActionsRemovesRequiredActions', { actionCount })
      }
      consequence={
        <ExcludedRequiredActionsList
          excludedRequiredActions={excludedRequiredActions ?? {}}
        />
      }
      confirmLabel={t('Save and remove')}
      destructive={false}
      onConfirm={onConfirm}
    />
  );
}

function ExcludedRequiredActionsList({
  excludedRequiredActions,
}: {
  excludedRequiredActions: Record<string, string[]>;
}) {
  const { requiredActionsGroupedByPiece } = useRequiredActionsGroupedByPiece({
    actions: excludedRequiredActions,
  });
  return (
    <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
      {requiredActionsGroupedByPiece.map((group) => (
        <div key={group.pieceName} className="flex flex-col">
          <RequiredActionGroupHeader
            displayName={group.displayName}
            logoUrl={group.logoUrl}
          />
          {group.actions.map((action) => (
            <p key={action.name} className="py-1 pl-11 text-sm text-gray-11">
              {action.displayName}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export type ExcludingReason = 'removePieces' | 'excludeActions';
