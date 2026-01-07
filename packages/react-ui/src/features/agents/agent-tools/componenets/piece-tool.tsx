import { t } from 'i18next';
import { Plus, Puzzle, X } from 'lucide-react';
import { useMemo } from 'react';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { PieceStepMetadataWithSuggestions } from '@/lib/types';
import { AgentPieceTool } from '@activepieces/shared';

import { useAgentToolsStore } from '../store';

type AgentPieceToolProps = {
  disabled?: boolean;
  tools: AgentPieceTool[];
  removeTool: (toolName: string) => void;
};

export const AgentPieceToolComponent = ({
  disabled,
  tools,
  removeTool,
}: AgentPieceToolProps) => {
  const { openPieceDialog } = useAgentToolsStore();

  const { metadata } = stepsHooks.useAllStepsMetadata({
    searchQuery: '',
    type: 'action',
  });

  const piecesMetadata = useMemo(() => {
    return metadata?.filter(
      (m): m is PieceStepMetadataWithSuggestions =>
        'suggestedActions' in m && 'suggestedTriggers' in m,
    );
  }, [metadata]);

  const pieceMetadata = piecesMetadata?.find(
    (p) => p.pieceName === tools[0].pieceMetadata.pieceName,
  );

  if (!pieceMetadata) {
    return (
      <div className="flex  w-full items-center justify-between px-3 h-12  border-b last:border-0 py-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-md" />
          <Skeleton className="h-4 w-32" />
        </div>

        <Skeleton className="h-4 w-4 rounded-sm" />
      </div>
    );
  }

  const handleEditTool = (tool: AgentPieceTool) => {
    openPieceDialog({ defaultPage: 'action-selected', tool });
  };

  return (
    <AccordionItem
      value={pieceMetadata.pieceName}
      className="border-b last:border-0"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-accent transition-all">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
              {pieceMetadata.logoUrl ? (
                <img
                  src={pieceMetadata.logoUrl}
                  alt={pieceMetadata.displayName}
                  className="h-5 w-5 object-contain"
                />
              ) : (
                <Puzzle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <span className="text-sm font-medium">
              {pieceMetadata.displayName}
            </span>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 py-2">
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => {
            const toolName = pieceMetadata.suggestedActions?.find(
              (action) =>
                `${pieceMetadata.pieceName}-${action.name}` === tool.toolName,
            )?.displayName;
            return (
              <div
                key={tool.toolName}
                onClick={() => handleEditTool(tool)}
                className={`
                  group flex items-center gap-2 px-3 py-1 cursor-pointer
                  rounded-full border bg-muted/50
                  ${disabled ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <span className="text-xs font-medium">
                  {toolName || tool.toolName}
                </span>

                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        disabled={disabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTool(tool.toolName);
                        }}
                        variant="ghost"
                        size="icon"
                        className="
                          size-5 p-0.5
                          text-muted-foreground
                          hover:text-destructive
                          hover:bg-destructive/10
                          transition
                        "
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('Remove tool')}</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
        <Button
          variant="link"
          className="mt-4"
          size="xs"
          onClick={() =>
            openPieceDialog({
              defaultPage: 'piece-selected',
              piece: pieceMetadata,
            })
          }
        >
          <Plus className="size-3 mr-1" />
          {t('Add Action')}
        </Button>
      </AccordionContent>
    </AccordionItem>
  );
};
