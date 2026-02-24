import Fuse from 'fuse.js';
import { t } from 'i18next';
import { Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AgentTool, isNil } from '@activepieces/shared';

import { sanitizeToolName } from '../../componenets/piece-tool';
import { usePieceToolsDialogStore } from '../../stores/pieces-tools';

interface PieceActionsDialogProps {
  tools: AgentTool[];
}

export const PieceActionsList: React.FC<PieceActionsDialogProps> = ({
  tools,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 200);
  const { handleActionSelect, selectedPiece } = usePieceToolsDialogStore();

  const selectedActionNames = useMemo(
    () => new Set(tools.map((tool) => tool.toolName)),
    [tools],
  );

  const fuse = useMemo(() => {
    if (isNil(selectedPiece) || isNil(selectedPiece.suggestedActions))
      return null;

    return new Fuse(selectedPiece.suggestedActions, {
      keys: [
        { name: 'displayName', weight: 0.8 },
        { name: 'description', weight: 0.2 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, [selectedPiece?.suggestedActions]);

  const filteredActions = useMemo(() => {
    if (!debouncedQuery.trim() || isNil(fuse))
      return selectedPiece?.suggestedActions || [];

    return fuse.search(debouncedQuery).map((r) => r.item);
  }, [debouncedQuery, fuse, selectedPiece?.suggestedActions]);

  if (isNil(selectedPiece)) {
    return <p>{t('No app is selected')}</p>;
  }

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
          const isDisabled = selectedActionNames.has(
            sanitizeToolName(`${selectedPiece.pieceName}-${action.name}`),
          );

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
                  handleActionSelect(action);
                }
              }}
            >
              <div className="flex gap-2">
                <div className="size-9 flex items-center justify-center rounded-sm border bg-background">
                  <img
                    className="size-6 object-contain"
                    src={selectedPiece.logoUrl}
                    alt={selectedPiece.displayName}
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
