import { t } from 'i18next';
import { EllipsisVertical, Puzzle, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  McpTool,
  McpToolType,
  McpWithTools,
  Permission,
} from '@activepieces/shared';

import { mcpConfigUtils } from './mcp-config-utils';

type McpPieceToolProps = {
  mcp: McpWithTools;
  tools: McpTool[];
  pieces: PieceMetadataModelSummary[];
  removeTool: (toolIds: string[]) => Promise<void>;
};

type PieceInfo = {
  displayName: string;
  logoUrl?: string;
};

export const McpPieceTool = ({
  mcp,
  tools,
  pieces,
  removeTool,
}: McpPieceToolProps) => {
  const [open, setOpen] = useState(false);
  const { checkAccess } = useAuthorization();
  const hasPermissionToWriteMcp = checkAccess(Permission.WRITE_MCP);

  const getPieceInfo = (mcpTool: McpTool) => {
    if (mcpTool.type !== McpToolType.PIECE || !mcpTool.pieceMetadata) {
      return { displayName: 'Unknown', logoUrl: undefined };
    }

    const pieceMetadata = pieces?.find(
      (p) => p.name === mcpTool.pieceMetadata?.pieceName,
    );
    return {
      displayName:
        pieceMetadata?.displayName || mcpTool.pieceMetadata.pieceName,
      logoUrl: pieceMetadata?.logoUrl,
    };
  };

  const pieceInfoMap: Record<string, PieceInfo> = {};
  mcp.tools.forEach((mcpTool: McpTool) => {
    pieceInfoMap[mcpTool.id] = getPieceInfo(mcpTool);
  });

  const actionDisplayNames = tools
    .map((tool) => {
      if (tool.type === McpToolType.PIECE) {
        return tool.pieceMetadata?.actionDisplayName;
      }
      return undefined;
    })
    .filter((name) => name !== undefined);

  const toolName =
    tools[0].type === McpToolType.PIECE
      ? pieceInfoMap[tools[0].id]?.displayName
      : undefined;

  return (
    <Card key={`piece-${toolName}`}>
      <CardContent className="flex items-center justify-between p-3 min-h-[48px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
            {pieceInfoMap[tools[0].id]?.logoUrl ? (
              <img
                src={pieceInfoMap[tools[0].id].logoUrl}
                alt={pieceInfoMap[tools[0].id].displayName}
                className="h-5 w-5 object-contain"
              />
            ) : (
              <Puzzle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium truncate">
              {`${pieceInfoMap[tools[0].id]?.displayName}`}
            </h3>
            <span className="text-xs text-muted-foreground">
              {mcpConfigUtils.formatNames(actionDisplayNames)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger
              className="rounded-full p-2 hover:bg-muted cursor-pointer"
              asChild
            >
              <EllipsisVertical className="h-8 w-8" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              noAnimationOnOut={true}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <PermissionNeededTooltip hasPermission={hasPermissionToWriteMcp}>
                <ConfirmationDeleteDialog
                  title={`${t('Delete')} ${toolName}`}
                  message={t('Are you sure you want to delete this tool?')}
                  mutationFn={async () =>
                    await removeTool(tools.map((tool) => tool.id))
                  }
                  entityName={t('Tool')}
                >
                  <DropdownMenuItem
                    disabled={!hasPermissionToWriteMcp}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <div className="flex cursor-pointer flex-row gap-2 items-center">
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="text-destructive">{t('Delete')}</span>
                    </div>
                  </DropdownMenuItem>
                </ConfirmationDeleteDialog>
              </PermissionNeededTooltip>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
