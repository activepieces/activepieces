import { DialogTrigger } from '@radix-ui/react-dialog';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState, useMemo } from 'react';
import { Search, Puzzle, Workflow, WorkflowIcon, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { piecesHooks } from "@/features/pieces/lib/pieces-hook";
import { mcpApi } from "@/features/mcp/lib/mcp-api";
import { flowsApi } from "@/features/flows/lib/flows-api";
import { authenticationSession } from "@/lib/authentication-session";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { assertNotNullOrUndefined } from "@activepieces/shared";
import { pieceSelectorUtils } from '@/app/builder/pieces-selector/piece-selector-utils';
import { FlowOperationType } from "@activepieces/shared";
import type { 
  Trigger,
  PopulatedFlow,
  FlowOperationRequest,
} from "@activepieces/shared";
import {
  PieceStepMetadataWithSuggestions,
  StepMetadata,
  StepMetadataWithSuggestions,
} from '@/features/pieces/lib/types';
import { useDebounce } from 'use-debounce';
import { platformHooks } from '@/hooks/platform-hooks';
import { CardList, CardListItem, CardListItemSkeleton } from '@/components/ui/card-list';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { SearchX } from 'lucide-react';
import { McpPieceActionsDialog } from './mcp-piece-actions-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LoadingSpinner } from '@/components/ui/spinner';

type McpToolDialogProps = {
  children: React.ReactNode;
  mcpPieceToUpdate?: any;
  mcpId: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function McpToolDialog({ mcpId, mcpPieceToUpdate, onSuccess, children, onClose }: McpToolDialogProps) {
  const [activeTab, setActiveTab] = useState("pieces");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [selectedPiece, setSelectedPiece] = useState<PieceStepMetadataWithSuggestions | null>(null);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedActionName, setSelectedActionName] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { metadata, isLoading: isPiecesLoading } = piecesHooks.useAllStepsMetadata({
    searchQuery: debouncedQuery,
    type: 'action',
  });

  const pieceMetadata = useMemo(() => {
    return metadata?.filter((m): m is PieceStepMetadataWithSuggestions => 
      'suggestedActions' in m && 'suggestedTriggers' in m
    ) ?? [];
  }, [metadata]);

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

  const handlePieceSelect = (piece: any) => {
    setSelectedPiece(piece);
    setSelectedActions([]);
    setSelectedActionName(null);
  };

  const handleActionSelect = (action: string) => {
    setSelectedActions(prev => {
      const newSelected = prev.includes(action)
        ? prev.filter(a => a !== action)
        : [...prev, action];
      setSelectedActionName(action);
      return newSelected;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && selectedPiece) {
      setSelectedActions(selectedPiece.suggestedActions?.map(a => a.name) ?? []);
    } else {
      setSelectedActions([]);
    }
  };

  const handleCreateFlow = () => {
    createFlow();
  };

  const handleSavePiece = async () => {
    if (!selectedPiece || selectedActions.length === 0) return;

    try {
      await mcpApi.upsertPiece(mcpId, {
        pieceName: selectedPiece.pieceName,
        actionNames: selectedActions,
        pieceVersion: selectedPiece.pieceVersion,
      });

      toast({
        description: t('Integration added successfully'),
        duration: 3000,
      });

      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to add integration'),
        duration: 5000,
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="min-w-[700px] max-w-[700px] h-[800px] max-h-[800px] flex flex-col">
        <DialogHeader className={`${selectedPiece ? 'gap-2' : 'gap-0'}`}>
          <DialogTitle className="text-2xl font-bold">
            {selectedPiece ? (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => {
                      setSelectedPiece(null)
                      setSearchQuery('')
                    }}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Back')}</TooltipContent>
                </Tooltip>
                {selectedPiece.displayName}
              </div>
            ) : (
              t('Add Tool')
            )}
          </DialogTitle>
          <DialogDescription>
            {selectedPiece ? null : t('Select actions to add to your mcp tool')}
          </DialogDescription>
        </DialogHeader>
        {selectedPiece ? (
          <McpPieceActionsDialog
            piece={selectedPiece}
            selectedActions={selectedActions}
            onSelectAction={handleActionSelect}
            onSelectAll={handleSelectAll}
            onDone={() => setSelectedPiece(null)}
          />
        ) : (
          <>
            <div className="mb-4">
              <Input
                placeholder={t('Search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {isPiecesLoading && (
              <div className="flex items-center justify-center w-full">
                <LoadingSpinner />
              </div>
            )}
            {(!isPiecesLoading && pieceMetadata && pieceMetadata.length === 0) && (
              <div className="text-center">{t('No pieces found')}</div>
            )}
            <ScrollArea className="flex-grow overflow-y-auto w-full ">
              <div className="grid grid-cols-2 gap-1">
                {!isPiecesLoading &&
                  pieceMetadata &&
                  pieceMetadata.map((piece, index) => (
                    <div
                      key={index}
                      onClick={() => handlePieceSelect(piece)}
                      className="flex items-center h-[30px] w-full justify-between gap-2 p-4  hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-sm group"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          className="w-[15px] h-[15px]"
                          src={piece.logoUrl}
                        />
                        <div className="text-center text-sm">
                          {piece.displayName}
                        </div>
                        {piece.description && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">{piece.description}</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                    </div>
                  ))}
              </div>
            </ScrollArea>

          </>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost" onClick={() => onClose()}>
              {t('Close')}
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSavePiece} disabled={selectedActions.length === 0}>
            {t('Add Tool')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 