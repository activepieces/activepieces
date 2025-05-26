import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Workflow,
  Puzzle,
} from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { mcpToolApi } from '@/features/mcp/lib/mcp-tool-api';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import type { McpToolWithPiece, McpToolWithFlow } from '@activepieces/shared';
import { McpToolType } from '@activepieces/shared';

import McpToolDialog from './mcp-tool-dialog';

export const McpConfigPage = () => {
  const [showAddPieceDialog, setShowAddPieceDialog] = useState(false);
  const [showEditPieceDialog, setShowEditPieceDialog] = useState(false);
  const [selectedPieceToEdit, setSelectedPieceToEdit] =
    useState<McpToolWithPiece | null>(null);
  const [activeTab, setActiveTab] = useState<'pieces' | 'flows'>('pieces');
  const { mcpId } = useParams<{ mcpId: string }>();
  const { toast } = useToast();

  const { data: mcp, isLoading, refetch: refetchMcp } = mcpHooks.useMcp(mcpId!);

  const { pieces } = piecesHooks.usePieces({});

  const removePieceMutation = useMutation({
    mutationFn: async (pieceId: string) => mcpToolApi.delete(pieceId),
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

  const removeTool = async (tool: McpToolWithPiece | McpToolWithFlow) => {
    if (!mcp?.id || removePieceMutation.isPending) return;
    removePieceMutation.mutate(tool.id);
  };

  const getPieceInfo = (mcpPiece: McpToolWithPiece) => {
    const pieceMetadata = pieces?.find(
      (p) => p.name === mcpPiece.piece.pieceName,
    );
    return {
      displayName: pieceMetadata?.displayName || mcpPiece.piece.pieceName,
      logoUrl: pieceMetadata?.logoUrl,
    };
  };

  const pieceInfoMap: Record<
    string,
    { displayName: string; logoUrl?: string }
  > = {};
  mcp?.tools?.forEach((mcpPiece) => {
    if (mcpPiece.data.type === McpToolType.PIECE) {
      pieceInfoMap[mcpPiece.id] = getPieceInfo(mcpPiece as McpToolWithPiece);
    }
  });

  if (isLoading) {
    return <LoadingScreen mode="container" />;
  }

  const piecesCount = mcp?.tools?.length || 0;
  const flowsCount = 0;
  const totalToolsCount = piecesCount + flowsCount;
  const hasTools = totalToolsCount > 0;

  return (
    <div className="max-w-[800px] py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>{t('Tools')}</span>
            {totalToolsCount > 0 && (
              <Badge variant="secondary">{totalToolsCount}</Badge>
            )}
          </h2>
          <div className="flex gap-2">
            <McpToolDialog
              mcpId={mcpId!}
              open={showAddPieceDialog}
              mode="add"
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onSuccess={() => {
                refetchMcp();
                setShowAddPieceDialog(false);
              }}
              onClose={() => setShowAddPieceDialog(false)}
            >
              <Button onClick={() => setShowAddPieceDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('Add Tool')}
              </Button>
            </McpToolDialog>
          </div>
        </div>
        <p className="text-muted-foreground">
          {t('Manage your integration tools and automated workflows')}
        </p>
      </div>

      <div className="space-y-6">
        {hasTools ? (
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div className="space-y-2">
              {mcp?.tools &&
                mcp.tools.map((tool) => {
                  if (tool.data.type === McpToolType.PIECE) {
                    const piece = tool as McpToolWithPiece;
                    const actionNames =
                      'actionNames' in piece.data
                        ? piece.data.actionNames
                        : undefined;

                    return (
                      <div
                        key={`piece-${piece.id}`}
                        className="group flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                            {pieceInfoMap[piece.id]?.logoUrl ? (
                              <img
                                src={pieceInfoMap[piece.id].logoUrl}
                                alt={pieceInfoMap[piece.id].displayName}
                                className="h-5 w-5 object-contain"
                              />
                            ) : (
                              <Puzzle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium truncate">
                              {pieceInfoMap[piece.id].displayName}
                            </h3>
                            {actionNames &&
                              actionNames
                                .slice(0, 3)
                                .map((action: string, idx: number) => (
                                  <span
                                    key={idx}
                                    className="text-xs text-muted-foreground"
                                  >
                                    {action}
                                    {idx < Math.min(2, actionNames.length - 1)
                                      ? ', '
                                      : ''}
                                  </span>
                                ))}
                            {actionNames && actionNames.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                {' '}
                                {t('and')} {actionNames.length - 3} {t('more')}
                              </span>
                            )}
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <McpToolDialog
                                mcpId={mcpId!}
                                mcpPieceToUpdate={piece}
                                mode="edit"
                                open={
                                  showEditPieceDialog &&
                                  selectedPieceToEdit?.id === piece.id
                                }
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                onSuccess={() => {
                                  refetchMcp();
                                  setShowEditPieceDialog(false);
                                  setSelectedPieceToEdit(null);
                                }}
                                onClose={() => {
                                  setShowEditPieceDialog(false);
                                  setSelectedPieceToEdit(null);
                                }}
                              >
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setSelectedPieceToEdit(piece);
                                    setShowEditPieceDialog(true);
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  {t('Edit')}
                                </DropdownMenuItem>
                              </McpToolDialog>
                              <DropdownMenuItem
                                className="text-destructive flex items-center gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTool(piece);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                {t('Delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  } else if (tool.data.type === McpToolType.FLOW) {
                    const flowTool = tool as McpToolWithFlow;

                    return (
                      <div
                        key={`flow-${tool.id}`}
                        className="group flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                            <Workflow className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium truncate">
                              {t('Flow')}
                            </h3>
                            {flowTool.flows.slice(0, 3).map((flow, idx) => (
                              <span
                                key={flow.id}
                                className="text-xs text-muted-foreground"
                              >
                                {flow.version.displayName}
                                {idx < Math.min(2, flowTool.flows.length - 1)
                                  ? ', '
                                  : ''}
                              </span>
                            ))}
                            {flowTool.flows.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                {' '}
                                {t('and')} {flowTool.flows.length - 3}{' '}
                                {t('more')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {flowTool.flows.length > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                              <span className="text-xs text-muted-foreground">
                                {flowTool.flows.length}
                              </span>
                            </div>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setActiveTab('flows');
                                  setShowAddPieceDialog(true);
                                }}
                                className="flex items-center gap-2"
                              >
                                <Edit2 className="h-4 w-4" />
                                {t('Edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive flex items-center gap-2"
                                onClick={() => {
                                  removeTool(flowTool);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                {t('Delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 space-y-4 border rounded-lg bg-muted/20">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Puzzle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium">{t('No Tools Added Yet')}</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {t('Add your first tool to start building powerful integrations')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

McpConfigPage.displayName = 'McpConfigPage';

export default McpConfigPage;
