import { t } from 'i18next';
import { EllipsisVertical, Puzzle, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { AgentTool, AgentToolType } from '@activepieces/shared';

import { agentConfigUtils } from './config-utils';

type AgentPieceToolProps = {
  disabled?: boolean;
  tools: AgentTool[];
  pieces: PieceMetadataModelSummary[];
  removeTool: (toolIds: string[]) => Promise<void>;
};

type PieceInfo = {
  displayName: string;
  logoUrl?: string;
};

export const AgentPieceTool = ({
  disabled,
  tools,
  pieces,
  removeTool,
}: AgentPieceToolProps) => {
  const [open, setOpen] = useState(false);

  const getPieceInfo = (tool: AgentTool) => {
    if (tool.type !== AgentToolType.PIECE || !tool.pieceMetadata) {
      return { displayName: 'Unknown', logoUrl: undefined };
    }

    const pieceMetadata = pieces?.find(
      (p) => p.name === tool.pieceMetadata?.pieceName,
    );
    return {
      displayName: pieceMetadata?.displayName || tool.pieceMetadata.pieceName,
      logoUrl: pieceMetadata?.logoUrl,
    };
  };

  const pieceInfoMap: Record<string, PieceInfo> = {};
  tools.forEach((tool: AgentTool) => {
    pieceInfoMap[tool.toolName] = getPieceInfo(tool);
  });

  const actionDisplayNames = tools
    .map((tool) => {
      if (tool.type === AgentToolType.PIECE) {
        return tool.pieceMetadata?.actionName;
      }
      return undefined;
    })
    .filter((name) => name !== undefined);

  const toolName =
    tools[0].type === AgentToolType.PIECE
      ? pieceInfoMap[tools[0].toolName]?.displayName
      : undefined;

  return (
    <Card key={`piece-${toolName}`}>
      <CardContent className="flex items-center justify-between p-3 min-h-[48px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            {pieceInfoMap[tools[0].toolName]?.logoUrl ? (
              <img
                src={pieceInfoMap[tools[0].toolName].logoUrl}
                alt={pieceInfoMap[tools[0].toolName].displayName}
                className="h-5 w-5 object-contain"
              />
            ) : (
              <Puzzle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium truncate">
              {`${pieceInfoMap[tools[0].toolName]?.displayName}`}
            </h3>
            <span className="text-xs text-muted-foreground">
              {agentConfigUtils.formatNames(actionDisplayNames)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
              disabled={disabled}
              className="rounded-full p-2 hover:bg-muted cursor-pointer"
              asChild
            >
              <EllipsisVertical className="h-8 w-8" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              noAnimationOnOut={true}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <ConfirmationDeleteDialog
                title={`${t('Delete')} ${toolName}`}
                message={t('Are you sure you want to delete this tool?')}
                mutationFn={async () =>
                  await removeTool(tools.map((tool) => tool.toolName))
                }
                entityName={t('Tool')}
              >
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <div className="flex cursor-pointer flex-row gap-2 items-center">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">{t('Delete')}</span>
                  </div>
                </DropdownMenuItem>
              </ConfirmationDeleteDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
