import { ActionBase, TriggerBase } from '@activepieces/pieces-framework';
import { PieceSet } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { SaveBar } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { LoadingSpinner } from '@/components/custom/spinner';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChangePieceSet,
  PieceSetChange,
  pieceSetChanges,
} from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { AdminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { ConfirmExcludingRequiredActionsDialog } from './confirm-excluding-required-actions';
import { PolicySheet, useGuardedClose } from './policy-ui';

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

  const toggleSelectAll = () => {
    const hideAll = checkedCount === totalCount;
    setTouchedHiddenActions(hideAll ? allActionNames : []);
    setTouchedHiddenTriggers(hideAll ? allTriggerNames : []);
  };

  const hiddenChanged =
    sortedKey(localHiddenActions) !== sortedKey(originalHiddenActions) ||
    sortedKey(localHiddenTriggers) !== sortedKey(originalHiddenTriggers);
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
        description={t('Choose whether every action is allowed, or only some.')}
        toolbar={
          <>
            <Tabs
              value={mode}
              onValueChange={(value) =>
                setMode(value === 'selected' ? 'selected' : 'all')
              }
            >
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  {t('All actions & triggers')}
                </TabsTrigger>
                <TabsTrigger value="selected" className="flex-1">
                  {t('Only selected')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-gray-11">
              {mode === 'all'
                ? t(
                    'Every current and future action or trigger in this piece is available to end users. Nothing to configure.',
                  )
                : t(
                    'Only the checked items below are available. New actions and triggers added to this piece later stay hidden until you check them here.',
                  )}
            </p>
          </>
        }
        footer={
          isDirty && (
            <SaveBar
              dirty={isDirty}
              saving={saving}
              disabled={!pieceModel}
              onSave={handleSave}
              onDiscard={discard}
              saveControl={AdminControl.PIECE_SETS_COMPONENTS_SUBMIT}
            />
          )
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
              {t('{count} of {total} selected', {
                count: checkedCount,
                total: totalCount,
              })}
            </span>
          </label>
        )}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : isError ? (
          <DataFetchErrorState
            entity={t('actions and triggers')}
            onRetry={refetch}
          />
        ) : totalCount === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-11">
            {t('No actions or triggers found')}
          </div>
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

function sortedKey(names: string[]): string {
  return [...names].sort().join('|');
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
