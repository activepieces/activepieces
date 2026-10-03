import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  ComponentSelection,
  PieceSet,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { pieceSetMutations } from '@/features/piece-sets';

import { ConfirmHidingRequiredActionsDialog } from './confirm-hiding-required-actions';
import { pieceSetVisibilityUtils } from './piece-set-visibility-utils';

export const BulkPieceSetActions = ({
  pieceSet,
  selectedPieces,
  resetSelection,
}: {
  pieceSet: PieceSet;
  selectedPieces: PieceMetadataModelSummary[];
  resetSelection: () => void;
}) => {
  const { mutate: updateSet } = pieceSetMutations.useUpdatePieceSet();
  const [visibilityToConfirm, setVisibilityToConfirm] =
    useState<BulkVisibility | null>(null);
  const selectedPiecesNames = selectedPieces.map((piece) => piece.name);
  const requestToConfirm = visibilityToConfirm
    ? buildVisibilityRequest({
        pieceSet,
        pieceNames: selectedPiecesNames,
        visibility: visibilityToConfirm,
      })
    : null;

  const save = (request: UpdatePieceSetRequestBody) => {
    updateSet({ id: pieceSet.id, request });
    resetSelection();
  };

  const applyVisibility = (visibility: BulkVisibility) => {
    const request = buildVisibilityRequest({
      pieceSet,
      pieceNames: selectedPiecesNames,
      visibility,
    });
    if (
      pieceSetVisibilityUtils.hasHiddenRequiredActions({ pieceSet, request })
    ) {
      setVisibilityToConfirm(visibility);
      return;
    }
    save(request);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Eye className="mr-1 size-4" />
            {t('Include')}
            <ChevronDown className="ml-1 size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onSelect={() => applyVisibility('actionsAndTriggers')}
          >
            {t('Actions and triggers')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => applyVisibility('actions')}>
            {t('Actions only')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => applyVisibility('triggers')}>
            {t('Triggers only')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => applyVisibility('excluded')}
      >
        <EyeOff className="mr-1 size-4" />
        {t('Exclude')}
      </Button>
      <ConfirmHidingRequiredActionsDialog
        hiddenRequiredActions={
          requestToConfirm
            ? pieceSetVisibilityUtils.findHiddenRequiredActions({
                pieceSet,
                request: requestToConfirm,
              })
            : null
        }
        reason={
          visibilityToConfirm === 'excluded' ? 'removePieces' : 'hideActions'
        }
        onConfirm={() => {
          setVisibilityToConfirm(null);
          if (requestToConfirm) {
            save(requestToConfirm);
          }
        }}
        onCancel={() => setVisibilityToConfirm(null)}
      />
    </>
  );
};

function buildVisibilityRequest({
  pieceSet,
  pieceNames,
  visibility,
}: {
  pieceSet: PieceSet;
  pieceNames: string[];
  visibility: BulkVisibility;
}): UpdatePieceSetRequestBody {
  const pieces = pieceSetVisibilityUtils.setPiecesVisible({
    pieces: pieceSet.config.pieces,
    pieceNames,
    visible: visibility !== 'excluded',
  });
  if (visibility === 'excluded') {
    return { pieces };
  }
  const showAll = selectionPerPiece({ pieceNames, selection: { mode: 'all' } });
  const showNone = selectionPerPiece({
    pieceNames,
    selection: { mode: 'selected', selected: [] },
  });
  return {
    pieces,
    actions: visibility === 'triggers' ? showNone : showAll,
    triggers: visibility === 'actions' ? showNone : showAll,
  };
}

function selectionPerPiece({
  pieceNames,
  selection,
}: {
  pieceNames: string[];
  selection: ComponentSelection;
}): Record<string, ComponentSelection> {
  return Object.fromEntries(pieceNames.map((name) => [name, selection]));
}

type BulkVisibility =
  | 'actionsAndTriggers'
  | 'actions'
  | 'triggers'
  | 'excluded';
