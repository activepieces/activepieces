import { mcpHooks } from "@/features/mcp/lib/mcp-hooks";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuthorization } from "@/hooks/authorization-hooks";
import { FlowStatus, FlowVersionState, Permission } from "@activepieces/shared";
import { flagsHooks } from "@/hooks/flags-hooks";
import { piecesHooks } from "@/features/pieces/lib/pieces-hook";
import { mcpApi } from "@/features/mcp/lib/mcp-api";
import { flowsApi } from "@/features/flows/lib/flows-api";
import { authenticationSession } from "@/lib/authentication-session";
import { t } from 'i18next';
import { assertNotNullOrUndefined } from "@activepieces/shared";
import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import { FlowOperationType, ApFlagId } from "@activepieces/shared";
import type { 
  McpPieceWithConnection,
  Trigger,
  PopulatedFlow,
  FlowOperationRequest,
  McpFlowWithFlow
} from "@activepieces/shared";
import {
  PieceStepMetadataWithSuggestions,
  StepMetadata,
} from '@/features/pieces/lib/types';
import {
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Workflow,
  Puzzle,
  AlertCircle,
  Settings,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CardListEmpty } from "@/components/ui/card-list";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import McpToolDialog from "./mcp-tool-dialog";

export const McpConfigPage = () => {
  const [showAddPieceDialog, setShowAddPieceDialog] = useState(false);
  const { theme } = useTheme();
  const { mcpId } = useParams<{ mcpId: string }>();
  const { data: publicUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAccess } = useAuthorization();
  
  const doesUserHavePermissionToWriteMcp = checkAccess(Permission.WRITE_MCP);
  const doesUserHavePermissionToWriteMcpFlow =
    checkAccess(Permission.WRITE_FLOW) && checkAccess(Permission.WRITE_MCP);

  const { metadata } = piecesHooks.useAllStepsMetadata({
    searchQuery: '',
    type: 'trigger',
  });

  const {
    data: mcp,
    isLoading,
    refetch: refetchMcp,
    error: mcpError,
  } = mcpHooks.useMcp(mcpId!);

  const { data: flowsData, isLoading: isFlowsLoading } = useQuery({
    queryKey: ['mcp-flows'],
    queryFn: async () => {
      const flowsResponse = await mcpApi.getFlows(mcpId!);
      const populatedFlows = await Promise.all(flowsResponse.flows.map(async (mcpFlow: McpFlowWithFlow) => {
        const populatedFlow = await flowsApi.get(mcpFlow.flow.id, {
          versionId: mcpFlow.flow.publishedVersionId || undefined,
        });
        return populatedFlow;
      }));
      return {
        data: populatedFlows,
      };
    },
  });

  const { pieces } = piecesHooks.usePieces({});

  const removePieceMutation = useMutation({
    mutationFn: async (pieceId: string) => mcpApi.deletePiece(pieceId),
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

  const { mutate: createFlow, isPending: isCreateFlowPending } = useMutation({
    mutationFn: async () => {
      const flow = await flowsApi.create({
        projectId: authenticationSession.getProjectId()!,
        displayName: t('Untitled'),
      });
      return flow;
    },
    onSuccess: async (flow) => {
      const triggerMetadata = metadata?.find(
        (m) => (m as PieceStepMetadataWithSuggestions).pieceName === '@activepieces/piece-mcp'
      );
      const trigger = (triggerMetadata as PieceStepMetadataWithSuggestions)
        ?.suggestedTriggers?.find((t: any) => t.name === 'mcp_tool');
      
      assertNotNullOrUndefined(trigger, 'Trigger not found');
      
      const stepData = pieceSelectorUtils.getDefaultStep({
        stepName: 'trigger',
        stepMetadata: triggerMetadata as StepMetadata,
        actionOrTrigger: trigger,
      });

      await applyOperation(flow, {
        type: FlowOperationType.UPDATE_TRIGGER,
        request: stepData as Trigger,
      });

      toast({
        description: t('Flow created successfully'),
        duration: 3000,
      });
      navigate(`/flows/${flow.id}`);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to create flow'),
        duration: 5000,
      });
    },
  });

  const applyOperation = async (
    flow: PopulatedFlow,
    operation: FlowOperationRequest,
  ) => {
    try {
      const updatedFlowVersion = await flowsApi.update(flow.id, operation, true);
      return {
        flowVersion: {
          ...flow.version,
          id: updatedFlowVersion.version.id,
          state: updatedFlowVersion.version.state,
        },
      };
    } catch (error) {
      console.error(error);
    }
  };

  const removePiece = async (piece: McpPieceWithConnection) => {
    if (!mcp?.id || removePieceMutation.isPending) return;
    removePieceMutation.mutate(piece.id);
  };

  const getPieceInfo = (piece: McpPieceWithConnection) => {
    const pieceMetadata = pieces?.find((p) => p.name === piece.pieceName);
    return {
      displayName: pieceMetadata?.displayName || piece.pieceName,
      logoUrl: pieceMetadata?.logoUrl,
    };
  };

  const pieceInfoMap: Record<
  string,
  { displayName: string; logoUrl?: string }
> = {};
mcp?.pieces?.forEach((piece) => {
  pieceInfoMap[piece.id] = getPieceInfo(piece);
});

const handleDeleteFlow = (flowId: string) => {
  // Dummy function for now
  toast({
    description: t('Delete flow functionality coming soon'),
    duration: 3000,
  });
};

const handleEditFlow = (flowId: string) => {
  // Navigate to the flow editor
  navigate(`/flows/${flowId}`);
};

if (isLoading || isFlowsLoading) {
  return <LoadingScreen mode="container" />;
}

const piecesCount = mcp?.pieces?.length || 0;
const flowsCount = flowsData?.data?.length || 0;
const totalToolsCount = piecesCount + flowsCount;
const hasTools = totalToolsCount > 0;

return (
  <div className="w-full py-6 space-y-6">
    <div className="flex flex-col space-y-2">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('Tools Dashboard')}</h1>
        <div className="flex gap-2">
          <McpToolDialog 
            mcpId={mcpId!} 
            onSuccess={() => {
              refetchMcp();
              setShowAddPieceDialog(false);
            }}
            onClose={() => {
              setShowAddPieceDialog(false);
            }}
          >
            <Button>
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
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <span>{t('Tools')}</span>
          {totalToolsCount > 0 && (
            <Badge variant="secondary">
              {totalToolsCount}
            </Badge>
          )}
        </h2>
      </div>

      {hasTools ? (
        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
            {/* Integration Pieces */}
            {mcp?.pieces && mcp.pieces.map((piece) => (
              <Card key={`piece-${piece.id}`} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                    {pieceInfoMap[piece.id]?.logoUrl ? (
                      <img 
                        src={pieceInfoMap[piece.id].logoUrl} 
                        alt={pieceInfoMap[piece.id].displayName} 
                        className="h-6 w-6 object-contain"
                      />
                    ) : (
                      <Puzzle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="text-lg font-semibold truncate">{pieceInfoMap[piece.id].displayName}</h3>
                    <Badge variant="outline" className="text-xs">Integration</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <McpToolDialog mcpId={mcpId!} mcpPieceToUpdate={piece} onSuccess={refetchMcp} onClose={() => {
                        setShowAddPieceDialog(false);
                      }}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2">
                          <Edit2 className="h-4 w-4" />
                          {t('Edit')}
                        </DropdownMenuItem>
                      </McpToolDialog>
                      <DropdownMenuItem 
                        className="text-destructive flex items-center gap-2"
                        onClick={() => removePiece(piece)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('Delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <Separator />
                <CardContent className="p-4 pt-3">
                  {piece.actionNames && piece.actionNames.length > 0 ? (
                    <div>
                      <span className="text-sm text-muted-foreground block mb-2">
                        {t('Available Actions')}:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {piece.actionNames.slice(0, 3).map((action, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                        {piece.actionNames.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-muted">
                            +{piece.actionNames.length - 3} {t('more')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t('No actions available for this tool')}
                    </span>
                  )}
                </CardContent>
                <CardFooter className="p-0">
                  <McpToolDialog mcpId={mcpId!} mcpPieceToUpdate={piece} onSuccess={refetchMcp} onClose={() => {
                    setShowAddPieceDialog(false);
                  }}>
                    <Button variant="ghost" className="w-full rounded-none h-10 text-xs justify-between font-normal">
                      <span>{t('Configure')}</span>
                      <Settings className="h-3 w-3 ml-1" />
                    </Button>
                  </McpToolDialog>
                </CardFooter>
              </Card>
            ))}

            {/* Flows */}
            {flowsData && flowsData.data.map((flow) => (
              <Card key={`flow-${flow.id}`} className="overflow-hidden transition-all hover:shadow-md">
                <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                    <Workflow className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold truncate">{flow.version.displayName}</h3>
                    <Badge variant="outline" className="text-xs">Flow</Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleEditFlow(flow.id)}
                        className="flex items-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        {t('Edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive flex items-center gap-2"
                        onClick={() => handleDeleteFlow(flow.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('Delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <Separator />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={flow.status === FlowStatus.ENABLED ? "default" : "secondary"}>
                        {flow.status === FlowStatus.ENABLED ? t('Active') : t('Inactive')}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ID: {flow.id.substring(0, 8)}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="p-0">
                  <Button 
                    variant="ghost" 
                    className="w-full rounded-none h-10 text-xs justify-between font-normal"
                    onClick={() => navigate(`/flows/${flow.id}`)}
                  >
                    <span>{t('Open Flow Editor')}</span>
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
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
          <McpToolDialog 
            mcpId={mcpId!} 
            onSuccess={() => {
              refetchMcp();
              setShowAddPieceDialog(false);
            }}
            onClose={() => {
              setShowAddPieceDialog(false);
            }}
          >
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('Add Tool')}
            </Button>
          </McpToolDialog>
        </div>
      )}
    </div>

    {showAddPieceDialog && (
      <McpToolDialog 
        mcpId={mcpId!} 
        onSuccess={() => {
          refetchMcp();
          setShowAddPieceDialog(false);
        }}
        onClose={() => {
          setShowAddPieceDialog(false);
        }}
      >
        <></>
      </McpToolDialog>
    )}
  </div>
);
};

McpConfigPage.displayName = 'McpConfigPage';

export default McpConfigPage;