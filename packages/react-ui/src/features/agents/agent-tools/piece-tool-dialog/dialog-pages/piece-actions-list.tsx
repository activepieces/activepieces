import { t } from 'i18next';
import React, { useMemo } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { PieceStepMetadataWithSuggestions } from '@/lib/types';
import { ActionBase } from '@activepieces/pieces-framework';
import { AgentTool } from '@activepieces/shared';

interface PieceActionsDialogProps {
  piece: PieceStepMetadataWithSuggestions;
  setSelectedAction: (action: ActionBase) => void;
  tools: AgentTool[];
}

export const PieceActionsList: React.FC<PieceActionsDialogProps> = ({
  piece,
  tools,
  setSelectedAction,
}) => {
  const selectedActionNames = useMemo(
    () => new Set(tools.map((tool) => tool.toolName)),
    [tools],
  );

  return (
    <ScrollArea className="flex-grow overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        {piece.suggestedActions &&
          piece.suggestedActions.map((action) => {
            const isDisabled = selectedActionNames.has(action.name);

            return (
              <div
                key={action.name}
                className={`
                  p-2 flex items-center gap-x-2 rounded-lg transition
                  ${
                    isDisabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-accent cursor-pointer'
                  }
                `}
                onClick={() => {
                  if (!isDisabled) {
                    setSelectedAction(action);
                  }
                }}
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

                      {isDisabled && (
                        <span className="text-xs text-muted-foreground">
                          {t('(Already added)')}
                        </span>
                      )}
                    </div>

                    {action.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {action.description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {piece.suggestedActions && piece.suggestedActions.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {t('No actions available')}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
