import { t } from 'i18next';
import { ChevronLeft } from 'lucide-react';
import { useMemo, useEffect } from 'react';
import { toast } from 'sonner';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { PieceStepMetadataWithSuggestions } from '@/lib/types';
import { AgentTool } from '@activepieces/shared';

import { PieceActionsList } from '../../../../features/agents/agent-tools/piece-tool-dialog/dialog-pages/piece-actions-list';
import { PiecesList } from '../../../../features/agents/agent-tools/piece-tool-dialog/dialog-pages/pieces-list';
import { useAgentToolsStore } from '../../../../features/agents/agent-tools/store';

import { PredefinedInputsForm } from './predefined-inputs-form';

type AgentToolsDialogProps = {
  tools: AgentTool[];
  onToolsUpdate: (tools: AgentTool[]) => void;
};

const excludedPieces = [
  '@activepieces/piece-ai',
  '@activepieces/piece-mcp',
  '@activepieces/piece-openai',
  '@activepieces/piece-claude',
  '@activepieces/piece-google-gemini',
  '@activepieces/piece-grok-xai',
];

export function AgentPieceDialog({
  tools,
  onToolsUpdate,
}: AgentToolsDialogProps) {
  const {
    showAddPieceDialog,
    selectedPage,
    searchQuery,
    selectedPiece,
    selectedAction,
    editingPieceTool: editingTool,
    setSearchQuery,
    handlePieceSelect,
    handleActionSelect,
    goBackToPiecesList,
    goBackToPieceSelected,
    isAuthSet,
    createNewTool,
    closePieceDialog,
  } = useAgentToolsStore();

  const [debouncedQuery] = useDebounce(searchQuery, 300);

  const { metadata, isLoading: isPiecesLoading } =
    stepsHooks.useAllStepsMetadata({
      searchQuery: debouncedQuery,
      type: 'action',
    });

  const pieceMetadata = useMemo(() => {
    return (
      metadata
        ?.filter(
          (m): m is PieceStepMetadataWithSuggestions =>
            'suggestedActions' in m && 'suggestedTriggers' in m,
        )
        .filter((piece) => !excludedPieces.includes(piece.pieceName)) ?? []
    );
  }, [metadata]);

  useEffect(() => {
    if (showAddPieceDialog && editingTool && pieceMetadata.length > 0) {
      const piece = pieceMetadata.find(
        (p) => p.pieceName === editingTool.pieceMetadata.pieceName,
      );

      if (piece) {
        handlePieceSelect(piece);

        const action = piece.suggestedActions?.find(
          (a) => a.name === editingTool.toolName,
        );

        if (action) {
          handleActionSelect(action);
        }
      }
    }
  }, [showAddPieceDialog, editingTool, pieceMetadata]);

  const authIsSetValue = isAuthSet();

  const handleSave = () => {
    const newTool = createNewTool();
    if (!newTool) return;

    if (editingTool) {
      const updatedTools = tools.map((tool) =>
        tool.toolName === editingTool.toolName ? newTool : tool,
      );
      onToolsUpdate(updatedTools);
      toast('Piece tool updated');
    } else {
      onToolsUpdate([...tools, newTool]);
      toast('Piece tool added');
    }

    closePieceDialog();
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      closePieceDialog();
    }
  };

  const renderDialogMainContent = () => {
    switch (selectedPage) {
      case 'pieces-list': {
        return (
          <PiecesList
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isPiecesLoading={isPiecesLoading}
            pieceMetadata={pieceMetadata}
            onPieceSelect={handlePieceSelect}
          />
        );
      }
      case 'piece-selected': {
        return (
          selectedPiece && (
            <PieceActionsList
              tools={tools}
              setSelectedAction={handleActionSelect}
              piece={selectedPiece}
            />
          )
        );
      }
      case 'action-selected': {
        return (
          selectedAction &&
          selectedPiece && (
            <PredefinedInputsForm
              action={selectedAction}
              piece={selectedPiece}
            />
          )
        );
      }
    }
  };

  const renderDialogHeaderContent = () => {
    switch (selectedPage) {
      case 'pieces-list': {
        return t('Connect apps with the agent');
      }
      case 'piece-selected': {
        return (
          selectedPiece && (
            <div className="flex items-center justify-start gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goBackToPiecesList}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Back')}</TooltipContent>
              </Tooltip>
              {t(selectedPiece.displayName)}
            </div>
          )
        );
      }
      case 'action-selected': {
        return (
          selectedAction && (
            <div className="flex items-center justify-start gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goBackToPieceSelected}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Back')}</TooltipContent>
              </Tooltip>
              {selectedAction.displayName}
            </div>
          )
        );
      }
    }
  };

  return (
    <Dialog open={showAddPieceDialog} onOpenChange={handleDialogClose}>
      <DialogContent className="w-[90vw] max-w-[750px] h-[80vh] max-h-[800px] flex flex-col overflow-hidden p-0">
        <DialogHeader className="min-h-16 flex px-4 items-start justify-center mb-0 border-b">
          <DialogTitle>{renderDialogHeaderContent()}</DialogTitle>
        </DialogHeader>

        {renderDialogMainContent()}

        {selectedPage === 'action-selected' && (
          <DialogFooter className="border-t p-4 mt-auto">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                {t('Close')}
              </Button>
            </DialogClose>
            <Button
              loading={false}
              disabled={!authIsSetValue}
              type="button"
              onClick={handleSave}
            >
              {editingTool ? t('Update Tool') : t('Add Tool')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
