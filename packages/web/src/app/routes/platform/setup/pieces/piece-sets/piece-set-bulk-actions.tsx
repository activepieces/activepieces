import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  ComponentSelection,
  PieceSet,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { ReactNode, useState } from 'react';

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
  const [excludeScopeToConfirm, setExcludeScopeToConfirm] =
    useState<BulkScope | null>(null);
  const selectedPiecesNames = selectedPieces.map((piece) => piece.name);
  const excludeRequestToConfirm = excludeScopeToConfirm
    ? buildExcludeRequest({
        pieceSet,
        pieceNames: selectedPiecesNames,
        scope: excludeScopeToConfirm,
      })
    : null;

  const save = (request: UpdatePieceSetRequestBody) => {
    updateSet({ id: pieceSet.id, request });
    resetSelection();
  };

  const include = (scope: BulkScope) =>
    save(
      buildIncludeRequest({ pieceSet, pieceNames: selectedPiecesNames, scope }),
    );

  const exclude = (scope: BulkScope) => {
    const request = buildExcludeRequest({
      pieceSet,
      pieceNames: selectedPiecesNames,
      scope,
    });
    if (
      pieceSetVisibilityUtils.hasHiddenRequiredActions({ pieceSet, request })
    ) {
      setExcludeScopeToConfirm(scope);
      return;
    }
    save(request);
  };

  return (
    <>
      <BulkScopeMenu
        label={t('Include')}
        icon={<Eye className="mr-1 size-4" />}
        onSelect={include}
      />
      <BulkScopeMenu
        label={t('Exclude')}
        icon={<EyeOff className="mr-1 size-4" />}
        onSelect={exclude}
      />
      <ConfirmHidingRequiredActionsDialog
        hiddenRequiredActions={
          excludeRequestToConfirm
            ? pieceSetVisibilityUtils.findHiddenRequiredActions({
                pieceSet,
                request: excludeRequestToConfirm,
              })
            : null
        }
        reason={
          excludeScopeToConfirm === 'both' ? 'removePieces' : 'hideActions'
        }
        onConfirm={() => {
          setExcludeScopeToConfirm(null);
          if (excludeRequestToConfirm) {
            save(excludeRequestToConfirm);
          }
        }}
        onCancel={() => setExcludeScopeToConfirm(null)}
      />
    </>
  );
};

function BulkScopeMenu({
  label,
  icon,
  onSelect,
}: {
  label: string;
  icon: ReactNode;
  onSelect: (scope: BulkScope) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          {icon}
          {label}
          <ChevronDown className="ml-1 size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => onSelect('actions')}>
          {t('Actions only')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onSelect('triggers')}>
          {t('Triggers only')}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onSelect('both')}>
          {t('Actions and triggers')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function buildIncludeRequest({
  pieceSet,
  pieceNames,
  scope,
}: {
  pieceSet: PieceSet;
  pieceNames: string[];
  scope: BulkScope;
}): UpdatePieceSetRequestBody {
  const showAll = selectionPerPiece({ pieceNames, selection: { mode: 'all' } });
  return {
    pieces: pieceSetVisibilityUtils.setPiecesVisible({
      pieces: pieceSet.config.pieces,
      pieceNames,
      visible: true,
    }),
    actions: scope === 'triggers' ? undefined : showAll,
    triggers: scope === 'actions' ? undefined : showAll,
  };
}

function buildExcludeRequest({
  pieceSet,
  pieceNames,
  scope,
}: {
  pieceSet: PieceSet;
  pieceNames: string[];
  scope: BulkScope;
}): UpdatePieceSetRequestBody {
  if (scope === 'both') {
    return {
      pieces: pieceSetVisibilityUtils.setPiecesVisible({
        pieces: pieceSet.config.pieces,
        pieceNames,
        visible: false,
      }),
    };
  }
  const showNone = selectionPerPiece({
    pieceNames,
    selection: { mode: 'selected', selected: [] },
  });
  return scope === 'actions' ? { actions: showNone } : { triggers: showNone };
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

type BulkScope = 'actions' | 'triggers' | 'both';
