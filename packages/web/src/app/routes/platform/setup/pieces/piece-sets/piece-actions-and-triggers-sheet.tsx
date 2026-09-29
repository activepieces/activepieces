import {
  ActionBase,
  PieceMetadataModel,
  TriggerBase,
} from '@activepieces/pieces-framework';
import { PieceSet, RequiredActionsMode } from '@activepieces/shared';
import { t } from 'i18next';
import { CheckCheck, Loader2, TriangleAlert } from 'lucide-react';
import { ReactNode, useReducer } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Toggle } from '@/components/ui/toggle';
import { pieceSetMutations } from '@/features/piece-sets';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

import {
  PieceActionsAndTriggersEvent,
  pieceActionsAndTriggersState,
  PieceActionsAndTriggersState,
  VisibilityMode,
} from './piece-actions-and-triggers-state';

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
  const { mutate: updatePieceSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();

  const save = () =>
    updatePieceSet(
      {
        id: pieceSet.id,
        request: pieceActionsAndTriggersState.toUpdateRequest({
          state,
          pieceName,
        }),
      },
      { onSuccess: onClose },
    );

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
                requiredActionsMode={pieceSet.config.requiredActions.mode}
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
    <div className="flex flex-col gap-2.5">
      <span className="text-sm font-semibold">
        {t('What to include in the set')}
      </span>
      <RadioGroup
        value={mode}
        onValueChange={(value) =>
          onChange(value === 'selected' ? 'selected' : 'all')
        }
        className="grid grid-cols-2 gap-3"
      >
        <ModeCard
          value="all"
          checked={mode === 'all'}
          title={t('All')}
          description={t(
            'Everything in this piece, including actions/triggers added later.',
          )}
        />
        <ModeCard
          value="selected"
          checked={mode === 'selected'}
          title={t('Only selected')}
          description={t(
            'Only what you check below. New actions/triggers stay hidden.',
          )}
        />
      </RadioGroup>
    </div>
  );
}

function ModeCard({
  value,
  checked,
  title,
  description,
}: {
  value: VisibilityMode;
  checked: boolean;
  title: string;
  description: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer flex-col gap-1.5 rounded-lg border p-3 transition-colors',
        checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <RadioGroupItem value={value} />
        {title}
      </span>
      <span className="text-sm text-muted-foreground">{description}</span>
    </label>
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
        checked={toSelectAllState({ checkedCount, totalCount })}
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
  requiredActionsMode,
  onEvent,
}: {
  actions: ActionBase[];
  state: PieceActionsAndTriggersState;
  requiredActionsMode: RequiredActionsMode;
  onEvent: (event: PieceActionsAndTriggersEvent) => void;
}) {
  const actionNamesInSet =
    pieceActionsAndTriggersState.findActionNamesInSet(state);
  const allRequired = pieceActionsAndTriggersState.areAllRequired(state);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-sm font-semibold">{t('Actions')}</span>
        {actionNamesInSet.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEvent({ type: 'toggleAllRequired' })}
          >
            <CheckCheck className="size-4" />
            {allRequired ? t('Mark all optional') : t('Mark all required')}
          </Button>
        )}
      </div>
      <RequiredActionsNotice
        requiredCount={state.requiredActions.length}
        requiredActionsMode={requiredActionsMode}
      />
      <div className="flex flex-col gap-1 pt-2">
        {actions.map((action) => (
          <ComponentRow
            key={action.name}
            component={action}
            showCheckbox={state.mode === 'selected'}
            checked={state.selectedActions.includes(action.name)}
            onToggle={() =>
              onEvent({ type: 'toggleAction', name: action.name })
            }
          >
            <RequiredToggle
              pressed={state.requiredActions.includes(action.name)}
              onPressedChange={() =>
                onEvent({ type: 'toggleRequired', name: action.name })
              }
            />
          </ComponentRow>
        ))}
      </div>
    </div>
  );
}

function RequiredActionsNotice({
  requiredCount,
  requiredActionsMode,
}: {
  requiredCount: number;
  requiredActionsMode: RequiredActionsMode;
}) {
  if (requiredCount === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t(
          'Mark an action as required to stop flows from publishing without it.',
        )}
      </p>
    );
  }
  return (
    <Alert className="mt-2">
      <TriangleAlert className="text-muted-foreground" />
      <AlertTitle>
        {t('requiredActionsBlockPublishing', { count: requiredCount })}
      </AlertTitle>
      <AlertDescription className="text-muted-foreground">
        {requiredActionsMode === RequiredActionsMode.ALL
          ? t(
              "Projects assigned this set can't publish a flow until it includes the required actions. When they click Publish, they're asked to add them as steps.",
            )
          : t(
              "Projects assigned this set can't publish a flow until it includes at least one required action. When they click Publish, they're asked to add one as a step.",
            )}
      </AlertDescription>
    </Alert>
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
  onToggle,
  children,
}: {
  component: ActionBase | TriggerBase;
  showCheckbox: boolean;
  checked: boolean;
  onToggle: () => void;
  children?: ReactNode;
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
      {children}
    </div>
  );
}

function RequiredToggle({
  pressed,
  onPressedChange,
}: {
  pressed: boolean;
  onPressedChange: () => void;
}) {
  return (
    <Toggle
      variant="chip"
      size="xs"
      pressed={pressed}
      onPressedChange={onPressedChange}
      className="shrink-0"
    >
      {pressed ? t('Required') : t('Optional')}
    </Toggle>
  );
}

function toSelectAllState({
  checkedCount,
  totalCount,
}: {
  checkedCount: number;
  totalCount: number;
}): boolean | 'indeterminate' {
  if (checkedCount === 0) {
    return false;
  }
  return checkedCount === totalCount ? true : 'indeterminate';
}

type PieceActionsAndTriggersSheetProps = {
  pieceName: string;
  pieceDisplayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pieceSet: PieceSet;
};
