import { unique } from '@activepieces/core-utils';
import {
  isPieceVisible,
  PieceSet,
  RequiredActionsMode,
  UpdatePieceSetRequestBody,
} from '@activepieces/shared';
import { t } from 'i18next';
import {
  Info,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { pieceSetMutations } from '@/features/piece-sets';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import { cn, DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { ModeRadioCards } from './mode-radio-cards';
import { PieceSelect } from './piece-select';
import { pieceSetInclusionUtils } from './piece-set-inclusion-utils';
import {
  RequiredActionGroup,
  useRequiredActionsGroupedByPiece,
} from './use-required-actions-grouped-by-piece';

export function RequiredActionsTab({ pieceSet }: { pieceSet: PieceSet }) {
  const [editDialog, setEditDialog] = useState<EditDialogState>({
    open: false,
    pieceName: null,
  });
  const { mutate: updateSet } = pieceSetMutations.useUpdatePieceSet();
  const { requiredActions } = pieceSet.config;
  const {
    requiredActionsGroupedByPiece,
    actionsInLatestPieceVersionCount,
    isLoading,
  } = useRequiredActionsGroupedByPiece({
    actions: requiredActions.actions,
  });

  const removeRequiredActions = ({
    pieceName,
    actionNames,
  }: {
    pieceName: string;
    actionNames: string[];
  }) =>
    updateSet({
      id: pieceSet.id,
      request: {
        requiredActions: {
          actions: {
            [pieceName]: (requiredActions.actions[pieceName] ?? []).filter(
              (actionName) => !actionNames.includes(actionName),
            ),
          },
        },
      },
    });

  return (
    <div
      className={cn(
        'flex flex-1 min-h-0 max-w-3xl flex-col gap-5',
        DASHBOARD_CONTENT_PADDING_X,
      )}
    >
      <ModeRadioCards
        title={t('Publishing flows rule')}
        value={requiredActions.mode}
        options={[
          {
            value: RequiredActionsMode.ANY,
            label: t('At least one'),
            description: t(
              'A flow can publish only when it contains at least one required action.',
            ),
          },
          {
            value: RequiredActionsMode.ALL,
            label: t('All required actions'),
            description: t(
              'A flow can publish only when it contains every required action.',
            ),
          },
        ]}
        onChange={(mode) =>
          updateSet({
            id: pieceSet.id,
            request: { requiredActions: { mode } },
          })
        }
      />

      <div className="flex flex-1 min-h-0 flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold">
              {t('Required actions')}
            </span>
            {requiredActionsGroupedByPiece.length > 0 && (
              <span className="text-sm text-gray-11">
                {t('requiredActionsAcrossPieces', {
                  actionCount: actionsInLatestPieceVersionCount,
                  pieceCount: requiredActionsGroupedByPiece.length,
                })}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setEditDialog({ open: true, pieceName: null })}
          >
            <Plus className="size-4" />
            {t('Add actions')}
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-gray-11" />
          </div>
        ) : requiredActionsGroupedByPiece.length > 0 ? (
          <ScrollArea className="flex-1 min-h-0">
            <div className="flex flex-col gap-3 pr-3">
              {requiredActionsGroupedByPiece.map((group) => (
                <PieceRequiredActionsCard
                  key={group.pieceName}
                  group={group}
                  onEdit={() =>
                    setEditDialog({ open: true, pieceName: group.pieceName })
                  }
                  onRemove={(actionNames) =>
                    removeRequiredActions({
                      pieceName: group.pieceName,
                      actionNames,
                    })
                  }
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
            <ListChecks className="size-8 text-gray-11" />
            <span className="text-sm font-medium">
              {t('No required actions')}
            </span>
            <span className="max-w-sm text-sm text-gray-11">
              {requiredActions.mode === RequiredActionsMode.ALL
                ? t(
                    'Choose actions that flows in projects assigned to this set must include before they can publish.',
                  )
                : t(
                    'Choose actions that flows in projects assigned to this set must include at least one of before they can publish.',
                  )}
            </span>
          </div>
        )}
      </div>

      <Dialog
        open={editDialog.open}
        onOpenChange={(open) =>
          setEditDialog((current) => ({ ...current, open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <EditRequiredActionsDialogContent
            key={editDialog.open ? 'open' : 'closed'}
            pieceSet={pieceSet}
            initialPieceName={editDialog.pieceName}
            onClose={() =>
              setEditDialog((current) => ({ ...current, open: false }))
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PieceRequiredActionsCard({
  group,
  onEdit,
  onRemove,
}: {
  group: RequiredActionGroup;
  onEdit: () => void;
  onRemove: (actionNames: string[]) => void;
}) {
  const actionNamesNotInLatestPieceVersion = group.actions
    .filter((action) => action.notInLatestPieceVersion)
    .map((action) => action.name);
  const requiredCount =
    group.actions.length - actionNamesNotInLatestPieceVersion.length;

  return (
    <div className="overflow-hidden rounded-lg border shadow-xs">
      <div className="flex flex-col gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <PieceIcon
            size="sm"
            border={true}
            displayName={group.displayName}
            logoUrl={group.logoUrl}
            showTooltip={false}
          />
          <div className="flex flex-1 items-baseline gap-2 min-w-0">
            <span className="truncate text-sm font-semibold">
              {group.displayName}
            </span>
            <span className="shrink-0 text-sm text-gray-11">
              {t('requiredCount', { count: requiredCount })}
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={t('Edit')}
                onClick={onEdit}
              >
                <Pencil className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Edit')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-danger-11 hover:bg-danger-3 hover:text-danger-11"
                aria-label={t('Remove all')}
                onClick={() =>
                  onRemove(group.actions.map((action) => action.name))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('Remove all')}</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-wrap gap-2 pl-9">
          {group.actions.map((action) => (
            <span
              key={action.name}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm',
                action.notInLatestPieceVersion &&
                  'border-dashed text-gray-11 line-through',
              )}
            >
              {action.displayName}
              <Button
                variant="ghost"
                size="icon-xs"
                className="size-4 text-gray-11 hover:bg-transparent hover:text-gray-12"
                aria-label={t('Remove')}
                onClick={() => onRemove([action.name])}
              >
                <X className="size-3.5" />
              </Button>
            </span>
          ))}
        </div>
      </div>
      {actionNamesNotInLatestPieceVersion.length > 0 && (
        <div className="flex items-center gap-2 border-t bg-gray-3/50 px-4 py-2.5 text-sm text-gray-11">
          <Info className="size-4 shrink-0" />
          <span className="flex-1">
            {t('actionsNotInLatestPieceVersion', {
              count: actionNamesNotInLatestPieceVersion.length,
              pieceName: group.displayName,
            })}
          </span>
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-gray-12 underline"
            onClick={() => onRemove(actionNamesNotInLatestPieceVersion)}
          >
            {t('Remove')}
          </Button>
        </div>
      )}
    </div>
  );
}

function EditRequiredActionsDialogContent({
  pieceSet,
  initialPieceName,
  onClose,
}: {
  pieceSet: PieceSet;
  initialPieceName: string | null;
  onClose: () => void;
}) {
  const savedRequiredActions = pieceSet.config.requiredActions.actions;
  const [pieceName, setPieceName] = useState(initialPieceName);
  const [requiredActionsOfPiece, setRequiredActionsOfPiece] = useState(
    initialPieceName ? savedRequiredActions[initialPieceName] ?? [] : [],
  );
  const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
  });
  const { pieceModel, isLoading: pieceLoading } = piecesHooks.usePiece({
    name: pieceName ?? '',
    enabled: pieceName !== null,
  });
  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();

  const isEditing = initialPieceName !== null;
  const description =
    pieceSet.config.requiredActions.mode === RequiredActionsMode.ALL
      ? t('A flow can publish only when it contains all the actions you check.')
      : t(
          'A flow can publish only when it contains at least one of the actions you check.',
        );
  const editedPiece = pieces?.find((piece) => piece.name === initialPieceName);
  const piecesInSet = (pieces ?? []).filter((piece) =>
    isPieceVisible({ pieces: pieceSet.config.pieces, name: piece.name }),
  );
  const selectedActionsOfPiece = pieceName
    ? pieceSet.config.selectedActions[pieceName]
    : undefined;
  const actions = pieceModel ? Object.values(pieceModel.actions) : [];
  const actionNames = actions.map((action) => action.name);
  const checkedCount = actionNames.filter((name) =>
    requiredActionsOfPiece.includes(name),
  ).length;
  const isExcluded = (actionName: string) =>
    selectedActionsOfPiece !== undefined &&
    !selectedActionsOfPiece.includes(actionName);

  const toggleRequiredAction = (actionName: string) =>
    setRequiredActionsOfPiece((current) =>
      current.includes(actionName)
        ? current.filter((name) => name !== actionName)
        : [...current, actionName],
    );

  const toggleAll = () =>
    setRequiredActionsOfPiece((current) =>
      checkedCount === actionNames.length
        ? current.filter((name) => !actionNames.includes(name))
        : unique([...current, ...actionNames]),
    );

  const save = () => {
    if (!pieceName) {
      return;
    }
    updateSet(
      {
        id: pieceSet.id,
        request: buildSaveRequest({
          pieceName,
          requiredActionsOfPiece,
          selectedActionsOfPiece,
        }),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <>
      {isEditing ? (
        <DialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
          <PieceIcon
            size="lg"
            border={true}
            displayName={editedPiece?.displayName ?? initialPieceName}
            logoUrl={editedPiece?.logoUrl}
            showTooltip={false}
          />
          <div className="flex flex-col gap-1 min-w-0">
            <DialogTitle>
              {t('{pieceName} required actions', {
                pieceName: editedPiece?.displayName ?? initialPieceName,
              })}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </DialogHeader>
      ) : (
        <DialogHeader>
          <DialogTitle>{t('Add required actions')}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
      )}
      <div className="flex flex-col gap-5">
        {!isEditing && (
          <div className="flex flex-col gap-2">
            <Label>{t('Piece')}</Label>
            <PieceSelect
              pieces={piecesInSet}
              value={pieceName}
              loading={piecesLoading}
              onChange={(value) => {
                setPieceName(value);
                setRequiredActionsOfPiece(savedRequiredActions[value] ?? []);
              }}
            />
          </div>
        )}
        {pieceName && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>{t('Actions')}</Label>
              {actions.length > 0 && (
                <span className="text-sm text-gray-11">
                  {t('{count} of {total} selected', {
                    count: checkedCount,
                    total: actions.length,
                  })}
                </span>
              )}
            </div>
            {pieceLoading ? (
              <div className="flex justify-center rounded-lg border py-6">
                <Loader2 className="size-5 animate-spin text-gray-11" />
              </div>
            ) : actions.length === 0 ? (
              <span className="rounded-lg border px-3 py-4 text-sm text-gray-11">
                {t('This piece has no actions.')}
              </span>
            ) : (
              <div className="flex flex-col rounded-lg border">
                <label className="flex min-h-10 cursor-pointer items-center gap-3 border-b px-3">
                  <Checkbox
                    checked={pieceSetInclusionUtils.determineSelectionCheckboxState(
                      {
                        checkedCount,
                        totalCount: actions.length,
                      },
                    )}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm font-medium">{t('Select all')}</span>
                </label>
                <div className="flex max-h-64 flex-col overflow-y-auto py-1">
                  {actions.map((action) => (
                    <label
                      key={action.name}
                      className="flex min-h-10 cursor-pointer items-center gap-3 px-3"
                    >
                      <Checkbox
                        checked={requiredActionsOfPiece.includes(action.name)}
                        onCheckedChange={() =>
                          toggleRequiredAction(action.name)
                        }
                      />
                      <span className="flex-1 text-sm">
                        {action.displayName}
                      </span>
                      {isExcluded(action.name) && (
                        <Badge variant="outline" className="shrink-0">
                          {t('Not in set')}
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {requiredActionsOfPiece.some(isExcluded) && (
              <p className="text-xs text-gray-11">
                {t(
                  'Actions that are not in the set are added to it when you make them required.',
                )}
              </p>
            )}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button
          disabled={(!isEditing && checkedCount === 0) || isPending}
          loading={isPending}
          onClick={save}
        >
          {isEditing
            ? t('Save')
            : t('addActionsCount', { count: checkedCount })}
        </Button>
      </DialogFooter>
    </>
  );
}

function buildSaveRequest({
  pieceName,
  requiredActionsOfPiece,
  selectedActionsOfPiece,
}: {
  pieceName: string;
  requiredActionsOfPiece: string[];
  selectedActionsOfPiece: string[] | undefined;
}): UpdatePieceSetRequestBody {
  const requiredActions = {
    actions: { [pieceName]: requiredActionsOfPiece },
  };
  if (selectedActionsOfPiece === undefined) {
    return { requiredActions };
  }
  return {
    actions: {
      [pieceName]: {
        mode: 'selected',
        selected: unique([
          ...selectedActionsOfPiece,
          ...requiredActionsOfPiece,
        ]),
      },
    },
    requiredActions,
  };
}

type EditDialogState = {
  open: boolean;
  pieceName: string | null;
};
