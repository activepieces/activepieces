import { unique } from '@activepieces/core-utils';
import {
  isPieceVisible,
  PieceSet,
  RequiredActionsMode,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeft, Check, ChevronDown, Info, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { SaveBar } from '@/app/components/admin';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { SearchInput } from '@/components/custom/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ChangePieceSet,
  pieceSetChanges,
  pieceSetTerms,
} from '@/features/piece-sets';
import { PieceIcon, piecesHooks } from '@/features/pieces';
import { AdminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { PolicySheet, SkeletonRows, useGuardedClose } from './policy-ui';
import {
  RequiredActionGroup,
  useRequiredActionsGroupedByPiece,
} from './use-required-actions-grouped-by-piece';

export function PublishingRuleSentence({
  count,
  mode,
  onModeChange,
}: {
  count: number;
  mode: RequiredActionsMode;
  onModeChange?: (mode: RequiredActionsMode) => void;
}) {
  if (count === 0) {
    return (
      <p className="text-sm text-gray-11">
        {t('Flows can be published without using any particular action.')}
      </p>
    );
  }
  if (count === 1) {
    return (
      <p className="text-sm text-gray-12">
        {t('A flow can be published only if it uses this action:')}
      </p>
    );
  }
  const label = mode === RequiredActionsMode.ALL ? t('all') : t('at least one');
  return (
    <p className="text-sm leading-6 text-gray-12">
      {t('A flow can be published only if it uses')}{' '}
      {onModeChange ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-0.5 rounded-md bg-accent-3 px-1.5 font-medium text-accent-11 outline-hidden hover:bg-accent-4 focus-visible:ring-2 focus-visible:ring-gray-8"
            >
              {label}
              <ChevronDown className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            {MODES.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => onModeChange(option.value)}
                className="items-start"
              >
                <Check
                  className={cn('mt-0.5', option.value !== mode && 'opacity-0')}
                />
                <span className="flex flex-col">
                  <span className="font-medium">{option.label()}</span>
                  <span className="text-xs text-gray-11">{option.hint()}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="font-medium">{label}</span>
      )}{' '}
      {t('of these actions:')}
    </p>
  );
}

export function RequiredActionsList({
  pieceSet,
  onChange,
}: {
  pieceSet: PieceSet;
  onChange: ChangePieceSet;
}) {
  const { requiredActionsGroupedByPiece, isLoading } =
    useRequiredActionsGroupedByPiece({
      actions: pieceSet.config.requiredActions.actions,
    });
  if (isLoading) {
    return <SkeletonRows count={2} className="h-8 rounded-lg" />;
  }
  if (requiredActionsGroupedByPiece.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      {requiredActionsGroupedByPiece.map((group) => (
        <RequiredActionGroupRows
          key={group.pieceName}
          group={group}
          onRemoveStale={(staleNames) =>
            onChange({
              type: 'required',
              actions: {
                [group.pieceName]: group.actions
                  .map((action) => action.name)
                  .filter((name) => !staleNames.includes(name)),
              },
            }).catch(() => undefined)
          }
        />
      ))}
    </div>
  );
}

