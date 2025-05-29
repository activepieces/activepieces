import { t } from 'i18next';
import { Puzzle, Trash2 } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { McpTool, McpToolType, McpWithTools } from '@activepieces/shared';

import { mcpConfigUtils } from './mcp-config-utils';

type McpPieceToolProps = {
  mcp: McpWithTools;
  tool: McpTool;
  pieces: PieceMetadataModelSummary[];
  removeTool: (toolId: string) => Promise<void>;
};

type PieceInfo = {
  displayName: string;
  logoUrl?: string;
};

export const McpPieceTool = ({
  mcp,
  tool,
  pieces,
  removeTool,
}: McpPieceToolProps) => {
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

  const actionNames = tool.pieceMetadata?.actionNames || [];

  return (
    <div
      key={`piece-${tool.id}`}
      className="group flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
          {pieceInfoMap[tool.id]?.logoUrl ? (
            <img
              src={pieceInfoMap[tool.id].logoUrl}
              alt={pieceInfoMap[tool.id].displayName}
              className="h-5 w-5 object-contain"
            />
          ) : (
            <Puzzle className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-medium truncate">
            {pieceInfoMap[tool.id]?.displayName || 'Unknown Piece'}
          </h3>
          <span className="text-xs text-muted-foreground">
            {mcpConfigUtils.formatNames(actionNames)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actionNames && actionNames.length > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">
              {actionNames.length}
            </span>
          </div>
        )}
        <ConfirmationDeleteDialog
          title={`${t('Delete')} ${pieceInfoMap[tool.id]?.displayName}`}
          message={t('Are you sure you want to delete this tool?')}
          mutationFn={() => removeTool(tool.id)}
          showToast={true}
          entityName={t('Tool')}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </ConfirmationDeleteDialog>
      </div>
    </div>
  );
};
