import { Puzzle, X } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { AgentPieceTool } from '@activepieces/shared';

import { useAgentToolsStore } from '../store';

type AgentPieceToolProps = {
  disabled?: boolean;
  tools: AgentPieceTool[];
  pieces: PieceMetadataModelSummary[];
  removeTool: (toolName: string) => void;
};

export const AgentPieceToolComponent = ({
  disabled,
  tools,
  pieces,
  removeTool,
}: AgentPieceToolProps) => {
  const { openPieceDialog } = useAgentToolsStore();

  const pieceMetadata = pieces.find(
    (p) => p.name === tools[0].pieceMetadata.pieceName,
  );

  if (!pieceMetadata) return null;

  const handleEditTool = (tool: AgentPieceTool) => {
    openPieceDialog('action-selected', tool);
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="piece">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
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
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => (
              <Card
                key={tool.toolName}
                onClick={() => handleEditTool(tool)}
                className={`
                  group flex items-center gap-2 px-3 py-1.5 cursor-pointer
                  rounded-sm border bg-muted/50
                  ${disabled ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <span className="text-xs font-medium">{tool.toolName}</span>

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
                    <TooltipContent>Remove tool</TooltipContent>
                  </Tooltip>
                </div>
              </Card>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
