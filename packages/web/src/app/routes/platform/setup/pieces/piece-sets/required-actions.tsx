import {
  PieceSet,
  RequiredAction,
  RequiredActionsMode,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, ChevronLeft, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { useGuardedClose } from '@/components/custom/leave-without-saving';
import { ListSearch } from '@/components/custom/list/list-toolbar';
import { SaveBar } from '@/components/custom/settings-parts';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ChangePieceSet } from '@/features/piece-sets';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

import { SheetSaveForm } from '../sheet-save-form';

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
              className="inline-flex items-center gap-0.5 rounded-md bg-accent-3 px-1.5 font-medium text-accent-11 outline-hidden hover:bg-accent-4 focus-visible:ring-2 focus-visible:ring-accent-8"
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
                  className={
                    option.value === mode ? 'mt-0.5' : 'mt-0.5 opacity-0'
                  }
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

export function RequiredActionRow({
  action,
  onRemove,
}: {
  action: RequiredAction;
  onRemove?: () => void;
}) {
  const { summary } = piecesHooks.usePieceSummary({ name: action.pieceName });
  const { pieceModel } = piecesHooks.usePiece({ name: action.pieceName });
  const actionLabel =
    pieceModel?.actions[action.actionName]?.displayName ?? action.actionName;
  return (
    <li className="flex min-h-10 min-w-0 items-center gap-2.5 text-sm">
      <PieceIcon
        size="xs"
        border
        displayName={summary?.displayName}
        logoUrl={summary?.logoUrl}
        showTooltip={false}
      />
      <span className="min-w-0 flex-1 truncate text-gray-12">
        {actionLabel}
        <span className="text-gray-11">
          {' · '}
          {summary?.displayName ?? action.pieceName}
        </span>
      </span>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('Remove {name}', { name: actionLabel })}
          onClick={onRemove}
        >
          <X />
        </Button>
      )}
    </li>
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
  const savedRequired = pieceSet.config.requiredActions ?? [];
  const savedMode =
    pieceSet.config.requiredActionsMode ?? RequiredActionsMode.ANY;
  const [required, setRequired] = useState<RequiredAction[]>(savedRequired);
  const [mode, setMode] = useState<RequiredActionsMode>(savedMode);
  const [pickingPiece, setPickingPiece] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty =
    mode !== savedMode || requiredKey(required) !== requiredKey(savedRequired);
  const { requestClose, dialog: leaveDialog } = useGuardedClose({
    dirty: dirty && !saving,
    onClose,
  });

  const isRequired = (candidate: RequiredAction) =>
    required.some(
      (item) =>
        item.pieceName === candidate.pieceName &&
        item.actionName === candidate.actionName,
    );
  const toggle = (candidate: RequiredAction) =>
    setRequired((current) =>
      isRequired(candidate)
        ? current.filter(
            (item) =>
              item.pieceName !== candidate.pieceName ||
              item.actionName !== candidate.actionName,
          )
        : [...current, candidate],
    );

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
      requiredActions: required,
      mode,
    });
    setSaving(false);
    if (saved) {
      onClose();
    }
  };

  return (
    <Sheet open onOpenChange={(next) => !next && requestClose()}>
      <SheetContent size="md">
        <SheetHeader>
          <SheetTitle>{t('Publishing rule')}</SheetTitle>
          <SheetDescription>
            {t(
              'Actions every flow on this policy must use before it can be published. Saved now; publishing does not check it yet.',
            )}
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          <PublishingRuleSentence
            count={required.length}
            mode={mode}
            onModeChange={setMode}
          />
          {required.length > 0 && (
            <ul className="flex flex-col rounded-xl border px-3 py-1">
              {required.map((item) => (
                <RequiredActionRow
                  key={`${item.pieceName}:${item.actionName}`}
                  action={item}
                  onRemove={() => toggle(item)}
                />
              ))}
            </ul>
          )}
          <section className="flex flex-col gap-3 border-t pt-5">
            <h3 className="text-sm font-medium text-gray-12">
              {t('Add an action')}
            </h3>
            {pickingPiece === null ? (
              <PiecePicker onPick={setPickingPiece} />
            ) : (
              <ActionPicker
                pieceName={pickingPiece}
                isRequired={isRequired}
                onToggle={toggle}
                onBack={() => setPickingPiece(null)}
              />
            )}
          </section>
        </SheetBody>
        {dirty && (
          <SheetFooter>
            <SheetSaveForm onSubmit={save}>
              <SaveBar dirty={dirty} saving={saving} onDiscard={discard} />
            </SheetSaveForm>
          </SheetFooter>
        )}
      </SheetContent>
      {leaveDialog}
    </Sheet>
  );
}

function PiecePicker({ onPick }: { onPick: (pieceName: string) => void }) {
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
        (query === '' || piece.displayName.toLowerCase().includes(query)),
    )
    .slice(0, MAX_PIECES_SHOWN);
  return (
    <>
      <ListSearch
        value={search}
        onChange={setSearch}
        placeholder={t('Search pieces')}
      />
      {isLoading ? (
        <SkeletonList numberOfItems={5} className="h-10 rounded-xl" />
      ) : isError ? (
        <DataFetchErrorState entity={t('pieces')} onRetry={refetch} />
      ) : matches.length === 0 ? (
        <p className="text-sm text-gray-11">{t('No piece matches')}</p>
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
  pieceName,
  isRequired,
  onToggle,
  onBack,
}: {
  pieceName: string;
  isRequired: (candidate: RequiredAction) => boolean;
  onToggle: (candidate: RequiredAction) => void;
  onBack: () => void;
}) {
  const { pieceModel, isLoading, isError, refetch } = piecesHooks.usePiece({
    name: pieceName,
  });
  const actions = pieceModel ? Object.values(pieceModel.actions) : [];
  return (
    <>
      <Button variant="ghost" size="sm" className="self-start" onClick={onBack}>
        <ChevronLeft />
        {pieceModel?.displayName ?? t('Pieces')}
      </Button>
      {isLoading ? (
        <SkeletonList numberOfItems={5} className="h-10 rounded-xl" />
      ) : isError ? (
        <DataFetchErrorState entity={t('actions')} onRetry={refetch} />
      ) : (
        <ul className="flex flex-col rounded-xl border">
          {actions.map((action) => {
            const candidate = { pieceName, actionName: action.name };
            const chosen = isRequired(candidate);
            return (
              <li
                key={action.name}
                className="flex min-h-11 items-center gap-3 border-t px-3 py-2 first:border-t-0"
              >
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
                <Button
                  variant={chosen ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => onToggle(candidate)}
                >
                  {chosen ? <Check /> : <Plus />}
                  {chosen ? t('Required') : t('Require')}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function requiredKey(actions: RequiredAction[]): string {
  return actions
    .map((action) => `${action.pieceName}:${action.actionName}`)
    .sort()
    .join('|');
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
