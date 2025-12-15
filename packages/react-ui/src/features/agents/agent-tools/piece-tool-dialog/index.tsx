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
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { PieceStepMetadataWithSuggestions } from '@/lib/types';
import { ActionBase } from '@activepieces/pieces-framework';
import {
  isNil,
  AgentTool,
  AgentPieceTool,
  AgentToolType,
} from '@activepieces/shared';

import { PieceActionsList } from './dialog-pages/piece-actions-list';
import { PiecesList } from './dialog-pages/pieces-list';
import { PredefinedInputsForm } from './dialog-pages/predefined-inputs-form';

type AgentToolsDialogProps = {
  children: React.ReactNode;
  tools: AgentTool[];
  open: boolean;
  onToolsUpdate: (tools: AgentTool[]) => void;
  onClose: () => void;
};

type SelectedDialogPage = 'pieces-list' | 'piece-selected' | 'action-selected';

export function AgentPieceDialog({
  tools,
  open,
  onToolsUpdate,
  children,
  onClose,
}: AgentToolsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);

  const { metadata, isLoading: isPiecesLoading } =
    stepsHooks.useAllStepsMetadata({
      searchQuery: debouncedQuery,
      type: 'action',
    });

  const pieceMetadata = useMemo(() => {
    return (
      metadata?.filter(
        (m): m is PieceStepMetadataWithSuggestions =>
          'suggestedActions' in m && 'suggestedTriggers' in m,
      ) ?? []
    );
  }, [metadata]);

  const [predefinedInputs, setPredefinedInputs] = useState<
    Record<string, unknown>
  >({});
  const [selectedPiece, setSelectedPiece] =
    useState<PieceStepMetadataWithSuggestions | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionBase | null>(null);
  const [selectedPage, setSelectedPage] =
    useState<SelectedDialogPage>('pieces-list');

  const handlePieceSelect = (piece: PieceStepMetadataWithSuggestions) => {
    setSelectedPiece(piece);
    setSelectedPage('piece-selected');
  };

  const handleActionSelect = (action: ActionBase) => {
    setSelectedAction(action);
    setSelectedPage('action-selected');
  };

  const authIsSet =
    !!selectedPiece &&
    !!selectedAction &&
    (!selectedAction.requireAuth || !isNil(predefinedInputs?.auth));

  const handleNewActionToolSave = () => {
    if (isNil(selectedAction) || isNil(selectedPiece) || !authIsSet) return;

    const newActionTool: AgentPieceTool = {
      type: AgentToolType.PIECE,
      toolName: selectedAction.name,
      pieceMetadata: {
        pieceVersion: selectedPiece.pieceVersion,
        pieceName: selectedPiece.pieceName,
        actionName: selectedAction.displayName,
        predefinedInput: predefinedInputs,
      },
    };

    onToolsUpdate([...tools, newActionTool]);
  };

  const resetState = () => {
    setPredefinedInputs({});
    setSearchQuery('');
  };

  const handleClose = () => {
    resetState();
    onClose();
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
              inputs={predefinedInputs}
              setInputs={setPredefinedInputs}
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
                    onClick={() => {
                      resetState();
                      setSelectedPage('pieces-list');
                    }}
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
                    onClick={() => {
                      resetState();
                      setSelectedPage('piece-selected');
                    }}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('Back')}</TooltipContent>
              </Tooltip>
              {t('Back')}
            </div>
          )
        );
      }
    }
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
              disabled={!authIsSet}
              type="button"
              onClick={handleNewActionToolSave}
            >
              {t('Add Tool')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
