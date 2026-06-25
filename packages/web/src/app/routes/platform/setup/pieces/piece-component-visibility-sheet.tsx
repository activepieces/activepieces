import { ActionBase, TriggerBase } from '@activepieces/pieces-framework';
import { PieceSet } from '@activepieces/shared';
import { t } from 'i18next';
import { ChevronDown, ChevronRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { pieceSetMutations } from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { platformPiecesMutations } from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { cn } from '@/lib/utils';

type PieceComponentVisibilitySheetProps = {
  pieceName: string;
  pieceDisplayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pieceSet?: PieceSet;
};

type ComponentItem =
  | { type: 'action'; data: ActionBase }
  | { type: 'trigger'; data: TriggerBase };

type ItemKey = string;

function makeKey(item: ComponentItem): ItemKey {
  return `${item.type}:${item.data.name}`;
}

export const PieceComponentVisibilitySheet = ({
  pieceName,
  pieceDisplayName,
  open,
  onOpenChange,
  pieceSet,
}: PieceComponentVisibilitySheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] flex flex-col p-0">
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
  const [search, setSearch] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<Set<ItemKey>>(new Set());
  const [actionsExpanded, setActionsExpanded] = useState(true);
  const [triggersExpanded, setTriggersExpanded] = useState(true);

  const { platform, refetch } = platformHooks.useCurrentPlatform();
  const { pieceModel, isLoading } = piecesHooks.usePiece({
    name: pieceName,
    enabled: open,
  });

  const originalHiddenActions = pieceSet
    ? pieceSet.config.disabledActions[pieceName] ?? []
    : platform.filteredActionNames[pieceName] ?? [];
  const originalHiddenTriggers = pieceSet
    ? pieceSet.config.disabledTriggers[pieceName] ?? []
    : platform.filteredTriggerNames[pieceName] ?? [];

  const [localHiddenActions, setLocalHiddenActions] = useState<string[]>(
    () => originalHiddenActions,
  );
  const [localHiddenTriggers, setLocalHiddenTriggers] = useState<string[]>(
    () => originalHiddenTriggers,
  );

  const isDirty =
    JSON.stringify([...localHiddenActions].sort()) !==
      JSON.stringify([...originalHiddenActions].sort()) ||
    JSON.stringify([...localHiddenTriggers].sort()) !==
      JSON.stringify([...originalHiddenTriggers].sort());

  const { mutate: setPieceComponentVisibility, isPending: isPlatformSaving } =
    platformPiecesMutations.useSetPieceComponentVisibility({
      platformId: platform.id,
      filteredActionNames: platform.filteredActionNames,
      filteredTriggerNames: platform.filteredTriggerNames,
      refetch,
    });

  const { mutate: updatePieceSet, isPending: isPieceSetPending } =
    pieceSetMutations.useUpdatePieceSet();

  const isMutating = isPlatformSaving || isPieceSetPending;

  const toggleComponent = ({
    componentName,
    isAction,
  }: {
    pieceName: string;
    componentName: string;
    isAction: boolean;
  }) => {
    if (isAction) {
      setLocalHiddenActions((prev) =>
        prev.includes(componentName)
          ? prev.filter((n) => n !== componentName)
          : [...prev, componentName],
      );
    } else {
      setLocalHiddenTriggers((prev) =>
        prev.includes(componentName)
          ? prev.filter((n) => n !== componentName)
          : [...prev, componentName],
      );
    }
  };

  const batchHide = ({
    actionNames,
    triggerNames,
  }: {
    pieceName: string;
    actionNames: string[];
    triggerNames: string[];
  }) => {
    setLocalHiddenActions((prev) => [...new Set([...prev, ...actionNames])]);
    setLocalHiddenTriggers((prev) => [...new Set([...prev, ...triggerNames])]);
  };

  const batchShow = ({
    actionNames,
    triggerNames,
  }: {
    pieceName: string;
    actionNames: string[];
    triggerNames: string[];
  }) => {
    setLocalHiddenActions((prev) =>
      prev.filter((n) => !actionNames.includes(n)),
    );
    setLocalHiddenTriggers((prev) =>
      prev.filter((n) => !triggerNames.includes(n)),
    );
  };

  const handleSave = () => {
    if (pieceSet) {
      const newlyDisabledActions = localHiddenActions.filter(
        (n) => !originalHiddenActions.includes(n),
      );
      const newlyEnabledActions = originalHiddenActions.filter(
        (n) => !localHiddenActions.includes(n),
      );
      const newlyDisabledTriggers = localHiddenTriggers.filter(
        (n) => !originalHiddenTriggers.includes(n),
      );
      const newlyEnabledTriggers = originalHiddenTriggers.filter(
        (n) => !localHiddenTriggers.includes(n),
      );
      updatePieceSet(
        {
          id: pieceSet.id,
          request: {
            ...(newlyDisabledActions.length > 0 && {
              disableActions: { [pieceName]: newlyDisabledActions },
            }),
            ...(newlyEnabledActions.length > 0 && {
              enableActions: { [pieceName]: newlyEnabledActions },
            }),
            ...(newlyDisabledTriggers.length > 0 && {
              disableTriggers: { [pieceName]: newlyDisabledTriggers },
            }),
            ...(newlyEnabledTriggers.length > 0 && {
              enableTriggers: { [pieceName]: newlyEnabledTriggers },
            }),
          },
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      setPieceComponentVisibility(
        {
          pieceName,
          hiddenActions: localHiddenActions,
          hiddenTriggers: localHiddenTriggers,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

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

  const filteredActions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allActions.filter(
      (item) => !q || item.data.displayName.toLowerCase().includes(q),
    );
  }, [allActions, search]);

  const filteredTriggers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTriggers.filter(
      (item) => !q || item.data.displayName.toLowerCase().includes(q),
    );
  }, [allTriggers, search]);

  const allVisibleItems = useMemo(
    () => [...filteredActions, ...filteredTriggers],
    [filteredActions, filteredTriggers],
  );

  const visibleActionCount = allActions.filter(
    (item) => !localHiddenActions.includes(item.data.name),
  ).length;

  const visibleTriggerCount = allTriggers.filter(
    (item) => !localHiddenTriggers.includes(item.data.name),
  ).length;

  const allVisibleSelected =
    allVisibleItems.length > 0 &&
    allVisibleItems.every((item) => selectedKeys.has(makeKey(item)));

  const someVisibleSelected =
    !allVisibleSelected &&
    allVisibleItems.some((item) => selectedKeys.has(makeKey(item)));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedKeys(new Set());
    } else {
      setSelectedKeys(new Set(allVisibleItems.map(makeKey)));
    }
  };

  const toggleGroupSelection = (items: ComponentItem[]) => {
    const allSelected = items.every((item) => selectedKeys.has(makeKey(item)));
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        items.forEach((item) => next.delete(makeKey(item)));
      } else {
        items.forEach((item) => next.add(makeKey(item)));
      }
      return next;
    });
  };

  const toggleItemSelection = (item: ComponentItem) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      const key = makeKey(item);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleHideSelected = () => {
    const actionNames = filteredActions
      .filter((item) => selectedKeys.has(makeKey(item)))
      .map((item) => item.data.name);
    const triggerNames = filteredTriggers
      .filter((item) => selectedKeys.has(makeKey(item)))
      .map((item) => item.data.name);
    batchHide({ pieceName, actionNames, triggerNames });
    setSelectedKeys(new Set());
  };

  const handleShowSelected = () => {
    const actionNames = filteredActions
      .filter((item) => selectedKeys.has(makeKey(item)))
      .map((item) => item.data.name);
    const triggerNames = filteredTriggers
      .filter((item) => selectedKeys.has(makeKey(item)))
      .map((item) => item.data.name);
    batchShow({ pieceName, actionNames, triggerNames });
    setSelectedKeys(new Set());
  };

  const hasSelection = selectedKeys.size > 0;

  return (
    <>
      <SheetHeader className="px-6 py-4 border-b shrink-0">
        <SheetTitle className="text-base">{t('Manage visibility')}</SheetTitle>
        <SheetDescription>
          {pieceSet
            ? t(
                'Select which actions and triggers to include in this piece set for',
              )
            : t(
                'Control which actions and triggers are available in the flow builder for',
              )}{' '}
          <span className="font-medium text-foreground">
            {pieceDisplayName}
          </span>
        </SheetDescription>
      </SheetHeader>

      <div className="px-4 pt-3 flex flex-col gap-2 shrink-0">
        <Input
          placeholder={t('Search actions & triggers...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
            <Checkbox
              checked={
                allVisibleSelected ||
                (someVisibleSelected ? 'indeterminate' : false)
              }
              onCheckedChange={toggleSelectAll}
              disabled={allVisibleItems.length === 0}
            />
            {t('Select all')}
          </label>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            disabled={!hasSelection || isLoading}
            onClick={handleHideSelected}
          >
            <EyeOff className="size-4" />
            {t('Hide selected')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasSelection || isLoading}
            onClick={handleShowSelected}
          >
            <Eye className="size-4" />
            {t('Show selected')}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : allVisibleItems.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {t('No results found')}
          </div>
        ) : (
          <div>
            {filteredActions.length > 0 && (
              <ComponentGroup
                label={t('Actions')}
                items={filteredActions}
                totalCount={allActions.length}
                visibleCount={visibleActionCount}
                expanded={actionsExpanded}
                onExpandedChange={setActionsExpanded}
                selectedKeys={selectedKeys}
                hiddenNames={localHiddenActions}
                onToggleGroupSelection={toggleGroupSelection}
                onToggleItemSelection={toggleItemSelection}
                chevronAtEnd={true}
                onToggleComponentVisibility={(componentName) =>
                  toggleComponent({
                    pieceName,
                    componentName,
                    isAction: true,
                  })
                }
              />
            )}
            {filteredTriggers.length > 0 && (
              <ComponentGroup
                label={t('Triggers')}
                items={filteredTriggers}
                totalCount={allTriggers.length}
                visibleCount={visibleTriggerCount}
                expanded={triggersExpanded}
                onExpandedChange={setTriggersExpanded}
                selectedKeys={selectedKeys}
                hiddenNames={localHiddenTriggers}
                onToggleGroupSelection={toggleGroupSelection}
                onToggleItemSelection={toggleItemSelection}
                chevronAtEnd={true}
                onToggleComponentVisibility={(componentName) =>
                  toggleComponent({
                    pieceName,
                    componentName,
                    isAction: false,
                  })
                }
              />
            )}
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isMutating}
        >
          {t('Cancel')}
        </Button>
        <Button disabled={!isDirty || isMutating} onClick={handleSave}>
          {isMutating && <Loader2 className="size-4 animate-spin" />}
          {t('Save changes')}
        </Button>
      </div>
    </>
  );
}

