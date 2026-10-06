import { ActionBase, TriggerBase } from '@activepieces/pieces-framework';
import { PieceSet } from '@activepieces/shared';
import { ArrowDown01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { useMemo, useState } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { useGuardedClose } from '@/components/custom/leave-without-saving';
import { SaveBar } from '@/components/custom/settings-parts';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChangePieceSet,
  PieceSetChange,
  pieceSetChanges,
} from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { AdminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { SheetSaveForm } from '../sheet-save-form';

import { ConfirmExcludingRequiredActionsDialog } from './confirm-excluding-required-actions';

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

  const allActionNames = useMemo(
    () => (pieceModel ? Object.keys(pieceModel.actions) : []),
    [pieceModel],
  );
  const allTriggerNames = useMemo(
    () => (pieceModel ? Object.keys(pieceModel.triggers) : []),
    [pieceModel],
  );

  const originalMode: VisibilityMode =
    pieceName in pieceSet.config.selectedActions ||
    pieceName in pieceSet.config.selectedTriggers
      ? 'selected'
      : 'all';

  const originalHiddenActions = useMemo(() => {
    if (originalMode !== 'selected') {
      return [];
    }
    const selected = pieceSet.config.selectedActions[pieceName] ?? [];
    return allActionNames.filter((n) => !selected.includes(n));
  }, [pieceSet, pieceName, originalMode, allActionNames]);

  const originalHiddenTriggers = useMemo(() => {
    if (originalMode !== 'selected') {
      return [];
    }
    const selected = pieceSet.config.selectedTriggers[pieceName] ?? [];
    return allTriggerNames.filter((n) => !selected.includes(n));
  }, [pieceSet, pieceName, originalMode, allTriggerNames]);

  const [mode, setMode] = useState<VisibilityMode>(originalMode);
  const [touchedHiddenActions, setTouchedHiddenActions] = useState<
    string[] | null
  >(null);
  const [touchedHiddenTriggers, setTouchedHiddenTriggers] = useState<
    string[] | null
  >(null);

  const localHiddenActions = touchedHiddenActions ?? originalHiddenActions;
  const localHiddenTriggers = touchedHiddenTriggers ?? originalHiddenTriggers;
  const setLocalHiddenActions = (
    updater: string[] | ((prev: string[]) => string[]),
  ) =>
    setTouchedHiddenActions((prev) => {
      const current = prev ?? originalHiddenActions;
      return typeof updater === 'function' ? updater(current) : updater;
    });
  const setLocalHiddenTriggers = (
    updater: string[] | ((prev: string[]) => string[]),
  ) =>
    setTouchedHiddenTriggers((prev) => {
      const current = prev ?? originalHiddenTriggers;
      return typeof updater === 'function' ? updater(current) : updater;
    });

  const [saving, setSaving] = useState(false);
  const [pendingChange, setPendingChange] = useState<PieceSetChange | null>(
    null,
  );
  const requiredActionNames =
    pieceSet.config.requiredActions.actions[pieceName] ?? [];

  const allActions = useMemo<ComponentItem[]>(() => {
    if (!pieceModel) return [];
    return Object.values(pieceModel.actions).map((a) => ({
      type: 'action' as const,
      data: a,
    }));
  }, [pieceModel]);

  const allTriggers = useMemo<ComponentItem[]>(() => {
    if (!pieceModel) return [];
    return Object.values(pieceModel.triggers).map((tr) => ({
      type: 'trigger' as const,
      data: tr,
    }));
  }, [pieceModel]);

  const visibleActionCount = allActions.filter(
    (item) => !localHiddenActions.includes(item.data.name),
  ).length;
  const visibleTriggerCount = allTriggers.filter(
    (item) => !localHiddenTriggers.includes(item.data.name),
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
    if (item.type === 'action') {
      setLocalHiddenActions((prev) =>
        prev.includes(item.data.name)
          ? prev.filter((n) => n !== item.data.name)
          : [...prev, item.data.name],
      );
    } else {
      setLocalHiddenTriggers((prev) =>
        prev.includes(item.data.name)
          ? prev.filter((n) => n !== item.data.name)
          : [...prev, item.data.name],
      );
    }
  };

  const toggleSelectAll = () => {
    if (checkedCount === totalCount) {
      setLocalHiddenActions(allActions.map((item) => item.data.name));
      setLocalHiddenTriggers(allTriggers.map((item) => item.data.name));
    } else {
      setLocalHiddenActions([]);
      setLocalHiddenTriggers([]);
    }
  };

  const hiddenChanged =
    JSON.stringify([...localHiddenActions].sort()) !==
      JSON.stringify([...originalHiddenActions].sort()) ||
    JSON.stringify([...localHiddenTriggers].sort()) !==
      JSON.stringify([...originalHiddenTriggers].sort());

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

  const handleSave = async () => {
    if (!isDirty || saving || !pieceModel) {
      return;
    }
    const selectedActionNames = allActionNames.filter(
      (n) => !localHiddenActions.includes(n),
    );
    const selectedTriggerNames = allTriggerNames.filter(
      (n) => !localHiddenTriggers.includes(n),
    );
    const change: PieceSetChange = {
      type: 'components',
      pieceName,
      pieceDisplayName,
      actions:
        mode === 'all'
          ? { mode: 'all' }
          : { mode: 'selected', selected: selectedActionNames },
      triggers:
        mode === 'all'
          ? { mode: 'all' }
          : { mode: 'selected', selected: selectedTriggerNames },
    };
    const excluded = pieceSetChanges.excludedRequiredActions({
      pieceSet,
      change,
    });
    if (Object.keys(excluded).length > 0) {
      setPendingChange(change);
      return;
    }
    await saveChange(change);
  };

  const saveChange = async (change: PieceSetChange) => {
    setSaving(true);
    const saved = await onChange(change);
    setSaving(false);
    if (saved) {
      close();
    }
  };

  const showCheckboxes = mode === 'selected';

  return (
    <Sheet open onOpenChange={(next) => !next && requestClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {t('Actions and triggers for {name}', { name: pieceDisplayName })}
          </SheetTitle>
          <SheetDescription>
            {t('Choose whether every action is allowed, or only some.')}
          </SheetDescription>
        </SheetHeader>

        <div className="flex shrink-0 flex-col gap-2 border-b p-5">
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
        </div>

        <SheetBody>
          {showCheckboxes && (
            <label className="flex cursor-pointer items-center gap-3">
              <Checkbox
                checked={selectAllState}
                onCheckedChange={toggleSelectAll}
                disabled={totalCount === 0}
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
              <Spinner />
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
        </SheetBody>

        {isDirty && (
          <SheetFooter>
            <SheetSaveForm onSubmit={handleSave}>
              <SaveBar
                dirty={isDirty}
                saving={saving}
                invalid={!pieceModel}
                onDiscard={discard}
                saveControl={AdminControl.PIECE_SETS_COMPONENTS_SUBMIT}
              />
            </SheetSaveForm>
          </SheetFooter>
        )}
      </SheetContent>
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
    </Sheet>
  );
}

type ComponentSectionProps = {
  label: string;
  items: ComponentItem[];
  visibleCount: number;
  hiddenNames: string[];
  requiredNames: string[];
  showCheckboxes: boolean;
  onToggle: (item: ComponentItem) => void;
};

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

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className="flex w-full items-center gap-2">
        {expanded ? (
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="size-4 shrink-0 text-gray-11"
          />
        ) : (
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4 shrink-0 text-gray-11"
          />
        )}
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
                    <p className="truncate text-xs text-gray-11">
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
