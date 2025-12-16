import { Puzzle, X } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { AgentPieceTool } from '@activepieces/shared';

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
  const pieceMetadata = pieces.find(
    (p) => p.name === tools[0].pieceMetadata.pieceName,
  );

  if (!pieceMetadata) return null;

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
                className={`
                  group flex items-center gap-3 px-3 py-1.5
                  rounded-sm border bg-muted/50
                  ${
                    disabled
                      ? 'opacity-50 pointer-events-none'
                      : 'cursor-pointer'
                  }
                `}
              >
                <span
                  className="text-xs font-medium"
                  onClick={() => {
                    console.log('Edit tool:', tool);
                  }}
                >
                  {tool.toolName}
                </span>

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
              </Card>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
