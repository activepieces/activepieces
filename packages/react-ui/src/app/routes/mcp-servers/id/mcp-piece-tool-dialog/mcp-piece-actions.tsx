import { t } from 'i18next';
import React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { PieceStepMetadataWithSuggestions } from '@/features/pieces/lib/types';
import { isNil } from '@activepieces/shared';

import { ConnectionDropdown } from './connection-dropdown';

interface McpPieceActionsDialogProps {
  piece: PieceStepMetadataWithSuggestions;
  selectedActions: string[];
  onSelectAction: (actionName: string) => void;
  onSelectAll: (checked: boolean) => void;
  selectedConnectionExternalId: string | null;
  setSelectedConnectionExternalId: (
    connectionExternalId: string | null,
  ) => void;
  showValidationErrors?: boolean;
}

export const McpPieceActionsDialog: React.FC<McpPieceActionsDialogProps> = ({
  piece,
  selectedActions,
  onSelectAction,
  onSelectAll,
  selectedConnectionExternalId,
  setSelectedConnectionExternalId,
  showValidationErrors = false,
}) => {
  const { pieces } = piecesHooks.usePieces({});
  const selectedPiece = pieces?.find((p) => p.name === piece.pieceName);

  const allSelected =
    piece.suggestedActions &&
    piece.suggestedActions.length > 0 &&
    piece.suggestedActions.every((a) => selectedActions.includes(a.name));
  const someSelected = selectedActions.length > 0 && !allSelected;

  const pieceHasAuth = selectedPiece && !isNil(selectedPiece.auth);

  return (
    <>
      {pieceHasAuth && (
        <div className="px-3 mb-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">{t('Connection')}</h4>
            <ConnectionDropdown
              piece={selectedPiece}
              value={selectedConnectionExternalId}
              onChange={setSelectedConnectionExternalId}
              placeholder={t('Select a connection')}
              showLabel={false}
              required={true}
              showError={showValidationErrors}
            />
          </div>
        </div>
      )}

      <div className="flex items-center mb-2 gap-4 px-3">
        <Checkbox
          checked={allSelected ? true : someSelected ? 'indeterminate' : false}
          onCheckedChange={(checked) => onSelectAll(!!checked)}
        />
        <span className="text-sm font-bold select-none">{t('Select all')}</span>
      </div>

      <ScrollArea className="flex-grow overflow-y-auto rounded-md">
        <div className="flex flex-col gap-2">
          {piece.suggestedActions &&
            piece.suggestedActions.map((action) => (
              <div
                key={action.name}
                className="flex items-start gap-4 rounded-md px-3 py-2 hover:bg-accent cursor-pointer"
                onClick={() => onSelectAction(action.name)}
              >
                <Checkbox
                  checked={selectedActions.includes(action.name)}
                  onCheckedChange={() => onSelectAction(action.name)}
                  className="mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex gap-2">
                  <img src={piece.logoUrl} alt="" className="w-5 h-5 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {action.displayName}
                      </span>
                    </div>
                    {action.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {action.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          {piece.suggestedActions && piece.suggestedActions.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {t('No actions available')}
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );
};
