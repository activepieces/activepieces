import { t } from 'i18next';
import { Hammer } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import type {
  McpTool,
  McpToolRequest,
  McpWithTools,
} from '@activepieces/shared';
import { isNil, McpToolType } from '@activepieces/shared';

import { McpAddToolDropdown } from '../mcp-add-tool-actions';

import { McpFlowTool } from './mcp-flow-tool';
import { McpPieceTool } from './mcp-piece-tool';

interface McpToolsSectionProps {
  mcp: McpWithTools | undefined;
  isLoading: boolean;
  description: string;
  emptyState?: React.ReactNode;
  onToolsUpdate: (tools: McpToolRequest[]) => void;
}

export const McpToolsSection = ({
  mcp,
  isLoading,
  description,
  emptyState,
  onToolsUpdate,
}: McpToolsSectionProps) => {
  const { pieces } = piecesHooks.usePieces({});

  const removeTool = async (toolIds: string[]): Promise<void> => {
    if (!mcp || !onToolsUpdate) return;
    const newTools = mcp.tools.filter(
      (tool: McpTool) => !toolIds.includes(tool.id),
    );
    onToolsUpdate(newTools);
  };

  if (isNil(mcp) || isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  const piecesCount =
    mcp?.tools?.filter((tool: McpTool) => tool.type === McpToolType.PIECE)
      .length || 0;
  const flowsCount =
    mcp?.tools?.filter((tool: McpTool) => tool.type === McpToolType.FLOW)
      .length || 0;
  const totalToolsCount = piecesCount + flowsCount;
  const hasTools = totalToolsCount > 0;
  const pieceToToolMap = mcp?.tools?.reduce((acc, tool) => {
    const key =
      tool.type === McpToolType.PIECE
        ? tool.pieceMetadata?.pieceName
        : tool.flowId;

    if (key) {
      acc[key] = acc[key] || [];
      acc[key].push(tool);
    }

    return acc;
  }, {} as Record<string, McpTool[]>);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="space-y-0">
          <h1 className="text-lg flex items-center gap-2">
            <Hammer className="w-4 h-4" />
            <span>{t('Tools')}</span>
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          <McpAddToolDropdown
            mcp={mcp}
            onToolsUpdate={(tools) => {
              onToolsUpdate?.(tools);
            }}
            tools={mcp?.tools || []}
          />
        </div>
      </div>

      <div className="mt-4">
        {hasTools ? (
          <ScrollArea>
            <div className="space-y-2">
              {pieceToToolMap &&
                Object.entries(pieceToToolMap).map(([toolKey, tools]) => {
                  if (tools[0].type === McpToolType.PIECE) {
                    return (
                      <McpPieceTool
                        key={toolKey}
                        mcp={mcp}
                        tools={tools}
                        pieces={pieces || []}
                        removeTool={removeTool}
                      />
                    );
                  } else if (tools[0].type === McpToolType.FLOW) {
                    return (
                      <McpFlowTool
                        key={toolKey}
                        tool={tools[0]}
                        removeTool={removeTool}
                      />
                    );
                  }
                  return null;
                })}
            </div>
          </ScrollArea>
        ) : !isNil(emptyState) ? (
          emptyState
        ) : null}
      </div>
    </div>
  );
};
