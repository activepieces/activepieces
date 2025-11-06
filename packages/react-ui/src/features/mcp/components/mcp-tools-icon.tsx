import { t } from 'i18next';
import { WorkflowIcon } from 'lucide-react';

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { McpToolType, McpWithTools } from '@activepieces/shared';

interface McpToolsIconProps {
  mcpTools: McpWithTools['tools'];
  pieceMetadataMap: Map<string, PieceMetadataModelSummary>;
  isLoadingPiecesMetadata: boolean;
}

export const McpToolsIcon = ({
  mcpTools,
  pieceMetadataMap,
  isLoadingPiecesMetadata,
}: McpToolsIconProps) => {
  if (isLoadingPiecesMetadata) {
    return <div className="text-left">{t('Loading...')}</div>;
  }

  const MAX_ICONS_TO_SHOW = 3;
  const uniqueMcpTools = mcpTools.filter((tool, index, self) => {
    if (tool.type === McpToolType.PIECE && tool.pieceMetadata) {
      return (
        self.findIndex(
          (t) =>
            t.type === McpToolType.PIECE &&
            t.pieceMetadata?.pieceName === tool.pieceMetadata.pieceName,
        ) === index
      );
    }
    return true;
  });

  const visibleTools = uniqueMcpTools.slice(0, MAX_ICONS_TO_SHOW);
  const extraToolsCount = uniqueMcpTools.length - visibleTools.length;

  const allDisplayNames = uniqueMcpTools.map((tool) => {
    if (tool.type === McpToolType.PIECE && tool.pieceMetadata) {
      return (
        pieceMetadataMap.get(tool.pieceMetadata.pieceName)?.displayName ||
        tool.pieceMetadata.pieceName
      );
    } else {
      return 'Flow';
    }
  });

  let toolDisplayNamesTooltip = '';
  if (allDisplayNames.length === 1) {
    toolDisplayNamesTooltip = allDisplayNames[0];
  } else if (allDisplayNames.length > 1) {
    toolDisplayNamesTooltip =
      allDisplayNames.slice(0, -1).join(', ') +
      ` ${t('and')} ${allDisplayNames[allDisplayNames.length - 1]}`;
  }

  return (
    <div className="text-left flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            {visibleTools.map((tool) => {
              const metadata =
                tool.type === McpToolType.PIECE && tool.pieceMetadata
                  ? pieceMetadataMap.get(tool.pieceMetadata.pieceName)
                  : undefined;
              if (metadata) {
                return (
                  <PieceIcon
                    key={tool.id}
                    logoUrl={metadata?.logoUrl}
                    displayName={
                      metadata?.displayName ||
                      (tool.type === McpToolType.PIECE && tool.pieceMetadata
                        ? tool.pieceMetadata.pieceName
                        : 'Flow')
                    }
                    size="md"
                    circle={true}
                    border={true}
                    showTooltip={false}
                  />
                );
              } else {
                return (
                  <div
                    key={tool.id}
                    className={
                      'bg-accent/35 rounded-full p-2 border border-solid size-[36px]'
                    }
                  >
                    <WorkflowIcon
                      size={16}
                      className="w-full h-full"
                      strokeWidth={1.5}
                    />
                  </div>
                );
              }
            })}
            {extraToolsCount > 0 && (
              <div className="flex items-center justify-center bg-accent/35 text-accent-foreground p-1 rounded-full border border-solid select-none size-[36px] text-sm">
                +{extraToolsCount}
              </div>
            )}
          </div>
        </TooltipTrigger>
        {mcpTools.length > 0 && (
          <TooltipContent side="bottom">
            {toolDisplayNamesTooltip}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
};
