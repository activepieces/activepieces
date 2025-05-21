import { mcpHooks } from "@/features/mcp/lib/mcp-hooks";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTheme } from "@/components/theme-provider";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuthorization } from "@/hooks/authorization-hooks";
import { Permission } from "@activepieces/shared";
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
import { MoreVertical, Plus } from "lucide-react";
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
} from "@/components/ui/dialog";
import { useState } from "react";
import { CardList, CardListItem, CardListEmpty } from "@/components/ui/card-list";
import McpToolDialog from "./mcp-tool-dialog";

export const McpConfigPage = () => {
  const [isAddToolDialogOpen, setIsAddToolDialogOpen] = useState(false);
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
        description: t('Piece removed successfully'),
        duration: 3000,
      });
      refetchMcp();
    },
    onError: (err) => {
      console.error(err);
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to remove piece'),
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

const handleEditPiece = (piece: McpPieceWithConnection) => {
  // The edit functionality is now handled by the McpToolDialog
};

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

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('Tools')}</h2>
        <McpToolDialog mcpId={mcpId!} onSuccess={refetchMcp}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('Add tool')}
          </Button>
        </McpToolDialog>
      </div>
      
      <div className="space-y-4">
        {mcp?.pieces && mcp.pieces.length > 0 && (
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">{t('Pieces')}</h3>
            <CardList className="max-h-none">
              {mcp.pieces.map((piece) => (
                <CardListItem
                  key={piece.id}
                  onClick={() => handleEditPiece(piece)}
                  className="p-3 border rounded-md hover:bg-muted"
                >
                  <div className="flex items-center">
                    {pieceInfoMap[piece.id]?.logoUrl && (
                      <img 
                        src={pieceInfoMap[piece.id].logoUrl} 
                        alt={pieceInfoMap[piece.id].displayName} 
                        className="h-5 w-5 mr-3"
                      />
                    )}
                    <span className="flex-grow">{pieceInfoMap[piece.id].displayName}</span>
                    {piece.actionNames && piece.actionNames.length > 0 && (
                      <span className="text-xs text-muted-foreground mr-4">
                        {piece.actionNames.length} {piece.actionNames.length === 1 ? t('action') : t('actions')}
                      </span>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <McpToolDialog mcpId={mcpId!} mcpPieceToUpdate={piece} onSuccess={refetchMcp}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          {t('Edit')}
                        </DropdownMenuItem>
                      </McpToolDialog>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => removePiece(piece)}
                      >
                        {t('Delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardListItem>
              ))}
            </CardList>
          </div>
        )}
        
        {flowsData && flowsData.data.length > 0 && (
          <div>
            <h3 className="text-sm text-muted-foreground mb-2">{t('Flows')}</h3>
            <CardList className="max-h-none">
              {flowsData.data.map((flow) => (
                <CardListItem
                  key={flow.id}
                  onClick={() => navigate(`/flows/${flow.id}`)}
                  className="p-3 border rounded-md hover:bg-muted"
                >
                  <span className="flex-grow">{flow.version.displayName}</span>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleEditFlow(flow.id);
                      }}>
                        {t('Edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFlow(flow.id);
                        }}
                      >
                        {t('Delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardListItem>
              ))}
            </CardList>
          </div>
        )}
        
        {(!mcp?.pieces || mcp.pieces.length === 0) && (!flowsData || flowsData.data.length === 0) && (
          <CardListEmpty message={t('No tools found. Click "Add tool" to create one.')} />
        )}
      </div>
    </div>
  );
};

McpConfigPage.displayName = 'McpConfigPage';

export default McpConfigPage;