type ComponentGroupProps = {
  label: string;
  items: ComponentItem[];
  totalCount: number;
  visibleCount: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  selectedKeys: Set<ItemKey>;
  hiddenNames: string[];
  onToggleGroupSelection: (items: ComponentItem[]) => void;
  onToggleItemSelection: (item: ComponentItem) => void;
  onToggleComponentVisibility: (componentName: string) => void;
  chevronAtEnd?: boolean;
};

function ComponentGroup({
  label,
  items,
  totalCount,
  visibleCount,
  expanded,
  onExpandedChange,
  selectedKeys,
  hiddenNames,
  onToggleGroupSelection,
  onToggleItemSelection,
  onToggleComponentVisibility,
  chevronAtEnd = false,
}: ComponentGroupProps) {
  const allGroupSelected =
    items.length > 0 && items.every((item) => selectedKeys.has(makeKey(item)));
  const someGroupSelected =
    !allGroupSelected && items.some((item) => selectedKeys.has(makeKey(item)));

  const chevron = expanded ? (
    <ChevronDown
      className={cn(
        'size-4 text-muted-foreground shrink-0',
        chevronAtEnd && 'ml-auto',
      )}
    />
  ) : (
    <ChevronRight
      className={cn(
        'size-4 text-muted-foreground shrink-0',
        chevronAtEnd && 'ml-auto',
      )}
    />
  );

  const groupCheckbox = (
    <Checkbox
      checked={
        allGroupSelected || (someGroupSelected ? 'indeterminate' : false)
      }
      onCheckedChange={() => onToggleGroupSelection(items)}
    />
  );

  return (
    <Collapsible open={expanded} onOpenChange={onExpandedChange}>
      <div className="flex items-center gap-2 px-4 py-2 hover:bg-muted/30 transition-colors bg-muted/50 border-t border-b border-border">
        {chevronAtEnd && groupCheckbox}
        <CollapsibleTrigger className="flex items-center gap-2 flex-1 min-w-0">
          {!chevronAtEnd && chevron}
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <Badge variant="inverted" className="text-xs shrink-0 font-bold">
            {visibleCount}/{totalCount}
          </Badge>
          {chevronAtEnd && chevron}
        </CollapsibleTrigger>
        {!chevronAtEnd && groupCheckbox}
      </div>

      <CollapsibleContent>
        <div className="divide-y">
          {items.map((item) => {
            const isHidden = hiddenNames.includes(item.data.name);
            const isSelected = selectedKeys.has(makeKey(item));

            return (
              <div
                key={makeKey(item)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors',
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleItemSelection(item)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {item.data.displayName}
                    </span>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs capitalize"
                    >
                      {item.type}
                    </Badge>
                  </div>
                  {item.data.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {item.data.description}
                    </p>
                  )}
                </div>
                <Switch
                  checked={!isHidden}
                  onCheckedChange={() =>
                    onToggleComponentVisibility(item.data.name)
                  }
                />
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
