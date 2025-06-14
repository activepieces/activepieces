import { t } from 'i18next';
import { Hammer } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import type { McpTool } from '@activepieces/shared';
import { isNil, McpToolType } from '@activepieces/shared';

import { McpAddToolDropdown } from '../mcp-add-tool-actions';

import { EmptyTools } from './empty-tools';
import { McpFlowTool } from './mcp-flow-tool';
import { McpPieceTool } from './mcp-piece-tool';

interface McpToolsSectionProps {
  mcpId: string;
}

export const McpToolsSection = ({ mcpId }: McpToolsSectionProps) => {
  const { toast } = useToast();
  const { pieces } = piecesHooks.usePieces({});
  const { data: mcp, isLoading, refetch: refetchMcp } = mcpHooks.useMcp(mcpId);

  const { mutate: removeTool } = mcpHooks.useRemoveTool(mcpId, () => {
    toast({
      description: t('Tool removed successfully'),
      duration: 3000,
    });
    refetchMcp();
  });

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

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="space-y-0">
          <h1 className="text-lg flex items-center gap-2">
            <Hammer className="w-4 h-4" />
            <span>{t('Tools')}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('Manage your connected tools and flows')}
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
