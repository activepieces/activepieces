import {
  ActionBase,
  PieceMetadataModel,
  TriggerBase,
} from '@activepieces/pieces-framework';
import { PieceSet } from '@activepieces/shared';
import { t } from 'i18next';
import { Loader2 } from 'lucide-react';
import { useReducer, useState } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { pieceSetMutations } from '@/features/piece-sets';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { ConfirmHidingRequiredActionsDialog } from './confirm-hiding-required-actions';
import { ModeRadioCards } from './mode-radio-cards';
import {
  PieceActionsAndTriggersEvent,
  pieceActionsAndTriggersState,
  PieceActionsAndTriggersState,
  VisibilityMode,
} from './piece-actions-and-triggers-state';
import { pieceSetVisibilityUtils } from './piece-set-visibility-utils';

export const PieceActionsAndTriggersSheet = ({
  pieceName,
  pieceDisplayName,
  open,
  onOpenChange,
  pieceSet,
}: PieceActionsAndTriggersSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] flex flex-col p-0">
        <PieceActionsAndTriggersSheetBody
          key={pieceName}
          pieceName={pieceName}
          pieceDisplayName={pieceDisplayName}
          pieceSet={pieceSet}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
};

PieceActionsAndTriggersSheet.displayName = 'PieceActionsAndTriggersSheet';

function PieceActionsAndTriggersSheetBody({
  pieceName,
  pieceDisplayName,
  pieceSet,
  onClose,
}: {
  pieceName: string;
  pieceDisplayName: string;
  pieceSet: PieceSet;
  onClose: () => void;
}) {
  const { pieceModel, isLoading, refetch } = piecesHooks.usePiece({
    name: pieceName,
  });

  return (
    <>
      <SheetHeader className="px-6 py-4 border-b shrink-0 flex-row items-center gap-3 space-y-0">
        <PieceIcon
          size="lg"
          border={true}
          displayName={pieceDisplayName}
          logoUrl={pieceModel?.logoUrl}
          showTooltip={false}
        />
        <div className="flex flex-col gap-0.5 min-w-0">
          <SheetTitle className="text-base">{pieceDisplayName}</SheetTitle>
          <SheetDescription>
            {t('Choose which actions/triggers this set includes.')}
          </SheetDescription>
        </div>
      </SheetHeader>
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : !pieceModel ? (
        <DataFetchErrorState
          entity={t('actions and triggers')}
          onRetry={refetch}
        />
      ) : (
        <PieceActionsAndTriggersEditor
          piece={pieceModel}
          pieceName={pieceName}
          pieceSet={pieceSet}
          onClose={onClose}
        />
      )}
    </>
  );
}

function PieceActionsAndTriggersEditor({
  piece,
  pieceName,
  pieceSet,
  onClose,
}: {
  piece: PieceMetadataModel;
  pieceName: string;
  pieceSet: PieceSet;
  onClose: () => void;
}) {
  const actions = Object.values(piece.actions);
  const triggers = Object.values(piece.triggers);
  const [state, dispatch] = useReducer(
    pieceActionsAndTriggersState.reduce,
    {
      pieceSet,
      pieceName,
      actionNames: actions.map((action) => action.name),
      triggerNames: triggers.map((trigger) => trigger.name),
    },
    pieceActionsAndTriggersState.init,
  );
  const [confirmingSave, setConfirmingSave] = useState(false);
  const { mutate: updatePieceSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();
  const request = pieceActionsAndTriggersState.toUpdateRequest({
    state,
    pieceName,
  });
  const requiredActionNames =
    pieceSet.config.requiredActions.actions[pieceName] ?? [];

  const updateAndClose = () =>
    updatePieceSet({ id: pieceSet.id, request }, { onSuccess: onClose });

  const save = () => {
    if (
      pieceSetVisibilityUtils.hasHiddenRequiredActions({ pieceSet, request })
    ) {
      setConfirmingSave(true);
      return;
    }
    updateAndClose();
  };

  const isEmpty = actions.length === 0 && triggers.length === 0;
  const showCheckboxes = state.mode === 'selected';

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
        <ModeCards
          mode={state.mode}
          onChange={(mode) => dispatch({ type: 'setMode', mode })}
        />
        {isEmpty ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            {t('No actions or triggers found')}
          </div>
        ) : (
          <>
            {showCheckboxes && (
              <SelectAll
                checkedCount={
                  state.selectedActions.length + state.selectedTriggers.length
                }
                totalCount={
                  state.actionNames.length + state.triggerNames.length
                }
                onToggle={() => dispatch({ type: 'toggleSelectAll' })}
              />
            )}
            {actions.length > 0 && (
              <ActionsSection
                actions={actions}
                state={state}
                requiredActionNames={requiredActionNames}
                onEvent={dispatch}
              />
            )}
            {triggers.length > 0 && (
              <TriggersSection
                triggers={triggers}
                state={state}
                onEvent={dispatch}
              />
            )}
          </>
        )}
      </div>
      <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          {t('Cancel')}
        </Button>
        <Button disabled={isPending} onClick={save}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {t('Save changes')}
        </Button>
      </div>
      <ConfirmHidingRequiredActionsDialog
        hiddenRequiredActions={
          confirmingSave
            ? pieceSetVisibilityUtils.findHiddenRequiredActions({
                pieceSet,
                request,
              })
            : null
        }
        reason="hideActions"
        onConfirm={() => {
          setConfirmingSave(false);
          updateAndClose();
        }}
        onCancel={() => setConfirmingSave(false)}
      />
    </>
  );
}

