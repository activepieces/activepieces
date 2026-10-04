import {
  PieceSet,
  RequiredAction,
  RequiredActionsMode,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Check, ChevronDown, ChevronLeft, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { ListSearch } from '@/components/custom/list/list-toolbar';
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
import { pieceSetMutations } from '@/features/piece-sets';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';

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
}: {
  pieceSet: PieceSet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="md">
        {open && (
          <RequiredActionsEditor
            key={pieceSet.id}
            pieceSet={pieceSet}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function RequiredActionsEditor({
  pieceSet,
  onClose,
}: {
  pieceSet: PieceSet;
  onClose: () => void;
}) {
  const [required, setRequired] = useState<RequiredAction[]>(
    pieceSet.config.requiredActions ?? [],
  );
  const [mode, setMode] = useState<RequiredActionsMode>(
    pieceSet.config.requiredActionsMode ?? RequiredActionsMode.ANY,
  );
  const [pickingPiece, setPickingPiece] = useState<string | null>(null);
  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();

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

  return (
    <>
      <SheetHeader>
        <SheetTitle>{t('Publishing rule')}</SheetTitle>
        <SheetDescription>
          {t(
            'Actions every flow on this set must use before it can be published. Saved now; publishing does not check it yet.',
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
      <SheetFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button
          loading={isPending}
          onClick={() =>
            updateSet(
              {
                id: pieceSet.id,
                request: {
                  requiredActions: required,
                  requiredActionsMode: mode,
                },
              },
              { onSuccess: onClose },
            )
          }
        >
          {t('Save')}
        </Button>
      </SheetFooter>
    </>
  );
}

function PiecePicker({ onPick }: { onPick: (pieceName: string) => void }) {
  const [search, setSearch] = useState('');
  const { pieces, isLoading } = piecesHooks.usePieces({
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
  const { pieceModel, isLoading } = piecesHooks.usePiece({ name: pieceName });
  const actions = pieceModel ? Object.values(pieceModel.actions) : [];
  return (
    <>
      <Button variant="ghost" size="sm" className="self-start" onClick={onBack}>
        <ChevronLeft />
        {pieceModel?.displayName ?? t('Pieces')}
      </Button>
      {isLoading ? (
        <SkeletonList numberOfItems={5} className="h-10 rounded-xl" />
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
