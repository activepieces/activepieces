import { ActionBase, TriggerBase } from '@activepieces/pieces-framework';
import { PieceSet } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { pieceSetMutations } from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

type PieceComponentVisibilitySheetProps = {
  pieceName: string;
  pieceDisplayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pieceSet: PieceSet;
};

type ComponentItem =
  | { type: 'action'; data: ActionBase }
  | { type: 'trigger'; data: TriggerBase };

type VisibilityMode = 'all' | 'selected';

export const PieceComponentVisibilitySheet = ({
  pieceName,
  pieceDisplayName,
  open,
  onOpenChange,
  pieceSet,
}: PieceComponentVisibilitySheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <PieceComponentVisibilitySheetContent
          key={`${pieceName}:${open}`}
          pieceName={pieceName}
          pieceDisplayName={pieceDisplayName}
          open={open}
          onOpenChange={onOpenChange}
          pieceSet={pieceSet}
        />
      </SheetContent>
    </Sheet>
  );
};

PieceComponentVisibilitySheet.displayName = 'PieceComponentVisibilitySheet';

function PieceComponentVisibilitySheetContent({
  pieceName,
  pieceDisplayName,
  open,
  onOpenChange,
  pieceSet,
}: PieceComponentVisibilitySheetProps) {
  const { pieceModel, isLoading } = piecesHooks.usePiece({
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

  const { mutate: updatePieceSet, isPending: isPieceSetPending } =
    pieceSetMutations.useUpdatePieceSet();

  const isMutating = isPieceSetPending;

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

  const handleSave = () => {
    if (mode === 'all') {
      updatePieceSet(
        {
          id: pieceSet.id,
          request: {
            actions: { [pieceName]: { mode: 'all' } },
            triggers: { [pieceName]: { mode: 'all' } },
          },
        },
        { onSuccess: () => onOpenChange(false) },
      );
      return;
    }

    const selectedActionNames = allActionNames.filter(
      (n) => !localHiddenActions.includes(n),
    );
    const selectedTriggerNames = allTriggerNames.filter(
      (n) => !localHiddenTriggers.includes(n),
    );

    updatePieceSet(
      {
        id: pieceSet.id,
        request: {
          actions: {
            [pieceName]: { mode: 'selected', selected: selectedActionNames },
          },
          triggers: {
            [pieceName]: {
              mode: 'selected',
              selected: selectedTriggerNames,
            },
          },
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const showCheckboxes = mode === 'selected';

  return (
    <>
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
          onValueChange={(value) => setMode(value as VisibilityMode)}
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
                showCheckboxes={showCheckboxes}
                onToggle={toggleComponent}
              />
            )}
          </>
        )}
      </SheetBody>

      <SheetFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isMutating}
        >
          {t('Cancel')}
        </Button>
        <Button disabled={!isDirty} loading={isMutating} onClick={handleSave}>
          {t('Save')}
        </Button>
      </SheetFooter>
    </>
  );
}

type ComponentSectionProps = {
  label: string;
  items: ComponentItem[];
  visibleCount: number;
  hiddenNames: string[];
  showCheckboxes: boolean;
  onToggle: (item: ComponentItem) => void;
};

function ComponentSection({
  label,
  items,
  visibleCount,
  hiddenNames,
  showCheckboxes,
  onToggle,
}: ComponentSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <CollapsibleTrigger className="flex w-full items-center gap-2">
        {expanded ? (
          <ChevronDown className="size-4 shrink-0 text-gray-11" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-gray-11" />
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
              </label>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
