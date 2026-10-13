import { unique } from '@activepieces/core-utils';
import {
  isPieceVisible,
  PieceSet,
  RequiredActionsMode,
} from '@activepieces/shared';
import { t } from 'i18next';
import { ArrowLeft, Check, ChevronDown, Info, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AdminFetchErrorState, SaveBar } from '@/app/components/admin';
import { LogoPlate } from '@/components/custom/logo-plate';
import { SearchInput } from '@/components/custom/search-input';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VirtualizedScrollArea } from '@/components/ui/virtualized-scroll-area';
import {
  ChangePieceSet,
  pieceSetChanges,
  pieceSetTerms,
} from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { AdminControl } from '@/lib/admin-control';
import { listUtils } from '@/lib/list-utils';
import { cn } from '@/lib/utils';

import {
  PolicySheet,
  SkeletonRows,
  sameNames,
  useGuardedClose,
} from './policy-ui';
import {
  RequiredActionGroup,
  useRequiredActionsGroupedByPiece,
} from './use-required-actions-grouped-by-piece';

export function PublishingRuleSentence({
  count,
  mode,
  onChange,
}: {
  count: number;
  mode: RequiredActionsMode;
  onChange?: ChangePieceSet;
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
  const options = publishingModes();
  const current = options.find((option) => option.value === mode) ?? options[0];
  const { before, marked, after } = splitMarked(current.sentence);
  return (
    <p className="text-sm leading-7 text-gray-12">
      {before}
      {onChange ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t('Publishing rule: {rule}', { rule: marked })}
              className="mx-0.5 inline-flex h-6 cursor-pointer items-center gap-0.5 rounded-md border border-accent-6 bg-accent-2 px-1.5 align-baseline font-medium text-accent-11 transition-colors hover:border-accent-8 hover:bg-accent-3 focus-visible:outline-2 focus-visible:outline-accent-8"
            >
              {marked}
              <ChevronDown className="size-3.5 text-accent-11" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72">
            {options.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => {
                  if (option.value !== mode) {
                    onChange({
                      type: 'requiredMode',
                      mode: option.value,
                    }).catch(() => undefined);
                  }
                }}
                className="items-start"
              >
                <Check
                  className={cn('mt-0.5', option.value !== mode && 'opacity-0')}
                />
                <span className="flex flex-col">
                  <span className="font-medium">
                    {splitMarked(option.sentence).marked}
                  </span>
                  <span className="text-xs text-gray-11">{option.hint}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="font-medium">{marked}</span>
      )}
      {after}
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
  const [expanded, setExpanded] = useState(false);
  const staleNames = group.actions
    .filter((action) => action.notInLatestPieceVersion)
    .map((action) => action.name);
  const { visible, hiddenCount } = listUtils.cap({
    items: group.actions,
    limit: REQUIRED_ACTIONS_SHOWN,
    expanded,
  });
  return (
    <div className="flex flex-col">
      <div className="flex min-h-9 items-center gap-2.5">
        <LogoPlate src={group.logoUrl} alt="" size="xs" border />
        <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
          <span className="truncate text-sm font-medium text-gray-12">
            {group.displayName}
          </span>
          <span className="shrink-0 text-xs text-gray-11 tabular-nums">
            {t('· {count, plural, =1 {1 action} other {# actions}}', {
              count: group.actions.length,
            })}
          </span>
        </span>
        {onRemoveAll && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-11"
            onClick={onRemoveAll}
          >
            <Trash2 />
            {t('Remove all')}
          </Button>
        )}
      </div>
      <ul className="flex flex-col">
        {visible.map((action) => (
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
      {hiddenCount > 0 && (
        <Button
          variant="link"
          size="sm"
          className="h-8 self-start pl-8 text-xs"
          onClick={() => setExpanded(true)}
        >
          {t('Show all {count}', { count: group.actions.length })}
        </Button>
      )}
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
  const mode = pieceSet.config.requiredActions.mode;
  const [required, setRequired] =
    useState<Record<string, string[]>>(savedRequired);
  const [pickingPiece, setPickingPiece] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const changedPieces = changedRequiredPieces({
    saved: savedRequired,
    local: required,
  });
  const dirty = Object.keys(changedPieces).length > 0;
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
  };

  const save = async () => {
    if (!dirty || saving) {
      return;
    }
    setSaving(true);
    const saved = await onChange({
      type: 'required',
      actions: changedPieces,
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
          <SaveBar
            dirty={dirty}
            saving={saving}
            onSave={() => {
              save().catch(() => undefined);
            }}
            onDiscard={discard}
            saveControl={AdminControl.PIECE_SETS_REQUIRED_SUBMIT}
          />
        }
      >
        <section className="flex flex-col gap-3 border-b pb-5">
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
        <PublishingRuleSentence
          count={requiredCount}
          mode={mode}
          onChange={onChange}
        />
        {groupsLoading && requiredActionsGroupedByPiece.length === 0 ? (
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
      </PolicySheet>
      {leaveDialog}
    </>
  );
}

export function PiecePicker({
  pieceSet,
  onPick,
}: {
  pieceSet?: PieceSet;
  onPick: (pieceName: string) => void;
}) {
  const [search, setSearch] = useState('');
  const { pieces, isLoading, isError, refetch } =
    piecesHooks.usePlatformCatalog();
  const query = search.trim().toLowerCase();
  const matches = useMemo(
    () =>
      (pieces ?? []).filter(
        (piece) =>
          piece.actions > 0 &&
          (pieceSet === undefined ||
            isPieceVisible({
              pieces: pieceSet.config.pieces,
              name: piece.name,
            })) &&
          (query === '' || piece.displayName.toLowerCase().includes(query)),
      ),
    [pieces, pieceSet, query],
  );
  const body = (() => {
    if (isError && pieces === undefined) {
      return <AdminFetchErrorState entity={t('pieces')} onRetry={refetch} />;
    }
    if (isLoading) {
      return <SkeletonRows count={5} className="h-11 rounded-xl" />;
    }
    if (matches.length === 0) {
      return (
        <p className="text-sm text-gray-11">
          {pieceSet === undefined
            ? t('No piece with actions matches.')
            : t('No shown piece matches. Show a piece first to require it.')}
        </p>
      );
    }
    return (
      <div
        className="rounded-xl border p-1"
        style={{
          height: listUtils.cappedHeight({
            count: matches.length,
            rowHeight: PICKER_ROW_HEIGHT,
            padding: LIST_PADDING,
            max: PIECE_LIST_MAX_HEIGHT,
          }),
        }}
      >
        <VirtualizedScrollArea
          items={matches}
          estimateSize={() => PICKER_ROW_HEIGHT}
          getItemKey={(index) => matches[index].name}
          renderItem={(piece) => (
            <button
              type="button"
              onClick={() => onPick(piece.name)}
              className="flex h-11 w-full min-w-0 items-center gap-2.5 rounded-md px-2 text-left text-sm hover:bg-gray-3 focus-visible:outline-2 focus-visible:outline-accent-8"
            >
              <LogoPlate src={piece.logoUrl} alt="" size="xs" border />
              <span className="min-w-0 flex-1 truncate font-medium text-gray-12">
                {piece.displayName}
              </span>
              <span className="text-xs text-gray-11 tabular-nums">
                {t('{count, plural, =1 {1 action} other {# actions}}', {
                  count: piece.actions,
                })}
              </span>
            </button>
          )}
        />
      </div>
    );
  })();
  return (
    <>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={
          pieceSet === undefined ? t('Search pieces') : t('Search shown pieces')
        }
      />
      {body}
    </>
  );
}

export function ActionPicker({
  pieceSet,
  pieceName,
  requiredNames,
  onChange,
  onBack,
}: {
  pieceSet?: PieceSet;
  pieceName: string;
  requiredNames: string[];
  onChange: (actionNames: string[]) => void;
  onBack: () => void;
}) {
  const { pieceModel, isLoading, isError, refetch } = piecesHooks.usePiece({
    name: pieceName,
  });
  const [search, setSearch] = useState('');
  const actions = pieceModel ? Object.values(pieceModel.actions) : [];
  const actionNames = actions.map((action) => action.name);
  const checkedCount = actionNames.filter((name) =>
    requiredNames.includes(name),
  ).length;
  const query = search.trim().toLowerCase();
  const matches = actions.filter(
    (action) =>
      query === '' ||
      action.displayName.toLowerCase().includes(query) ||
      (action.description ?? '').toLowerCase().includes(query),
  );
  const matchNames = matches.map((action) => action.name);
  const checkedMatchCount = matchNames.filter((name) =>
    requiredNames.includes(name),
  ).length;
  const isAllowed = (actionName: string) =>
    pieceSet === undefined ||
    pieceSetChanges.isActionAllowed({ pieceSet, pieceName, actionName });
  const toggle = (actionName: string) =>
    onChange(
      requiredNames.includes(actionName)
        ? requiredNames.filter((name) => name !== actionName)
        : [...requiredNames, actionName],
    );
  const toggleAll = () =>
    onChange(
      checkedMatchCount === matchNames.length
        ? requiredNames.filter((name) => !matchNames.includes(name))
        : unique([...requiredNames, ...matchNames]),
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
        <AdminFetchErrorState entity={t('actions')} onRetry={refetch} />
      ) : actions.length === 0 ? (
        <p className="text-sm text-gray-11">
          {t('This piece has no actions.')}
        </p>
      ) : (
        <div className="flex flex-col rounded-xl border">
          <div className="flex flex-col gap-2 border-b p-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t('Search actions')}
            />
            <label className="flex min-h-9 cursor-pointer items-center gap-3 px-1">
              <Checkbox
                checked={
                  checkedMatchCount === 0
                    ? false
                    : checkedMatchCount === matchNames.length
                    ? true
                    : 'indeterminate'
                }
                disabled={matchNames.length === 0}
                onCheckedChange={toggleAll}
              />
              <span className="flex-1 text-sm font-medium text-gray-12">
                {t('Select all')}
              </span>
              <span className="text-xs text-gray-11 tabular-nums">
                {t('{count} of {total} required', {
                  count: checkedCount,
                  total: actionNames.length,
                })}
              </span>
            </label>
          </div>
          {matches.length === 0 ? (
            <p className="p-3 text-sm text-gray-11">{t('No matches.')}</p>
          ) : (
            <div
              className="p-1"
              style={{
                height: listUtils.cappedHeight({
                  count: matches.length,
                  rowHeight: ACTION_ROW_HEIGHT,
                  padding: LIST_PADDING,
                  max: ACTION_LIST_MAX_HEIGHT,
                }),
              }}
            >
              <VirtualizedScrollArea
                items={matches}
                estimateSize={() => ACTION_ROW_HEIGHT}
                getItemKey={(index) => matches[index].name}
                renderItem={(action) => (
                  <label className="flex h-14 min-w-0 cursor-pointer items-center gap-3 rounded-md px-2 hover:bg-gray-3">
                    <Checkbox
                      checked={requiredNames.includes(action.name)}
                      onCheckedChange={() => toggle(action.name)}
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm text-gray-12">
                        {action.displayName}
                      </span>
                      {action.description && (
                        <TextWithTooltip tooltipMessage={action.description}>
                          <span className="truncate text-xs text-gray-11">
                            {action.description}
                          </span>
                        </TextWithTooltip>
                      )}
                    </span>
                    {!isAllowed(action.name) && (
                      <Badge variant="outline" className="shrink-0">
                        {t('Hidden')}
                      </Badge>
                    )}
                  </label>
                )}
              />
            </div>
          )}
        </div>
      )}
      {requiredNames.some((name) => !isAllowed(name)) && (
        <p className="text-xs text-gray-11">
          {t(
            'Actions this {term} hides are shown again when you make them required.',
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
          !sameNames(saved[pieceName] ?? [], local[pieceName] ?? []),
      )
      .map((pieceName) => [pieceName, local[pieceName] ?? []]),
  );
}

function publishingModes(): {
  value: RequiredActionsMode;
  sentence: string;
  hint: string;
}[] {
  return [
    {
      value: RequiredActionsMode.ALL,
      sentence: t(
        'A flow can be published only if it uses [all of] these actions:',
      ),
      hint: t('Every action below has to be in the flow.'),
    },
    {
      value: RequiredActionsMode.ANY,
      sentence: t(
        'A flow can be published only if it uses [at least one of] these actions:',
      ),
      hint: t('Any one of the actions below is enough.'),
    },
  ];
}

function splitMarked(sentence: string): {
  before: string;
  marked: string;
  after: string;
} {
  const match = /^([\s\S]*?)\[([\s\S]+?)\]([\s\S]*)$/.exec(sentence);
  if (!match) {
    return { before: sentence, marked: '', after: '' };
  }
  return { before: match[1], marked: match[2], after: match[3] };
}

const PICKER_ROW_HEIGHT = 44;
const ACTION_ROW_HEIGHT = 56;
const ACTION_LIST_MAX_HEIGHT = 320;
const PIECE_LIST_MAX_HEIGHT = 320;
const LIST_PADDING = 10;
const REQUIRED_ACTIONS_SHOWN = 5;
