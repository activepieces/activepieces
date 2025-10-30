import { t } from 'i18next';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import type { McpTool, McpToolRequest } from '@activepieces/shared';
import { isNil, McpToolType } from '@activepieces/shared';

import { McpAddToolDropdown } from './mcp-add-tool-actions';
import { McpFlowTool } from './mcp-flow-tool';
import { McpPieceTool } from './mcp-piece-tool';

interface McpToolsSectionProps {
  tools?: McpTool[];
  isLoading: boolean;
  description?: string;
  emptyState?: React.ReactNode;
  onToolsUpdate: (tools: McpToolRequest[]) => void;
  disabled?: boolean;
}

export const McpToolsSection = ({
  disabled,
  tools,
  isLoading,
  description,
  emptyState,
  onToolsUpdate,
}: McpToolsSectionProps) => {
  const { pieces } = piecesHooks.usePieces({});

  if (isNil(tools) || isLoading) {
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

  const removeTool = async (toolIds: string[]): Promise<void> => {
    const newTools = tools.filter(
      (tool: McpTool) => !toolIds.includes(tool.toolName),
    );
    onToolsUpdate(newTools);
  };

  const piecesCount =
    tools.filter((tool: McpTool) => tool.type === McpToolType.PIECE).length ||
    0;
  const flowsCount =
    tools.filter((tool: McpTool) => tool.type === McpToolType.FLOW).length || 0;
  const totalToolsCount = piecesCount + flowsCount;
  const hasTools = totalToolsCount > 0;
  const pieceToToolMap = tools.reduce((acc, tool) => {
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
          <h2 className="text-sm flex font-medium items-center gap-2">
            {t('Tools')}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <McpAddToolDropdown
            disabled={disabled}
            onToolsUpdate={(tools) => {
              onToolsUpdate?.(tools);
            }}
            tools={tools}
          />
        </div>
      </div>

      <div className="mt-2">
        {hasTools ? (
          <ScrollArea>
            <div className="space-y-2">
              {pieceToToolMap &&
                Object.entries(pieceToToolMap).map(([toolKey, tools]) => {
                  if (tools[0].type === McpToolType.PIECE) {
                    return (
                      <McpPieceTool
                        disabled={disabled}
                        key={toolKey}
                        tools={tools}
                        pieces={pieces || []}
                        removeTool={removeTool}
                      />
                    );
                  } else if (tools[0].type === McpToolType.FLOW) {
                    return (
                      <McpFlowTool
                        disabled={disabled}
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