function RequiredActionGroupRows({
  group,
  onRemoveStale,
  onRemove,
  onRemoveAll,
}: {
  group: RequiredActionGroup;
  onRemoveStale: (actionNames: string[]) => void;
  onRemove?: (actionName: string) => void;
  onRemoveAll?: () => void;
}) {
  const staleNames = group.actions
    .filter((action) => action.notInLatestPieceVersion)
    .map((action) => action.name);
  return (
    <div className="flex flex-col">
      <div className="flex min-h-9 items-center gap-2.5">
        <PieceIcon
          size="xs"
          border
          displayName={group.displayName}
          logoUrl={group.logoUrl}
          showTooltip={false}
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-12">
          {group.displayName}
        </span>
        {onRemoveAll && (
          <Button
            variant="ghost"
            size="sm"
            className="text-danger-11 hover:text-danger-11"
            onClick={onRemoveAll}
          >
            <Trash2 />
            {t('Remove all')}
          </Button>
        )}
      </div>
      <ul className="flex flex-col">
        {group.actions.map((action) => (
          <li
            key={action.name}
            className="flex min-h-8 min-w-0 items-center gap-2 pl-8 text-sm"
          >
            <span
              className={cn(
                'min-w-0 flex-1 truncate',
                action.notInLatestPieceVersion
                  ? 'text-gray-11 line-through'
                  : 'text-gray-12',
              )}
            >
              {action.displayName}
            </span>
            {onRemove && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('Remove {name}', { name: action.displayName })}
                onClick={() => onRemove(action.name)}
              >
                <X />
              </Button>
            )}
          </li>
        ))}
      </ul>
      {staleNames.length > 0 && (
        <div className="mt-1 flex items-start gap-2 rounded-xl bg-gray-3 px-3 py-2 text-xs text-gray-11">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span className="flex-1">
            {t('actionsNotInLatestPieceVersion', {
              count: staleNames.length,
              pieceName: group.displayName,
            })}
          </span>
          <button
            type="button"
            className="shrink-0 rounded-md font-medium text-gray-12 underline outline-hidden focus-visible:ring-2 focus-visible:ring-gray-8"
            onClick={() => onRemoveStale(staleNames)}
          >
            {t('Remove')}
          </button>
        </div>
      )}
    </div>
  );
}

export function RequiredActionsSheet({
  pieceSet,
  open,
  onOpenChange,
  onChange,
}: {
  pieceSet: PieceSet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: ChangePieceSet;
}) {
  return open ? (
    <RequiredActionsEditor
      key={pieceSet.id}
      pieceSet={pieceSet}
      onChange={onChange}
      onClose={() => onOpenChange(false)}
    />
  ) : null;
}

function RequiredActionsEditor({
  pieceSet,
  onChange,
  onClose,
}: {
  pieceSet: PieceSet;
  onChange: ChangePieceSet;
  onClose: () => void;
}) {
  const savedRequired = pieceSet.config.requiredActions.actions;
  const savedMode = pieceSet.config.requiredActions.mode;
  const [required, setRequired] =
    useState<Record<string, string[]>>(savedRequired);
  const [mode, setMode] = useState<RequiredActionsMode>(savedMode);
  const [pickingPiece, setPickingPiece] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const changedPieces = changedRequiredPieces({
    saved: savedRequired,
    local: required,
  });
  const dirty = mode !== savedMode || Object.keys(changedPieces).length > 0;
  const { requestClose, dialog: leaveDialog } = useGuardedClose({
    dirty: dirty && !saving,
    onClose,
  });
  const { requiredActionsGroupedByPiece, isLoading: groupsLoading } =
    useRequiredActionsGroupedByPiece({ actions: required });
  const requiredCount = Object.values(required).flat().length;

  const setPieceActions = ({
    pieceName,
    actionNames,
  }: {
    pieceName: string;
    actionNames: string[];
  }) =>
    setRequired((current) => {
      const { [pieceName]: _replaced, ...rest } = current;
      return actionNames.length === 0
        ? rest
        : { ...rest, [pieceName]: actionNames };
    });

  const discard = () => {
    setRequired(savedRequired);
    setMode(savedMode);
  };

  const save = async () => {
    if (!dirty || saving) {
      return;
    }
    setSaving(true);
    const saved = await onChange({
      type: 'required',
      actions: changedPieces,
      mode: mode === savedMode ? undefined : mode,
    });
    setSaving(false);
    if (saved) {
      onClose();
    }
  };

  return (
    <>
      <PolicySheet
        open
        onRequestClose={requestClose}
        title={t('Publishing rule')}
        description={t(
          'Actions every flow on this {term} must use before it can be published.',
          pieceSetTerms.get(),
        )}
        footer={
          dirty && (
            <SaveBar
              dirty={dirty}
              saving={saving}
              onSave={() => {
                save().catch(() => undefined);
              }}
              onDiscard={discard}
              saveControl={AdminControl.PIECE_SETS_REQUIRED_SUBMIT}
            />
          )
        }
      >
        <PublishingRuleSentence
          count={requiredCount}
          mode={mode}
          onModeChange={setMode}
        />
        {groupsLoading ? (
          <SkeletonRows count={2} className="h-10 rounded-xl" />
        ) : (
          requiredActionsGroupedByPiece.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border px-3 py-2">
              {requiredActionsGroupedByPiece.map((group) => (
                <RequiredActionGroupRows
                  key={group.pieceName}
                  group={group}
                  onRemove={(actionName) =>
                    setPieceActions({
                      pieceName: group.pieceName,
                      actionNames: (required[group.pieceName] ?? []).filter(
                        (name) => name !== actionName,
                      ),
                    })
                  }
                  onRemoveAll={() =>
                    setPieceActions({
                      pieceName: group.pieceName,
                      actionNames: [],
                    })
                  }
                  onRemoveStale={(staleNames) =>
                    setPieceActions({
                      pieceName: group.pieceName,
                      actionNames: (required[group.pieceName] ?? []).filter(
                        (name) => !staleNames.includes(name),
                      ),
                    })
                  }
                />
              ))}
            </div>
          )
        )}
        <section className="flex flex-col gap-3 border-t pt-5">
          <h3 className="text-sm font-medium text-gray-12">
            {t('Add an action')}
          </h3>
          {pickingPiece === null ? (
            <PiecePicker pieceSet={pieceSet} onPick={setPickingPiece} />
          ) : (
            <ActionPicker
              pieceSet={pieceSet}
              pieceName={pickingPiece}
              requiredNames={required[pickingPiece] ?? []}
              onChange={(actionNames) =>
                setPieceActions({ pieceName: pickingPiece, actionNames })
              }
              onBack={() => setPickingPiece(null)}
            />
          )}
        </section>
      </PolicySheet>
      {leaveDialog}
    </>
  );
}