function ModeCards({
  mode,
  onChange,
}: {
  mode: VisibilityMode;
  onChange: (mode: VisibilityMode) => void;
}) {
  return (
    <ModeRadioCards
      title={t('What to include in the set')}
      value={mode}
      options={[
        {
          value: 'all',
          label: t('All'),
          description: t(
            'Everything in this piece, including actions/triggers added later.',
          ),
        },
        {
          value: 'selected',
          label: t('Only selected'),
          description: t(
            'Only what you check below. New actions/triggers stay hidden.',
          ),
        },
      ]}
      onChange={onChange}
    />
  );
}

function SelectAll({
  checkedCount,
  totalCount,
  onToggle,
}: {
  checkedCount: number;
  totalCount: number;
  onToggle: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <Checkbox
        checked={pieceSetVisibilityUtils.determineSelectionCheckboxState({
          checkedCount,
          totalCount,
        })}
        onCheckedChange={onToggle}
      />
      <span className="text-sm font-medium">{t('Select all')}</span>
      <span className="text-sm text-muted-foreground">
        {t('{count} of {total} selected', {
          count: checkedCount,
          total: totalCount,
        })}
      </span>
    </label>
  );
}

function ActionsSection({
  actions,
  state,
  requiredActionNames,
  onEvent,
}: {
  actions: ActionBase[];
  state: PieceActionsAndTriggersState;
  requiredActionNames: string[];
  onEvent: (event: PieceActionsAndTriggersEvent) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold">{t('Actions')}</span>
      <div className="flex flex-col gap-1 pt-2">
        {actions.map((action) => (
          <ComponentRow
            key={action.name}
            component={action}
            showCheckbox={state.mode === 'selected'}
            checked={state.selectedActions.includes(action.name)}
            required={requiredActionNames.includes(action.name)}
            onToggle={() =>
              onEvent({ type: 'toggleAction', name: action.name })
            }
          />
        ))}
      </div>
    </div>
  );
}

function TriggersSection({
  triggers,
  state,
  onEvent,
}: {
  triggers: TriggerBase[];
  state: PieceActionsAndTriggersState;
  onEvent: (event: PieceActionsAndTriggersEvent) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold">{t('Triggers')}</span>
      <div className="flex flex-col gap-1 pt-2">
        {triggers.map((trigger) => (
          <ComponentRow
            key={trigger.name}
            component={trigger}
            showCheckbox={state.mode === 'selected'}
            checked={state.selectedTriggers.includes(trigger.name)}
            onToggle={() =>
              onEvent({ type: 'toggleTrigger', name: trigger.name })
            }
          />
        ))}
      </div>
    </div>
  );
}

function ComponentRow({
  component,
  showCheckbox,
  checked,
  required = false,
  onToggle,
}: {
  component: ActionBase | TriggerBase;
  showCheckbox: boolean;
  checked: boolean;
  required?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <label
        className={cn(
          'flex flex-1 min-w-0 items-start gap-3',
          showCheckbox && 'cursor-pointer',
        )}
      >
        {showCheckbox && (
          <Checkbox
            className="mt-0.5"
            checked={checked}
            onCheckedChange={onToggle}
          />
        )}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-medium">{component.displayName}</span>
          {component.description && (
            <span className="text-sm text-muted-foreground">
              {component.description}
            </span>
          )}
        </div>
      </label>
      {required && (
        <Badge variant="outline" className="shrink-0">
          {t('Required')}
        </Badge>
      )}
    </div>
  );
}

type PieceActionsAndTriggersSheetProps = {
  pieceName: string;
  pieceDisplayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pieceSet: PieceSet;
};
