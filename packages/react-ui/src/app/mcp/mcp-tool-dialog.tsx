import { DialogTrigger } from '@radix-ui/react-dialog';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronLeft } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { mcpToolApi } from '@/features/mcp/lib/mcp-tool-api';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { PieceStepMetadataWithSuggestions } from '@/features/pieces/lib/types';
import { isNil, McpToolType } from '@activepieces/shared';
import type { McpToolWithFlow, McpToolWithPiece } from '@activepieces/shared';

import { McpFlowsContent } from './flows/mcp-flows-content';
import { McpPieceActionsDialog } from './pieces/mcp-piece-actions-dialog';
import { McpPiecesContent } from './pieces/mcp-pieces-content';

type McpToolDialogProps = {
  children: React.ReactNode;
  mcpPieceToUpdate?: McpToolWithPiece | McpToolWithFlow;
  mcpId: string;
  mode: 'add' | 'edit';
  open: boolean;
  activeTab: 'pieces' | 'flows';
  setActiveTab: (value: 'pieces' | 'flows') => void;
  onSuccess: () => void;
  onClose: () => void;
};

export default function McpToolDialog({
  mcpId,
  mcpPieceToUpdate,
  mode,
  open,
  activeTab,
  setActiveTab,
  onSuccess,
  children,
  onClose,
}: McpToolDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const { metadata, isLoading: isPiecesLoading } =
    piecesHooks.useAllStepsMetadata({
      searchQuery: debouncedQuery,
      type: 'action',
    });

  const [selectedPiece, setSelectedPiece] =
    useState<PieceStepMetadataWithSuggestions | null>(() => {
      if (
        !isNil(mcpPieceToUpdate) &&
        mcpPieceToUpdate.data.type === McpToolType.PIECE
      ) {
        return metadata?.find((m) => {
          if (
            mcpPieceToUpdate.data.type === McpToolType.PIECE &&
            (m as PieceStepMetadataWithSuggestions).pieceName ===
              mcpPieceToUpdate.data.pieceName
          ) {
            return true;
          }
          return false;
        }) as PieceStepMetadataWithSuggestions | null;
      }
      return null;
    });

  const [selectedActions, setSelectedActions] = useState<string[]>(() =>
    mcpPieceToUpdate?.data.type === McpToolType.PIECE
      ? mcpPieceToUpdate.data.actionNames
      : [],
  );

  const { toast } = useToast();

  const pieceMetadata = useMemo(() => {
    return (
      metadata?.filter(
        (m): m is PieceStepMetadataWithSuggestions =>
          'suggestedActions' in m && 'suggestedTriggers' in m,
      ) ?? []
    );
  }, [metadata]);

  const handlePieceSelect = (piece: PieceStepMetadataWithSuggestions) => {
    const existingTool = mcp?.tools?.find(
      (tool) =>
        tool.data.type === McpToolType.PIECE &&
        (tool as McpToolWithPiece).piece.pieceName === piece.pieceName,
    );

    if (existingTool && existingTool.data.type === McpToolType.PIECE) {
      setSelectedActions(existingTool.data.actionNames);
    } else {
      setSelectedActions([]);
    }

    setSelectedPiece(piece);
  };

  const handleActionSelect = (action: string) => {
    setSelectedActions((prev) => {
      const newSelected = prev.includes(action)
        ? prev.filter((a) => a !== action)
        : [...prev, action];
      return newSelected;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && selectedPiece) {
      setSelectedActions(
        selectedPiece.suggestedActions?.map((a) => a.name) ?? [],
      );
    } else {
      setSelectedActions([]);
    }
  };

  const { isPending, mutate: saveTool } = useMutation({
    mutationFn: async () => {
      if (activeTab === 'pieces') {
        if (!selectedPiece || selectedActions.length === 0 || !mcpId) return;

        return await mcpToolApi.upsert({
          type: McpToolType.PIECE,
          mcpId: mcpId,
          data: {
            type: McpToolType.PIECE,
            pieceName: selectedPiece.pieceName,
            actionNames: selectedActions,
            pieceVersion: selectedPiece.pieceVersion || '',
          },
        });
      } else {
        if (!selectedFlows.length || !mcpId) return;
        return await mcpToolApi.upsert({
          type: McpToolType.FLOW,
          mcpId: mcpId,
          data: {
            type: McpToolType.FLOW,
            flowIds: selectedFlows,
          },
        });
      }
    },
    onSuccess: () => {
      toast({
        description:
          mode === 'edit'
            ? t('Tool updated successfully')
            : t('Tool added successfully'),
        duration: 3000,
      });
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('Error'),
        description:
          mode === 'edit'
            ? t('Failed to update tool')
            : t('Failed to add tool'),
        duration: 5000,
      });
    },
  });

  const { data: mcp } = mcpHooks.useMcp(mcpId);

  const { addedPieces, otherPieces } = useMemo(() => {
    const added = pieceMetadata.filter((piece) =>
      mcp?.tools?.some(
        (tool) =>
          tool.data.type === McpToolType.PIECE &&
          (tool as McpToolWithPiece).piece.pieceName === piece.pieceName,
      ),
    );
    const other = pieceMetadata.filter(
      (piece) =>
        !mcp?.tools?.some(
          (tool) =>
            tool.data.type === McpToolType.PIECE &&
            (tool as McpToolWithPiece).piece.pieceName === piece.pieceName,
        ),
    );
    return { addedPieces: added, otherPieces: other };
  }, [pieceMetadata, mcp?.tools]);

  const handleClose = () => {
    setSelectedPiece(null);
    setSearchQuery('');
    setSelectedActions([]);
    setActiveTab('pieces');
    onClose();
  };

  const [selectedFlows, setSelectedFlows] = useState<string[]>(
    () =>
      mcp?.tools
        .find(
          (tool): tool is McpToolWithFlow =>
            tool.data.type === McpToolType.FLOW,
        )
        ?.flows.map((flow) => flow.id) ?? [],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="min-w-[700px] max-w-[700px] h-[800px] max-h-[800px] flex flex-col">
        <DialogHeader className={`${selectedPiece ? 'gap-2' : 'gap-0'}`}>
          <DialogTitle className="text-2xl font-bold">
            {selectedPiece ? (
              <div className="flex items-center gap-2">
                {mode === 'add' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPiece(null);
                          setSearchQuery('');
                        }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('Back')}</TooltipContent>
                  </Tooltip>
                )}
                {selectedPiece.displayName}
              </div>
            ) : (
              t('Add Tool')
            )}
          </DialogTitle>
          <DialogDescription>
            {selectedPiece
              ? mode === 'edit'
                ? t('Edit the selected actions for this tool')
                : t('Select actions to add to your mcp tool')
              : null}
          </DialogDescription>
        </DialogHeader>
        {selectedPiece ? (
          <McpPieceActionsDialog
            piece={selectedPiece}
            selectedActions={selectedActions}
            onSelectAction={handleActionSelect}
            onSelectAll={handleSelectAll}
          />
        ) : (
          <div className="flex flex-col h-full">
            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as 'pieces' | 'flows')
              }
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pieces">{t('Pieces')}</TabsTrigger>
                <TabsTrigger value="flows">{t('Flows')}</TabsTrigger>
              </TabsList>
              <TabsContent value="pieces" className="flex flex-col mt-4">
                <McpPiecesContent
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  isPiecesLoading={isPiecesLoading}
                  pieceMetadata={pieceMetadata}
                  addedPieces={addedPieces}
                  otherPieces={otherPieces}
                  onPieceSelect={handlePieceSelect}
                />
              </TabsContent>
              <TabsContent value="flows" className="flex flex-col mt-4">
                <McpFlowsContent
                  selectedFlows={selectedFlows}
                  setSelectedFlows={setSelectedFlows}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              {t('Close')}
            </Button>
          </DialogClose>
          <Button
            loading={isPending}
            type="button"
            onClick={() => saveTool()}
            disabled={
              activeTab === 'pieces'
                ? selectedActions.length === 0
                : selectedFlows.length === 0
            }
          >
            {mode === 'edit' ||
            (selectedPiece &&
              addedPieces.some((p) => p.pieceName === selectedPiece.pieceName))
              ? t('Save')
              : t('Add Tool')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
