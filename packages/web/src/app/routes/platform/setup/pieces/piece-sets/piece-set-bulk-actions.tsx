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
import { AdminControl, adminControl } from '@/lib/admin-control';

import { ConfirmExcludingRequiredActionsDialog } from './confirm-excluding-required-actions';
import { pieceSetInclusionUtils } from './piece-set-inclusion-utils';

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
  const [updateToConfirm, setUpdateToConfirm] = useState<BulkUpdate | null>(
    null,
  );
  const selectedPiecesNames = selectedPieces.map((piece) => piece.name);
  const requestToConfirm = updateToConfirm
    ? buildUpdateRequest({
        pieceSet,
        pieceNames: selectedPiecesNames,
        update: updateToConfirm,
      })
    : null;

  const save = (request: UpdatePieceSetRequestBody) => {
    updateSet({ id: pieceSet.id, request });
    resetSelection();
  };

  const applyUpdate = (update: BulkUpdate) => {
    const request = buildUpdateRequest({
      pieceSet,
      pieceNames: selectedPiecesNames,
      update,
    });
    if (
      pieceSetInclusionUtils.hasExcludedRequiredActions({ pieceSet, request })
    ) {
      setUpdateToConfirm(update);
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
            {...adminControl(AdminControl.PIECE_SETS_INCLUDE_RUN)}
            onSelect={() => applyUpdate('actionsAndTriggers')}
          >
            {t('Actions and triggers')}
          </DropdownMenuItem>
          <DropdownMenuItem
            {...adminControl(AdminControl.PIECE_SETS_INCLUDE_RUN)}
            onSelect={() => applyUpdate('actions')}
          >
            {t('Actions only')}
          </DropdownMenuItem>
          <DropdownMenuItem
            {...adminControl(AdminControl.PIECE_SETS_INCLUDE_RUN)}
            onSelect={() => applyUpdate('triggers')}
          >
            {t('Triggers only')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        {...adminControl(AdminControl.PIECE_SETS_EXCLUDE_RUN)}
        variant="ghost"
        size="sm"
        onClick={() => applyUpdate('excluded')}
      >
        <EyeOff className="mr-1 size-4" />
        {t('Exclude')}
      </Button>
      <ConfirmExcludingRequiredActionsDialog
        excludedRequiredActions={
          requestToConfirm
            ? pieceSetInclusionUtils.findExcludedRequiredActions({
                pieceSet,
                request: requestToConfirm,
              })
            : null
        }
        reason={
          updateToConfirm === 'excluded' ? 'removePieces' : 'excludeActions'
        }
        onConfirm={() => {
          setUpdateToConfirm(null);
          if (requestToConfirm) {
            save(requestToConfirm);
          }
        }}
        onCancel={() => setUpdateToConfirm(null)}
      />
    </>
  );
};

function buildUpdateRequest({
  pieceSet,
  pieceNames,
  update,
}: {
  pieceSet: PieceSet;
  pieceNames: string[];
  update: BulkUpdate;
}): UpdatePieceSetRequestBody {
  const pieces = pieceSetInclusionUtils.setPiecesIncluded({
    pieces: pieceSet.config.pieces,
    pieceNames,
    included: update !== 'excluded',
  });
  if (update === 'excluded') {
    return { pieces };
  }
  const showAll = selectionPerPiece({ pieceNames, selection: { mode: 'all' } });
  const showNone = selectionPerPiece({
    pieceNames,
    selection: { mode: 'selected', selected: [] },
  });
  return {
    pieces,
    actions: update === 'triggers' ? showNone : showAll,
    triggers: update === 'actions' ? showNone : showAll,
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

type BulkUpdate = 'actionsAndTriggers' | 'actions' | 'triggers' | 'excluded';
