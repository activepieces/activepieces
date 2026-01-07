import Fuse from 'fuse.js';
import { t } from 'i18next';
import { Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { Input } from '@/components/ui/input';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 200);

  const selectedActionNames = useMemo(
    () => new Set(tools.map((tool) => tool.toolName)),
    [tools],
  );

  const fuse = useMemo(() => {
    if (!piece.suggestedActions) return null;

    return new Fuse(piece.suggestedActions, {
      keys: [
        { name: 'displayName', weight: 0.8 },
        { name: 'description', weight: 0.2 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [piece.suggestedActions]);

  const filteredActions = useMemo(() => {
    if (!piece.suggestedActions) return [];
    if (!debouncedQuery.trim()) return piece.suggestedActions;
    if (!fuse) return piece.suggestedActions;

    return fuse.search(debouncedQuery).map((r) => r.item);
  }, [debouncedQuery, fuse, piece.suggestedActions]);

  return (
    <ScrollArea className="overflow-y-auto">
      <div className="px-4 py-3 border-b">
        <div className="relative border rounded-sm">
          <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={t('Search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 shadow-none border-none"
          />
        </div>
      </div>

      <div className="flex p-4 flex-col gap-2">
        {filteredActions.map((action) => {
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
                <div className="size-9 flex items-center justify-center rounded-sm border bg-background">
                  <img
                    className="size-6 object-contain"
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

        {filteredActions.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {t('No actions found')}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
