import { t } from 'i18next';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { SearchInput } from '@/components/custom/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import {
  ActionKind,
  CatalogPiece,
  PieceSet,
  pieceSetsUtils,
  usePieceSetsStore,
} from './piece-sets-store';
import { PieceLogo } from './piece-sets-ui';

export function PieceActionsSheet({
  set,
  piece,
  onClose,
}: PieceActionsSheetProps) {
  const setPieceAccess = usePieceSetsStore((s) => s.setPieceAccess);
  const access = pieceSetsUtils.accessOf(set, piece.id);
  const [allowed, setAllowedDraft] = useState(access.allowed);
  const [allActions, setAllActions] = useState(
    access.actions === 'all' && access.triggers === 'all',
  );
  const [actions, setActions] = useState<Set<string>>(
    new Set(pieceSetsUtils.allowedActionNames(piece, access)),
  );
  const [triggers, setTriggers] = useState<Set<string>>(
    new Set(pieceSetsUtils.allowedTriggerNames(piece, access)),
  );
  const [required, setRequired] = useState<Set<string>>(
    new Set(
      set.required.filter((r) => r.pieceId === piece.id).map((r) => r.action),
    ),
  );
  const [newActions, setNewActions] = useState<'allow' | 'block'>(
    access.newActions ?? 'block',
  );
  const [tab, setTab] = useState<'actions' | 'triggers'>('actions');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | ActionKind>('all');

  const q = query.trim().toLowerCase();
  const visibleActions = piece.actions.filter(
    (a) =>
      (kind === 'all' || a.kind === kind) &&
      (q === '' || a.name.toLowerCase().includes(q)),
  );
  const visibleTriggers = piece.triggers.filter(
    (tr) => q === '' || tr.toLowerCase().includes(q),
  );
  const kindCount = (k: ActionKind) =>
    piece.actions.filter((a) => a.kind === k).length;
  const effectiveActions = allActions
    ? piece.actions.map((a) => a.name)
    : [...actions];
  const effectiveTriggers = allActions ? piece.triggers : [...triggers];
  const effectiveRequired = [...required].filter((r) =>
    effectiveActions.includes(r),
  );

  const toggle = (setter: typeof setActions, name: string) =>
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  const setMany = (setter: typeof setActions, names: string[], on: boolean) =>
    setter((prev) => {
      const next = new Set(prev);
      names.forEach((n) => (on ? next.add(n) : next.delete(n)));
      return next;
    });
  const startChoosing = () => {
    setActions(new Set(piece.actions.map((a) => a.name)));
    setTriggers(new Set(piece.triggers));
    setAllActions(false);
  };

  const save = () => {
    setPieceAccess({
      setId: set.id,
      pieceId: piece.id,
      access: !allowed
        ? { ...access, allowed: false }
        : allActions
        ? { allowed: true, actions: 'all', triggers: 'all' }
        : {
            allowed: true,
            actions: [...actions],
            triggers: [...triggers],
            newActions,
          },
      required: allowed ? effectiveRequired : [],
    });
    toast(t('Saved {piece} on {name}', { piece: piece.name, name: set.name }));
    onClose();
  };

  const list =
    tab === 'actions' ? visibleActions.map((a) => a.name) : visibleTriggers;
  const selection = tab === 'actions' ? actions : triggers;
  const setter = tab === 'actions' ? setActions : setTriggers;
  const allShownOn =
    list.length > 0 && list.every((n) => allActions || selection.has(n));

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-gray-6 p-5">
          <div className="flex items-center gap-3">
            <PieceLogo piece={piece} size="md" />
            <div className="min-w-0">
              <SheetTitle>{piece.name}</SheetTitle>
            </div>
          </div>
          <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-6 px-4 py-3">
            <span className="text-sm font-medium text-gray-12">
              {t('Allowed on {name}', { name: set.name })}
            </span>
            <Switch checked={allowed} onCheckedChange={setAllowedDraft} />
          </label>
          {allowed && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <ModeOption
                selected={allActions}
                onSelect={() => setAllActions(true)}
                title={t('Everything')}
                description={t('Including actions added later')}
              />
              <ModeOption
                selected={!allActions}
                onSelect={() => !allActions || startChoosing()}
                title={t('Only what I choose')}
                description={t('Pick below')}
              />
            </div>
          )}
        </SheetHeader>

        {allowed ? (
          <>
            <div className="flex flex-col gap-3 border-b border-gray-6 px-5 py-3">
              {piece.triggers.length > 0 && (
                <Tabs
                  value={tab}
                  onValueChange={(v) =>
                    setTab(v === 'triggers' ? 'triggers' : 'actions')
                  }
                >
                  <TabsList>
                    <TabsTrigger value="actions">
                      {t('Actions · {count}/{total}', {
                        count: effectiveActions.length,
                        total: piece.actions.length,
                      })}
                    </TabsTrigger>
                    <TabsTrigger value="triggers">
                      {t('Triggers · {count}/{total}', {
                        count: effectiveTriggers.length,
                        total: piece.triggers.length,
                      })}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder={
                  tab === 'actions' ? t('Search actions') : t('Search triggers')
                }
              />
              {tab === 'actions' && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {(['all', 'read', 'write', 'delete'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-xs',
                        kind === k
                          ? 'border-accent-8 bg-accent-3 text-accent-11'
                          : 'border-gray-6 text-gray-11 hover:bg-gray-3',
                      )}
                    >
                      {k === 'all'
                        ? t('All · {count}', { count: piece.actions.length })
                        : t('{kind} · {count}', {
                            kind: KIND_LABEL[k],
                            count: kindCount(k),
                          })}
                    </button>
                  ))}
                </div>
              )}
              {!allActions && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={list.length === 0}
                    onClick={() => setMany(setter, list, !allShownOn)}
                  >
                    {allShownOn
                      ? t('Clear {count} shown', { count: list.length })
                      : t('Select {count} shown', { count: list.length })}
                  </Button>
                  {tab === 'actions' && kindCount('read') > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setActions(
                          new Set(
                            piece.actions
                              .filter((a) => a.kind === 'read')
                              .map((a) => a.name),
                          ),
                        )
                      }
                    >
                      {t('Only read actions')}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {list.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-gray-11">
                  {t('Nothing matches.')}
                </p>
              )}
              {tab === 'actions'
                ? visibleActions.map((a) => {
                    const on = allActions || actions.has(a.name);
                    const isRequired = on && required.has(a.name);
                    return (
                      <div
                        key={a.name}
                        className="flex items-center justify-between gap-3 border-b border-gray-6 px-5 py-2"
                      >
                        <label className="flex min-w-0 cursor-pointer items-center gap-3 text-sm">
                          <Checkbox
                            checked={on}
                            disabled={allActions}
                            onCheckedChange={() => toggle(setActions, a.name)}
                          />
                          <span className="truncate">{a.name}</span>
                          <Badge variant={KIND_BADGE[a.kind]}>
                            {KIND_LABEL[a.kind]}
                          </Badge>
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!on}
                          aria-pressed={isRequired}
                          onClick={() => toggle(setRequired, a.name)}
                          className={cn(
                            isRequired ? 'text-warning-11' : 'text-gray-11',
                          )}
                        >
                          <Star
                            className={cn(
                              'size-3.5',
                              isRequired && 'fill-current',
                            )}
                          />
                          {isRequired ? t('Required') : t('Require')}
                        </Button>
                      </div>
                    );
                  })
                : visibleTriggers.map((tr) => (
                    <label
                      key={tr}
                      className="flex cursor-pointer items-center gap-3 border-b border-gray-6 px-5 py-2.5 text-sm"
                    >
                      <Checkbox
                        checked={allActions || triggers.has(tr)}
                        disabled={allActions}
                        onCheckedChange={() => toggle(setTriggers, tr)}
                      />
                      {tr}
                    </label>
                  ))}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
            <p className="text-sm font-medium text-gray-12">
              {t('{piece} is blocked', { piece: piece.name })}
            </p>
            <p className="max-w-sm text-sm text-gray-11">
              {t('Turn it on to choose its actions.')}
            </p>
          </div>
        )}
        <SheetFooter className="flex flex-col gap-3 border-t border-gray-6 p-5">
          {allowed && !allActions && (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-11">
                {t('When {piece} adds new actions', { piece: piece.name })}
              </span>
              <Select
                value={newActions}
                onValueChange={(v) =>
                  setNewActions(v === 'allow' ? 'allow' : 'block')
                }
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allow">{t('Allow them')}</SelectItem>
                  <SelectItem value="block">{t('Keep them hidden')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-11">
              {t('{actions} of {totalActions} actions', {
                actions: effectiveActions.length,
                totalActions: piece.actions.length,
              })}
              {piece.triggers.length > 0 &&
                ` · ${t('{triggers} of {totalTriggers} triggers', {
                  triggers: effectiveTriggers.length,
                  totalTriggers: piece.triggers.length,
                })}`}
              {effectiveRequired.length > 0 &&
                ` · ${t('{count} required', {
                  count: effectiveRequired.length,
                })}`}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                {t('Cancel')}
              </Button>
              <Button
                disabled={
                  !allActions && actions.size === 0 && triggers.size === 0
                }
                onClick={save}
              >
                {t('Save')}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ModeOption({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2.5 text-left',
        selected
          ? 'border-accent-8 bg-accent-3'
          : 'border-gray-6 hover:bg-gray-3',
      )}
    >
      <span className="text-sm font-medium text-gray-12">{title}</span>
      <span className="text-xs text-gray-11">{description}</span>
    </button>
  );
}

const KIND_LABEL: Record<ActionKind, string> = {
  read: 'Read',
  write: 'Write',
  delete: 'Delete',
};

const KIND_BADGE: Record<ActionKind, 'neutral' | 'info' | 'destructive'> = {
  read: 'neutral',
  write: 'info',
  delete: 'destructive',
};

type PieceActionsSheetProps = {
  set: PieceSet;
  piece: CatalogPiece;
  onClose: () => void;
};
