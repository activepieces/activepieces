import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { mcpApi } from '@/features/mcp/lib/mcp-api';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import type { McpTool } from '@activepieces/shared';
import { isNil, McpToolType } from '@activepieces/shared';

import { McpAddToolDropdown } from '../mcp-add-tool-actions';

import { EmptyTools } from './empty-tools';
import { McpFlowTool } from './mcp-flow-tool';
import { McpPieceTool } from './mcp-piece-tool';

export const McpConfigPage = () => {
  const { toast } = useToast();
  const { mcpId } = useParams<{ mcpId: string }>();
  const { pieces } = piecesHooks.usePieces({});
  const { data: mcp, isLoading, refetch: refetchMcp } = mcpHooks.useMcp(mcpId!);

  const { mutate: removeTool } = useMutation({
    mutationFn: async (toolId: string) => {
      const updatedTools =
        mcp?.tools
          ?.filter((tool) => tool.id !== toolId)
          .map((tool) => ({
            type: tool.type,
            mcpId: tool.mcpId,
            pieceMetadata: tool.pieceMetadata,
            flowId: tool.flowId,
          })) || [];

      return await mcpApi.update(mcpId!, { tools: updatedTools });
    },
    onSuccess: () => {
      toast({
        description: t('Tool removed successfully'),
        duration: 3000,
      });
      refetchMcp();
    },
    onError: (err) => {
      console.error(err);
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to remove tool'),
        duration: 5000,
      });
    },
  });

  if (isLoading) {
    return <LoadingScreen mode="container" />;
  }

  const piecesCount =
    mcp?.tools?.filter((tool: McpTool) => tool.type === McpToolType.PIECE)
      .length || 0;
  const flowsCount =
    mcp?.tools?.filter((tool: McpTool) => tool.type === McpToolType.FLOW)
      .length || 0;
  const totalToolsCount = piecesCount + flowsCount;
  const hasTools = totalToolsCount > 0;

  if (isNil(mcp)) {
    return <LoadingScreen mode="container" />;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="space-y-0">
          <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
            <span>{t('Tools')}</span>
            {totalToolsCount > 0 && (
              <Badge variant="secondary">{totalToolsCount}</Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('Manage your integration tools and automated workflows')}
          </p>
        </div>
        <div className="flex gap-2">
          <McpAddToolDropdown
            mcp={mcp}
            refetchMcp={refetchMcp}
            tools={mcp?.tools || []}
          />
        </div>
      </div>

      <div className="mt-4">
        {hasTools ? (
          <ScrollArea>
            <div className="space-y-2">
              {mcp?.tools &&
                mcp.tools.map((tool) => {
                  if (tool.type === McpToolType.PIECE) {
                    return (
                      <McpPieceTool
                        key={tool.id}
                        mcp={mcp}
                        tool={tool}
                        pieces={pieces || []}
                        removeTool={async () => removeTool(tool.id)}
                      />
                    );
                  } else if (tool.type === McpToolType.FLOW) {
                    return (
                      <McpFlowTool
                        key={tool.id}
                        mcp={mcp}
                        tool={tool}
                        removeTool={async () => removeTool(tool.id)}
                      />
                    );
                  }
                  return null;
                })}
            </div>
          </ScrollArea>
        ) : (
          <EmptyTools />
        )}
      </div>
    </div>
  );
};

McpConfigPage.displayName = 'McpConfigPage';

export default McpConfigPage;
