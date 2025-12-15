import { t } from 'i18next';
import React from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { PieceStepMetadataWithSuggestions } from '@/lib/types';
import { ActionBase } from '@activepieces/pieces-framework';

interface PieceActionsDialogProps {
  piece: PieceStepMetadataWithSuggestions;
  setSelectedAction: (action: ActionBase) => void;
}

export const PieceActionsList: React.FC<PieceActionsDialogProps> = ({
  piece,
  setSelectedAction,
}) => {
  return (
    <ScrollArea className="flex-grow overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        {piece.suggestedActions &&
          piece.suggestedActions.map((action) => (
            <div
              key={action.name}
              className="p-2 flex items-center gap-x-2 hover:bg-accent cursor-pointer rounded-lg"
              onClick={() => setSelectedAction(action)}
            >
              <div className="flex gap-2">
                <div className="size-9 flex items-center justify-center rounded-sm aspect-square border bg-background">
                  <img
                    className="size-6 rounded-full"
                    src={piece.logoUrl}
                    alt={piece.displayName}
                  />
                </div>
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
  );
};
