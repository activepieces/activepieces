import { DialogTrigger } from '@radix-ui/react-dialog';
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
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { PieceStepMetadataWithSuggestions } from '@/lib/types';
import type {
  McpPieceTool,
  McpWithTools,
  McpToolRequest,
} from '@activepieces/shared';
import { isNil, McpToolType } from '@activepieces/shared';

import { McpPieceActionsDialog } from './mcp-piece-actions';
import { McpPiecesContent } from './mcp-pieces-content';

type McpPieceDialogProps = {
  children: React.ReactNode;
  mcp: McpWithTools;
  open: boolean;
  onToolsUpdate: (tools: McpToolRequest[]) => void;
  onClose: () => void;
};

export type ActionInfo = {
  actionName: string;
  actionDisplayName: string;
};

export function McpPieceDialog({
  mcp,
  open,
  onToolsUpdate,
  children,
  onClose,
}: McpPieceDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConnectionExternalId, setSelectedConnectionExternalId] =
    useState<string | null>(null);
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const { metadata, isLoading: isPiecesLoading } =
    stepsHooks.useAllStepsMetadata({
      searchQuery: debouncedQuery,
      type: 'action',
    });

  const [selectedPiece, setSelectedPiece] =
    useState<PieceStepMetadataWithSuggestions | null>(null);
  const [selectedActions, setSelectedActions] = useState<ActionInfo[]>([]);

  const pieceMetadata = useMemo(() => {
    return (
      metadata?.filter(
        (m): m is PieceStepMetadataWithSuggestions =>
          'suggestedActions' in m && 'suggestedTriggers' in m,
      ) ?? []
    );
  }, [metadata]);

  const handlePieceSelect = (piece: PieceStepMetadataWithSuggestions) => {
    const existingTools = mcp?.tools?.filter(
      (tool): tool is McpPieceTool =>
        tool.type === McpToolType.PIECE &&
        tool.pieceMetadata?.pieceName === piece.pieceName,
    );

    if (existingTools && existingTools.length > 0) {
      setSelectedActions(
        existingTools.map((tool) => ({
          actionName: tool.pieceMetadata?.actionName,
          actionDisplayName: tool.pieceMetadata?.actionDisplayName,
        })),
      );
      setSelectedConnectionExternalId(
        existingTools[0].pieceMetadata?.connectionExternalId || null,
      );
    }

    setSelectedPiece(piece);
  };

  const handleActionSelect = (action: ActionInfo) => {
    setSelectedActions((prev) => {
      const isAlreadySelected = prev.some(
        (a) => a.actionName === action.actionName,
      );
      const newSelected = isAlreadySelected
        ? prev.filter((a) => a.actionName !== action.actionName)
        : [...prev, action];
      return newSelected;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && selectedPiece) {
      setSelectedActions(
        selectedPiece.suggestedActions?.map((a) => ({
          actionName: a.name,
          actionDisplayName: a.displayName,
        })) ?? [],
      );
    } else {
      setSelectedActions([]);
    }
  };

  const handleSave = () => {
    if (!isNil(selectedPiece?.auth) && isNil(selectedConnectionExternalId)) {
      setShowValidationErrors(true);
      return;
    }

    setShowValidationErrors(false);
    if (!selectedPiece) return;

    const newTools: McpToolRequest[] = selectedActions.map((action) => ({
      type: McpToolType.PIECE,
      mcpId: mcp.id,
      pieceMetadata: {
        pieceName: selectedPiece.pieceName,
        actionName: action.actionName,
        actionDisplayName: action.actionDisplayName,
        pieceVersion: selectedPiece.pieceVersion,
        logoUrl: selectedPiece.logoUrl,
        connectionExternalId: selectedConnectionExternalId ?? undefined,
      },
    }));
    const oldTools = mcp.tools;
    onToolsUpdate([...oldTools, ...newTools]);
    handleClose();
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
          <Button loading={false} type="button" onClick={handleSave}>
            {t('Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
