import { DialogTrigger } from '@radix-ui/react-dialog';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronLeft, Search } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useDebounce } from 'use-debounce';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { mcpApi } from '@/features/mcp/lib/mcp-api';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { PieceStepMetadataWithSuggestions } from '@/features/pieces/lib/types';
import type { McpWithTools } from '@activepieces/shared';
import { McpToolType } from '@activepieces/shared';

import { McpPieceActionsDialog } from './mcp-piece-actions';
import { McpPiecesContent } from './mcp-pieces-content';

type McpPieceDialogProps = {
  children: React.ReactNode;
  mcp: McpWithTools;
  open: boolean;
  onSuccess: () => void;
  onClose: () => void;
};

export function McpPieceDialog({
  mcp,
  open,
  onSuccess,
  children,
  onClose,
}: McpPieceDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnectionExternalId, setSelectedConnectionExternalId] =
    useState<string | null>(null);
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const { metadata, isLoading: isPiecesLoading } =
    piecesHooks.useAllStepsMetadata({
      searchQuery: debouncedQuery,
      type: 'action',
    });

  const [selectedPiece, setSelectedPiece] =
    useState<PieceStepMetadataWithSuggestions | null>(null);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);

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
        tool.type === McpToolType.PIECE &&
        tool.pieceMetadata?.pieceName === piece.pieceName,
    );

    if (existingTool && existingTool.type === McpToolType.PIECE) {
      setSelectedActions(existingTool.pieceMetadata?.actionNames || []);
      setSelectedConnectionExternalId(
        existingTool.pieceMetadata?.connectionExternalId || null,
      );
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
      const currentTools =
        mcp?.tools?.map((tool) => ({
          type: tool.type,
          mcpId: tool.mcpId,
          pieceMetadata: tool.pieceMetadata,
          flowId: tool.flowId,
        })) || [];

      if (!selectedPiece || selectedActions.length === 0) return;

      const existingToolIndex = currentTools.findIndex(
        (tool) =>
          tool.type === McpToolType.PIECE &&
          tool.pieceMetadata?.pieceName === selectedPiece.pieceName,
      );

      const newTool = {
        type: McpToolType.PIECE,
        mcpId: mcp.id,
        pieceMetadata: {
          pieceName: selectedPiece.pieceName,
          actionNames: selectedActions,
          pieceVersion: selectedPiece.pieceVersion,
          logoUrl: selectedPiece.logoUrl,
          connectionExternalId: selectedConnectionExternalId ?? undefined,
        },
        flowId: undefined,
      };

      let updatedTools;
      if (existingToolIndex >= 0) {
        updatedTools = [...currentTools];
        updatedTools[existingToolIndex] = newTool;
      } else {
        updatedTools = [...currentTools, newTool];
      }

      return await mcpApi.update(mcp.id, { tools: updatedTools });
    },
    onSuccess: () => {
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('Error'),
        description: t('Failed to update tool'),
        duration: 5000,
      });
    },
  });

  const handleSave = () => {
    if (selectedConnectionExternalId === null) {
      setShowValidationErrors(true);
      return;
    }

    setShowValidationErrors(false);
    saveTool();
  };

  const handleClose = () => {
    setSelectedPiece(null);
    setSearchQuery('');
    setSelectedActions([]);
    setShowValidationErrors(false);
    onClose();
  };

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
      <DialogContent className="w-[90vw] max-w-[750px] h-[80vh] max-h-[800px] flex flex-col overflow-hidden">
        <DialogHeader className={`${selectedPiece ? 'gap-2' : 'gap-0'}`}>
          <DialogTitle>
            {selectedPiece ? (
              <div className="flex items-center gap-2">
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
                {selectedPiece.displayName}
              </div>
            ) : (
              t('Add Tool')
            )}
          </DialogTitle>
        </DialogHeader>
        {selectedPiece ? (
          <McpPieceActionsDialog
            piece={selectedPiece}
            selectedActions={selectedActions}
            onSelectAction={handleActionSelect}
            onSelectAll={handleSelectAll}
            selectedConnectionExternalId={selectedConnectionExternalId}
            setSelectedConnectionExternalId={setSelectedConnectionExternalId}
            showValidationErrors={showValidationErrors}
          />
        ) : (
          <>
            <div className="flex flex-col gap-4 px-1">
              <div className="relative mt-1">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <ScrollArea className="flex-grow overflow-y-auto px-1 pt-4">
              <McpPiecesContent
                isPiecesLoading={isPiecesLoading}
                pieceMetadata={pieceMetadata}
                onPieceSelect={handlePieceSelect}
              />
            </ScrollArea>
          </>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              {t('Close')}
            </Button>
          </DialogClose>
          <Button loading={isPending} type="button" onClick={handleSave}>
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