function PiecePicker({
  pieceSet,
  onPick,
}: {
  pieceSet: PieceSet;
  onPick: (pieceName: string) => void;
}) {
  const [search, setSearch] = useState('');
  const { pieces, isLoading, isError, refetch } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
  });
  const query = search.trim().toLowerCase();
  const matches = (pieces ?? [])
    .filter(
      (piece) =>
        piece.actions > 0 &&
        isPieceVisible({ pieces: pieceSet.config.pieces, name: piece.name }) &&
        (query === '' || piece.displayName.toLowerCase().includes(query)),
    )
    .slice(0, MAX_PIECES_SHOWN);
  return (
    <>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={t('Search allowed pieces')}
      />
      {isLoading ? (
        <SkeletonRows count={5} className="h-10 rounded-xl" />
      ) : isError ? (
        <DataFetchErrorState entity={t('pieces')} onRetry={refetch} />
      ) : matches.length === 0 ? (
        <p className="text-sm text-gray-11">
          {t('No allowed piece matches. Allow a piece first to require it.')}
        </p>
      ) : (
        <ul className="flex flex-col rounded-xl border">
          {matches.map((piece) => (
            <li key={piece.name} className="border-t first:border-t-0">
              <button
                type="button"
                onClick={() => onPick(piece.name)}
                className="flex h-11 w-full min-w-0 items-center gap-2.5 px-3 text-left text-sm outline-hidden hover:bg-gray-2 focus-visible:bg-gray-2"
              >
                <PieceIcon
                  size="xs"
                  border
                  displayName={piece.displayName}
                  logoUrl={piece.logoUrl}
                  showTooltip={false}
                />
                <span className="min-w-0 flex-1 truncate font-medium text-gray-12">
                  {piece.displayName}
                </span>
                <span className="text-xs text-gray-11 tabular-nums">
                  {t('{count, plural, =1 {1 action} other {# actions}}', {
                    count: piece.actions,
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function ActionPicker({
  pieceSet,
  pieceName,
  requiredNames,
  onChange,
  onBack,
}: {
  pieceSet: PieceSet;
  pieceName: string;
  requiredNames: string[];
  onChange: (actionNames: string[]) => void;
  onBack: () => void;
}) {
  const { pieceModel, isLoading, isError, refetch } = piecesHooks.usePiece({
    name: pieceName,
  });
  const actions = pieceModel ? Object.values(pieceModel.actions) : [];
  const actionNames = actions.map((action) => action.name);
  const checkedCount = actionNames.filter((name) =>
    requiredNames.includes(name),
  ).length;
  const isAllowed = (actionName: string) =>
    pieceSetChanges.isActionAllowed({ pieceSet, pieceName, actionName });
  const toggle = (actionName: string) =>
    onChange(
      requiredNames.includes(actionName)
        ? requiredNames.filter((name) => name !== actionName)
        : [...requiredNames, actionName],
    );
  const toggleAll = () =>
    onChange(
      checkedCount === actionNames.length
        ? requiredNames.filter((name) => !actionNames.includes(name))
        : unique([...requiredNames, ...actionNames]),
    );
  return (
    <>
      <Button variant="ghost" size="sm" className="self-start" onClick={onBack}>
        <ArrowLeft />
        {pieceModel?.displayName ?? t('Pieces')}
      </Button>
      {isLoading ? (
        <SkeletonRows count={5} className="h-10 rounded-xl" />
      ) : isError ? (
        <DataFetchErrorState entity={t('actions')} onRetry={refetch} />
      ) : actions.length === 0 ? (
        <p className="text-sm text-gray-11">
          {t('This piece has no actions.')}
        </p>
      ) : (
        <div className="flex flex-col rounded-xl border">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b px-3">
            <Checkbox
              checked={
                checkedCount === 0
                  ? false
                  : checkedCount === actionNames.length
                  ? true
                  : 'indeterminate'
              }
              onCheckedChange={toggleAll}
            />
            <span className="flex-1 text-sm font-medium text-gray-12">
              {t('Select all')}
            </span>
            <span className="text-xs text-gray-11 tabular-nums">
              {t('{count} of {total} selected', {
                count: checkedCount,
                total: actionNames.length,
              })}
            </span>
          </label>
          <ul className="flex flex-col">
            {actions.map((action) => (
              <li key={action.name} className="border-t first:border-t-0">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2">
                  <Checkbox
                    checked={requiredNames.includes(action.name)}
                    onCheckedChange={() => toggle(action.name)}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm text-gray-12">
                      {action.displayName}
                    </span>
                    {action.description && (
                      <span className="truncate text-xs text-gray-11">
                        {action.description}
                      </span>
                    )}
                  </span>
                  {!isAllowed(action.name) && (
                    <Badge variant="outline" className="shrink-0">
                      {t('Not allowed yet')}
                    </Badge>
                  )}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
      {requiredNames.some((name) => !isAllowed(name)) && (
        <p className="text-xs text-gray-11">
          {t(
            'Actions this {term} does not allow yet are allowed when you make them required.',
            pieceSetTerms.get(),
          )}
        </p>
      )}
    </>
  );
}

function changedRequiredPieces({
  saved,
  local,
}: {
  saved: Record<string, string[]>;
  local: Record<string, string[]>;
}): Record<string, string[]> {
  return Object.fromEntries(
    unique([...Object.keys(saved), ...Object.keys(local)])
      .filter(
        (pieceName) =>
          sortedKey(saved[pieceName] ?? []) !==
          sortedKey(local[pieceName] ?? []),
      )
      .map((pieceName) => [pieceName, local[pieceName] ?? []]),
  );
}

function sortedKey(names: string[]): string {
  return [...names].sort().join('|');
}

const MAX_PIECES_SHOWN = 40;

const MODES: {
  value: RequiredActionsMode;
  label: () => string;
  hint: () => string;
}[] = [
  {
    value: RequiredActionsMode.ALL,
    label: () => t('All of these actions'),
    hint: () => t('Every action below has to be in the flow.'),
  },
  {
    value: RequiredActionsMode.ANY,
    label: () => t('At least one of these actions'),
    hint: () => t('Any one of the actions below is enough.'),
  },
];
