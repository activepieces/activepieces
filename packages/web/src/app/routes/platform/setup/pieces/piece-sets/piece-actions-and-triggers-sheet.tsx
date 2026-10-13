import { unique } from '@activepieces/core-utils';
import {
  ActionBase,
  ActionClassification,
  TriggerBase,
} from '@activepieces/pieces-framework';
import { PieceSet } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AdminFetchErrorState, SaveBar } from '@/app/components/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ChangePieceSet,
  PieceSetChange,
  pieceSetChanges,
} from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { ACTION_CLASSIFICATION_BADGES } from '@/features/pieces/utils/action-classification';
import { AdminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { ConfirmExcludingRequiredActionsDialog } from './confirm-excluding-required-actions';
import {
  CountTabs,
  PolicySheet,
  SkeletonRows,
  sameNames,
  useGuardedClose,
} from './policy-ui';

export const PieceActionsAndTriggersSheet = (
  props: PieceActionsAndTriggersSheetProps,
) =>
  props.open ? (
    <PieceActionsAndTriggersSheetContent key={props.pieceName} {...props} />
  ) : null;

PieceActionsAndTriggersSheet.displayName = 'PieceActionsAndTriggersSheet';

function PieceActionsAndTriggersSheetContent({
  pieceName,
  pieceDisplayName,
  open,
  onOpenChange,
  pieceSet,
  onChange,
}: PieceActionsAndTriggersSheetProps) {
  const { pieceModel, isLoading, isError, refetch } = piecesHooks.usePiece({
    name: pieceName,
    enabled: open,
  });

  const allActions = useMemo<ComponentItem[]>(
    () =>
      pieceModel
        ? Object.values(pieceModel.actions).map((data) => ({
            type: 'action' as const,
            data,
          }))
        : [],
    [pieceModel],
  );
  const allTriggers = useMemo<ComponentItem[]>(
    () =>
      pieceModel
        ? Object.values(pieceModel.triggers).map((data) => ({
            type: 'trigger' as const,
            data,
          }))
        : [],
    [pieceModel],
  );
  const allActionNames = allActions.map((item) => item.data.name);
  const allTriggerNames = allTriggers.map((item) => item.data.name);

  const originalMode: VisibilityMode =
    pieceName in pieceSet.config.selectedActions ||
    pieceName in pieceSet.config.selectedTriggers
      ? 'selected'
      : 'all';
  const originalHiddenActions = hiddenNames({
    mode: originalMode,
    allNames: allActionNames,
    selected: pieceSet.config.selectedActions[pieceName],
  });
  const originalHiddenTriggers = hiddenNames({
    mode: originalMode,
    allNames: allTriggerNames,
    selected: pieceSet.config.selectedTriggers[pieceName],
  });

  const [mode, setMode] = useState<VisibilityMode>(originalMode);
  const [touchedHiddenActions, setTouchedHiddenActions] = useState<
    string[] | null
  >(null);
  const [touchedHiddenTriggers, setTouchedHiddenTriggers] = useState<
    string[] | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [pendingChange, setPendingChange] = useState<PieceSetChange | null>(
    null,
  );

  const localHiddenActions = touchedHiddenActions ?? originalHiddenActions;
  const localHiddenTriggers = touchedHiddenTriggers ?? originalHiddenTriggers;
  const requiredActionNames =
    pieceSet.config.requiredActions.actions[pieceName] ?? [];

  const visibleActionCount = allActionNames.filter(
    (name) => !localHiddenActions.includes(name),
  ).length;
  const visibleTriggerCount = allTriggerNames.filter(
    (name) => !localHiddenTriggers.includes(name),
  ).length;
  const totalCount = allActions.length + allTriggers.length;
  const checkedCount = visibleActionCount + visibleTriggerCount;
  const selectAllState: boolean | 'indeterminate' =
    checkedCount === 0
      ? false
      : checkedCount === totalCount
      ? true
      : 'indeterminate';

  const toggleComponent = (item: ComponentItem) => {
    const flip = (names: string[]) =>
      names.includes(item.data.name)
        ? names.filter((name) => name !== item.data.name)
        : [...names, item.data.name];
    if (item.type === 'action') {
      setTouchedHiddenActions(flip(localHiddenActions));
    } else {
      setTouchedHiddenTriggers(flip(localHiddenTriggers));
    }
  };

  const actionNamesWith = (classifications: ActionClassification[]) =>
    allActions
      .filter(
        (item) =>
          item.data.classification !== undefined &&
          classifications.includes(item.data.classification),
      )
      .map((item) => item.data.name);
  const destructiveNames = actionNamesWith(['DESTRUCTIVE']);
  const writeOrDestructiveNames = actionNamesWith(['WRITE', 'DESTRUCTIVE']);
  const hide = (names: string[]) =>
    setTouchedHiddenActions(unique([...localHiddenActions, ...names]));

  const toggleSelectAll = () => {
    const hideAll = checkedCount === totalCount;
    setTouchedHiddenActions(hideAll ? allActionNames : []);
    setTouchedHiddenTriggers(hideAll ? allTriggerNames : []);
  };

  const hiddenChanged =
    !sameNames(localHiddenActions, originalHiddenActions) ||
    !sameNames(localHiddenTriggers, originalHiddenTriggers);
  const isDirty =
    mode !== originalMode || (mode === 'selected' && hiddenChanged);

  const close = () => onOpenChange(false);
  const { requestClose, dialog: leaveDialog } = useGuardedClose({
    dirty: isDirty && !saving,
    onClose: close,
  });

  const discard = () => {
    setMode(originalMode);
    setTouchedHiddenActions(null);
    setTouchedHiddenTriggers(null);
  };

  const saveChange = async (change: PieceSetChange) => {
    setSaving(true);
    const saved = await onChange(change);
    setSaving(false);
    if (saved) {
      close();
    }
  };

  const handleSave = () => {
    if (!isDirty || saving || !pieceModel) {
      return;
    }
    const change: PieceSetChange = {
      type: 'components',
      pieceName,
      pieceDisplayName,
      actions:
        mode === 'all'
          ? { mode: 'all' }
          : {
              mode: 'selected',
              selected: allActionNames.filter(
                (name) => !localHiddenActions.includes(name),
              ),
            },
      triggers:
        mode === 'all'
          ? { mode: 'all' }
          : {
              mode: 'selected',
              selected: allTriggerNames.filter(
                (name) => !localHiddenTriggers.includes(name),
              ),
            },
    };
    const excluded = pieceSetChanges.excludedRequiredActions({
      pieceSet,
      change,
    });
    if (Object.keys(excluded).length > 0) {
      setPendingChange(change);
      return;
    }
    saveChange(change).catch(() => undefined);
  };

  const showCheckboxes = mode === 'selected';

  return (
    <>
      <PolicySheet
        open
        onRequestClose={requestClose}
        title={t('Actions and triggers for {name}', {
          name: pieceDisplayName,
        })}
        description={t(
          'Choose whether builders see every action, or only some.',
        )}
        toolbar={
          <>
            <CountTabs
              label={t('Which actions and triggers builders see')}
              value={mode}
              onValueChange={setMode}
              options={[
                { value: 'all', label: t('Show all') },
                { value: 'selected', label: t('Show only some') },
              ]}
            />
            <p className="text-xs text-gray-11">
              {mode === 'all'
                ? t(
                    'Builders see every action and trigger of this piece, including ones added later.',
                  )
                : t(
                    'Builders see only the checked ones. Actions and triggers added to this piece later stay hidden until you check them here.',
                  )}
            </p>
          </>
        }
        footer={
          <SaveBar
            dirty={isDirty}
            saving={saving}
            disabled={!pieceModel}
            onSave={handleSave}
            onDiscard={discard}
            saveControl={AdminControl.PIECE_SETS_COMPONENTS_SUBMIT}
          />
        }
      >
        {showCheckboxes && totalCount > 0 && (
          <label className="flex cursor-pointer items-center gap-3">
            <Checkbox
              checked={selectAllState}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm font-medium">{t('Select all')}</span>
            <span className="ml-auto text-sm text-gray-11 tabular-nums">
              {t('{count} of {total} shown', {
                count: checkedCount,
                total: totalCount,
              })}
            </span>
          </label>
        )}
        {showCheckboxes && writeOrDestructiveNames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {destructiveNames.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => hide(destructiveNames)}
              >
                {t('Hide destructive actions')}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => hide(writeOrDestructiveNames)}
            >
              {t('Hide write and destructive actions')}
            </Button>
          </div>
        )}
        {isLoading ? (
          <SkeletonRows count={6} className="h-12 rounded-lg" />
        ) : isError ? (
          <AdminFetchErrorState
            entity={t('actions and triggers')}
            onRetry={refetch}
          />
        ) : totalCount === 0 ? (
          <p className="text-sm text-gray-11">
            {t('This piece has no actions or triggers.')}
          </p>
        ) : (
          <>
            {allActions.length > 0 && (
              <ComponentSection
                label={t('Actions')}
                items={allActions}
                visibleCount={visibleActionCount}
                hiddenNames={localHiddenActions}
                requiredNames={requiredActionNames}
                showCheckboxes={showCheckboxes}
                onToggle={toggleComponent}
              />
            )}
            {allTriggers.length > 0 && (
              <ComponentSection
                label={t('Triggers')}
                items={allTriggers}
                visibleCount={visibleTriggerCount}
                hiddenNames={localHiddenTriggers}
                requiredNames={[]}
                showCheckboxes={showCheckboxes}
                onToggle={toggleComponent}
              />
            )}
          </>
        )}
      </PolicySheet>
      {leaveDialog}
      <ConfirmExcludingRequiredActionsDialog
        excludedRequiredActions={
          pendingChange === null
            ? null
            : pieceSetChanges.excludedRequiredActions({
                pieceSet,
                change: pendingChange,
              })
        }
        reason="excludeActions"
        onConfirm={() => {
          const change = pendingChange;
          setPendingChange(null);
          return change === null ? undefined : saveChange(change);
        }}
        onCancel={() => setPendingChange(null)}
      />
    </>
  );
}

