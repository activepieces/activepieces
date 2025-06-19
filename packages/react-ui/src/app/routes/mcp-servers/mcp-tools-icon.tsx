import { t } from 'i18next';
import { WorkflowIcon } from 'lucide-react';

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { McpToolType } from '@activepieces/shared';

interface McpToolsIconProps {
  mcpId: string;
  size?: 'md' | 'xs';
  square?: boolean;
}

const ICON_SIZE_MAP = {
  md: {
    piece: 'md',
    container: 'size-[36px] p-2',
    workflowIcon: 16,
    extra: 'size-[36px] p-1 text-sm',
    gap: 'gap-2',
  },
  xs: {
    piece: 'xs',
    container: 'size-[20px] p-1',
    workflowIcon: 12,
    extra: 'size-[20px] p-1 text-xs',
    gap: 'gap-2',
  },
};

export const McpToolsIcon = ({
  mcpId,
  size = 'md',
  square = false,
}: McpToolsIconProps) => {
  const { pieces: allPiecesMetadata, isLoading: isLoadingPiecesMetadata } =
    piecesHooks.usePieces({});

  const { data: mcpData, isLoading: isLoadingMcp } = mcpHooks.useMcp(mcpId);

  const pieceMetadataMap = allPiecesMetadata
    ? new Map(allPiecesMetadata.map((p) => [p.name, p]))
    : new Map<string, PieceMetadataModelSummary>();

  if (isLoadingPiecesMetadata || isLoadingMcp) {
    return <div className="text-left"></div>;
  }

  const mcpTools = mcpData?.tools || [];

  const MAX_ICONS_TO_SHOW = 3;
  const visibleTools = mcpTools.slice(0, MAX_ICONS_TO_SHOW);
  const extraToolsCount = mcpTools.length - visibleTools.length;

  const allDisplayNames = mcpTools.map((tool) => {
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

  const iconStyle = ICON_SIZE_MAP[size];

  const getShapeClass = () => {
    return square ? 'rounded-[2px]' : 'rounded-full';
  };

  const getBorderClass = () => {
    return square ? '' : 'border border-solid';
  };

  return (
    <div className="text-left flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center ${iconStyle.gap}`}>
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
                    size={iconStyle.piece as 'md' | 'xs' | 'sm' | 'lg' | 'xxl' | 'xl'}
                    circle={!square}
                    border={!square}
                    showTooltip={false}
                  />
                );
              } else {
                return (
                  <div
                    key={tool.id}
                    className={`bg-accent/35 ${getShapeClass()} ${getBorderClass()} flex items-center justify-center ${iconStyle.container}`}
                  >
                    <WorkflowIcon
                      size={iconStyle.workflowIcon}
                      className="w-full h-full"
                      strokeWidth={1.5}
                    />
                  </div>
                );
              }
            })}
            {extraToolsCount > 0 && (
              <div
                className={`flex items-center justify-center bg-accent/35 text-accent-foreground ${getShapeClass()} ${getBorderClass()} select-none ${iconStyle.extra}`}
              >
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
