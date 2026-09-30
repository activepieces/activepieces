import { isNil } from '@activepieces/core-utils';
import { AgentTool, mcpToolNameUtils } from '@activepieces/shared';
import Fuse from 'fuse.js';
import { t } from 'i18next';
import { Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';

import { LogoPlate } from '@/components/custom/logo-plate';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        <div className="relative border rounded-md">
          <Search className="absolute left-2 top-2.5 size-4 text-gray-11" />
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
            mcpToolNameUtils.createPieceToolName(
              selectedPiece.pieceName,
              action.name,
            ),
          );

          return (
            <div
              key={action.name}
              className={`
                p-2 flex items-center gap-x-2 rounded-lg transition
                ${
                  isDisabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-4 cursor-pointer'
                }
              `}
              onClick={() => {
                if (!isDisabled) {
                  handleActionSelect(action);
                }
              }}
            >
              <div className="flex gap-2">
                <LogoPlate
                  className="size-9 rounded-md p-1.5"
                  border
                  src={selectedPiece.logoUrl}
                  alt={selectedPiece.displayName}
                />

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {action.displayName}
                    </span>

                    {isDisabled && (
                      <span className="text-sm text-gray-11">
                        {t('(Already added)')}
                      </span>
                    )}
                  </div>

                  {action.description && (
                    <div className="text-sm text-gray-11 mt-0.5 line-clamp-2">
                      {action.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredActions.length === 0 && (
          <div className="text-center text-gray-11 py-8">
            {t('No actions found')}
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