function ComponentSection({
  label,
  items,
  visibleCount,
  hiddenNames,
  requiredNames,
  showCheckboxes,
  onToggle,
}: ComponentSectionProps) {
  const [expanded, setExpanded] = useState(true);
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className="flex w-full items-center gap-2">
        <Chevron className="size-4 shrink-0 text-gray-11" />
        <span className="text-sm font-medium text-gray-11">{label}</span>
        <Badge variant="info" className="tabular-nums">
          {visibleCount}/{items.length}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col divide-y divide-gray-6 pt-3">
          {items.map((item) => {
            const isHidden = hiddenNames.includes(item.data.name);
            return (
              <label
                key={`${item.type}:${item.data.name}`}
                className={cn(
                  'flex items-start gap-3 py-3',
                  showCheckboxes && 'cursor-pointer',
                  showCheckboxes && isHidden && 'opacity-50',
                )}
              >
                {showCheckboxes && (
                  <span className="flex h-5 items-center">
                    <Checkbox
                      checked={!isHidden}
                      onCheckedChange={() => onToggle(item)}
                    />
                  </span>
                )}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-medium text-gray-12">
                    {item.data.displayName}
                  </span>
                  {item.data.description && (
                    <p className="text-xs text-gray-11">
                      {item.data.description}
                    </p>
                  )}
                </div>
                {item.data.classification !== undefined && (
                  <Badge
                    variant={CLASSIFICATION_VARIANT[item.data.classification]}
                    className="shrink-0"
                  >
                    {ACTION_CLASSIFICATION_BADGES[
                      item.data.classification
                    ].label()}
                  </Badge>
                )}
                {requiredNames.includes(item.data.name) && (
                  <Badge variant="outline" className="shrink-0">
                    {t('Required')}
                  </Badge>
                )}
              </label>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function hiddenNames({
  mode,
  allNames,
  selected,
}: {
  mode: VisibilityMode;
  allNames: string[];
  selected: string[] | undefined;
}): string[] {
  if (mode !== 'selected' || selected === undefined) {
    return [];
  }
  return allNames.filter((name) => !selected.includes(name));
}

type PieceActionsAndTriggersSheetProps = {
  pieceName: string;
  pieceDisplayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pieceSet: PieceSet;
  onChange: ChangePieceSet;
};

type ComponentItem =
  | { type: 'action'; data: ActionBase }
  | { type: 'trigger'; data: TriggerBase };

type VisibilityMode = 'all' | 'selected';

type ComponentSectionProps = {
  label: string;
  items: ComponentItem[];
  visibleCount: number;
  hiddenNames: string[];
  requiredNames: string[];
  showCheckboxes: boolean;
  onToggle: (item: ComponentItem) => void;
};

const CLASSIFICATION_VARIANT: Record<
  ActionClassification,
  'outline' | 'warning' | 'destructive'
> = {
  READ: 'outline',
  SEARCH: 'outline',
  WRITE: 'warning',
  DESTRUCTIVE: 'destructive',
};
