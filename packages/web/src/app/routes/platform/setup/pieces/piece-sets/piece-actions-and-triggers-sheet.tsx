import { unique } from '@activepieces/core-utils';
import {
  ActionBase,
  ActionClassification,
  TriggerBase,
} from '@activepieces/pieces-framework';
import { PieceSet } from '@activepieces/shared';
import { t } from 'i18next';
import { useMemo, useState } from 'react';

import { AdminFetchErrorState, SaveBar } from '@/app/components/admin';
import { SearchInput } from '@/components/custom/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

  const originallyEverything = !(
    pieceName in pieceSet.config.selectedActions ||
    pieceName in pieceSet.config.selectedTriggers
  );
  const originalHiddenActions = hiddenNames({
    everything: originallyEverything,
    allNames: allActionNames,
    selected: pieceSet.config.selectedActions[pieceName],
  });
  const originalHiddenTriggers = hiddenNames({
    everything: originallyEverything,
    allNames: allTriggerNames,
    selected: pieceSet.config.selectedTriggers[pieceName],
  });

  const [search, setSearch] = useState('');
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

  const checkedActionCount = allActionNames.filter(
    (name) => !localHiddenActions.includes(name),
  ).length;
  const checkedTriggerCount = allTriggerNames.filter(
    (name) => !localHiddenTriggers.includes(name),
  ).length;
  const totalCount = allActions.length + allTriggers.length;
  const allChecked =
    localHiddenActions.length === 0 && localHiddenTriggers.length === 0;
  const noneChecked =
    totalCount > 0 && checkedActionCount + checkedTriggerCount === 0;

  const hiddenChanged =
    !sameNames(localHiddenActions, originalHiddenActions) ||
    !sameNames(localHiddenTriggers, originalHiddenTriggers);
  const isDirty = hiddenChanged;
  const buildersSeeEverything =
    allChecked && (originallyEverything || hiddenChanged);

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

  const toggleGroup = ({
    type,
    check,
  }: {
    type: ComponentItem['type'];
    check: boolean;
  }) => {
    if (type === 'action') {
      setTouchedHiddenActions(
        check
          ? []
          : allActionNames.filter(
              (name) => !requiredActionNames.includes(name),
            ),
      );
    } else {
      setTouchedHiddenTriggers(check ? [] : allTriggerNames);
    }
  };

  const actionNamesWith = (classifications: ActionClassification[]) =>
    allActions
      .filter(
        (item) =>
          item.data.classification !== undefined &&
          classifications.includes(item.data.classification) &&
          !requiredActionNames.includes(item.data.name),
      )
      .map((item) => item.data.name);
  const destructiveNames = actionNamesWith(['DESTRUCTIVE']);
  const writeOrDestructiveNames = actionNamesWith(['WRITE', 'DESTRUCTIVE']);
  const hide = (names: string[]) =>
    setTouchedHiddenActions(unique([...localHiddenActions, ...names]));

  const close = () => onOpenChange(false);
  const { requestClose, dialog: leaveDialog } = useGuardedClose({
    dirty: isDirty && !saving,
    onClose: close,
  });

  const discard = () => {
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

  const hideWholePiece = () => {
    saveChange({
      type: 'visibility',
      label: pieceDisplayName,
      visible: { [pieceName]: false },
    }).catch(() => undefined);
  };

  const handleSave = () => {
    if (!isDirty || saving || !pieceModel) {
      return;
    }
    const change: PieceSetChange = {
      type: 'components',
      pieceName,
      pieceDisplayName,
      actions: allChecked
        ? { mode: 'all' }
        : {
            mode: 'selected',
            selected: allActionNames.filter(
              (name) => !localHiddenActions.includes(name),
            ),
          },
      triggers: allChecked
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

  const query = search.trim().toLowerCase();
  const matches = (item: ComponentItem) =>
    query.length === 0 ||
    item.data.displayName.toLowerCase().includes(query) ||
    (item.data.description ?? '').toLowerCase().includes(query);

  return (
    <>
      <PolicySheet
        open
        onRequestClose={requestClose}
        title={t('Actions and triggers for {name}', {
          name: pieceDisplayName,
        })}
        description={
          pieceModel
            ? buildersSeeSummary({
                pieceDisplayName,
                everything: buildersSeeEverything,
                checkedActions: checkedActionCount,
                totalActions: allActions.length,
                checkedTriggers: checkedTriggerCount,
                totalTriggers: allTriggers.length,
              })
            : undefined
        }
        toolbar={
          totalCount > 0 ? (
            <>
              <SearchInput
                placeholder={t('Search actions and triggers')}
                value={search}
                onChange={setSearch}
              />
              {writeOrDestructiveNames.length > 0 && (
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
            </>
          ) : undefined
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
            {noneChecked && (
              <p className="text-sm text-gray-11">
                {t("Builders won't see this piece's actions or triggers.")}{' '}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0"
                  disabled={saving}
                  onClick={hideWholePiece}
                >
                  {t('Hide the whole piece instead')}
                </Button>
              </p>
            )}
            {allActions.length > 0 && (
              <ComponentGroup
                label={t('Actions')}
                items={allActions.filter(matches)}
                total={allActions.length}
                checkedCount={checkedActionCount}
                hiddenNames={localHiddenActions}
                requiredNames={requiredActionNames}
                onToggle={toggleComponent}
                onToggleGroup={(check) =>
                  toggleGroup({ type: 'action', check })
                }
              />
            )}
            {allTriggers.length > 0 && (
              <ComponentGroup
                label={t('Triggers')}
                items={allTriggers.filter(matches)}
                total={allTriggers.length}
                checkedCount={checkedTriggerCount}
                hiddenNames={localHiddenTriggers}
                requiredNames={[]}
                onToggle={toggleComponent}
                onToggleGroup={(check) =>
                  toggleGroup({ type: 'trigger', check })
                }
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

function ComponentGroup({
  label,
  items,
  total,
  checkedCount,
  hiddenNames,
  requiredNames,
  onToggle,
  onToggleGroup,
}: ComponentGroupProps) {
  const groupState: boolean | 'indeterminate' =
    checkedCount === 0
      ? false
      : checkedCount === total
      ? true
      : 'indeterminate';

  return (
    <section className="flex flex-col">
      <label className="flex cursor-pointer items-center gap-3 border-b border-gray-6 pb-3">
        <Checkbox
          checked={groupState}
          onCheckedChange={() => onToggleGroup(checkedCount !== total)}
        />
        <span className="text-sm font-medium text-gray-12">
          {t('{label} ({checked}/{total})', {
            label,
            checked: checkedCount,
            total,
          })}
        </span>
      </label>
      {items.length === 0 ? (
        <p className="py-3 text-sm text-gray-11">{t('No matches.')}</p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-6">
          {items.map((item) => (
            <ComponentRow
              key={`${item.type}:${item.data.name}`}
              item={item}
              checked={!hiddenNames.includes(item.data.name)}
              required={requiredNames.includes(item.data.name)}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ComponentRow({
  item,
  checked,
  required,
  onToggle,
}: ComponentRowProps) {
  const checkbox = (
    <Checkbox
      checked={required || checked}
      disabled={required}
      onCheckedChange={() => onToggle(item)}
    />
  );
  return (
    <label
      className={cn(
        'flex items-start gap-3 py-3',
        !required && 'cursor-pointer',
      )}
    >
      <span className="flex h-5 items-center">
        {required ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="flex">
                {checkbox}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {t(
                "Required actions can't be hidden. Remove it from Required actions first.",
              )}
            </TooltipContent>
          </Tooltip>
        ) : (
          checkbox
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm text-gray-12">
          {item.data.displayName}
        </span>
        {item.data.description && (
          <p className="text-xs text-gray-11">{item.data.description}</p>
        )}
      </div>
      {item.data.classification !== undefined && (
        <Badge
          variant={CLASSIFICATION_VARIANT[item.data.classification]}
          className="shrink-0"
        >
          {ACTION_CLASSIFICATION_BADGES[item.data.classification].label()}
        </Badge>
      )}
      {required && (
        <Badge variant="outline" className="shrink-0">
          {t('Required')}
        </Badge>
      )}
    </label>
  );
}

function buildersSeeSummary({
  pieceDisplayName,
  everything,
  checkedActions,
  totalActions,
  checkedTriggers,
  totalTriggers,
}: {
  pieceDisplayName: string;
  everything: boolean;
  checkedActions: number;
  totalActions: number;
  checkedTriggers: number;
  totalTriggers: number;
}): string {
  if (everything) {
    return t(
      'Builders see every action and trigger in {name}, including new ones added later.',
      { name: pieceDisplayName },
    );
  }
  const later = t(
    'New ones added to {name} later stay hidden until you check them here.',
    { name: pieceDisplayName },
  );
  if (totalTriggers === 0) {
    return `${t('Builders see {checked} of {total} actions.', {
      checked: checkedActions,
      total: totalActions,
    })} ${later}`;
  }
  if (totalActions === 0) {
    return `${t('Builders see {checked} of {total} triggers.', {
      checked: checkedTriggers,
      total: totalTriggers,
    })} ${later}`;
  }
  return `${t(
    'Builders see {actions} of {actionsTotal} actions and {triggers} of {triggersTotal} triggers.',
    {
      actions: checkedActions,
      actionsTotal: totalActions,
      triggers: checkedTriggers,
      triggersTotal: totalTriggers,
    },
  )} ${later}`;
}

function hiddenNames({
  everything,
  allNames,
  selected,
}: {
  everything: boolean;
  allNames: string[];
  selected: string[] | undefined;
}): string[] {
  if (everything || selected === undefined) {
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

type ComponentGroupProps = {
  label: string;
  items: ComponentItem[];
  total: number;
  checkedCount: number;
  hiddenNames: string[];
  requiredNames: string[];
  onToggle: (item: ComponentItem) => void;
  onToggleGroup: (check: boolean) => void;
};

type ComponentRowProps = {
  item: ComponentItem;
  checked: boolean;
  required: boolean;
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
