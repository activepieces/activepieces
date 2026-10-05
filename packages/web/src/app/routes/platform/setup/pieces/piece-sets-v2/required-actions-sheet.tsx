import { t } from 'i18next';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import {
  CATALOG,
  PieceSet,
  RequiredAction,
  pieceSetsUtils,
  usePieceSetsStore,
} from './piece-sets-store';
import { PieceLogo } from './piece-sets-ui';
import { PublishingRuleSentence } from './publishing-rule';

const MAX_RESULTS = 60;

export function RequiredActionsSheet({
  set,
  open,
  onOpenChange,
}: RequiredActionsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {open && (
          <RequiredActionsEditor
            key={set.id}
            set={set}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function RequiredActionsEditor({
  set,
  onClose,
}: {
  set: PieceSet;
  onClose: () => void;
}) {
  const setRequired = usePieceSetsStore((s) => s.setRequired);
  const [required, setRequiredDraft] = useState<RequiredAction[]>(set.required);
  const [mode, setMode] = useState(set.requiredMode);
  const [query, setQuery] = useState('');

  const isRequired = (pieceId: string, action: string) =>
    required.some((r) => r.pieceId === pieceId && r.action === action);
  const q = query.trim().toLowerCase();
  const candidates = CATALOG.flatMap((p) => {
    const access = pieceSetsUtils.accessOf(set, p.id);
    return pieceSetsUtils
      .allowedActionNames(p, access)
      .map((action) => ({ piece: p, action }));
  }).filter(
    (c) =>
      !isRequired(c.piece.id, c.action) &&
      (q === '' ||
        c.piece.name.toLowerCase().includes(q) ||
        c.action.toLowerCase().includes(q)),
  );

  return (
    <>
      <SheetHeader className="border-b border-gray-6 p-5">
        <SheetTitle>{t('Publishing rule')}</SheetTitle>
        <SheetDescription>{set.name}</SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-4 overflow-y-auto p-5">
        <section className="flex flex-col gap-3">
          <PublishingRuleSentence
            count={required.length}
            mode={mode}
            onModeChange={setMode}
          />
          {required.length > 0 && (
            <div className="flex flex-col rounded-lg border border-gray-6">
              {required.map((r) => {
                const p = pieceSetsUtils.piece(r.pieceId);
                if (!p) return null;
                return (
                  <div
                    key={`${r.pieceId}-${r.action}`}
                    className="flex items-center justify-between gap-3 border-b border-gray-6 px-3 py-2 last:border-b-0"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm">
                      <PieceLogo piece={p} size="xs" />
                      <span className="truncate">
                        <span className="text-gray-11">{p.name} ·</span>{' '}
                        {r.action}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('Remove')}
                      onClick={() =>
                        setRequiredDraft((prev) =>
                          prev.filter(
                            (x) =>
                              !(
                                x.pieceId === r.pieceId && x.action === r.action
                              ),
                          ),
                        )
                      }
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-gray-12">
            {t('Add an action')}
          </h3>
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder={t('Search pieces or actions')}
          />
          <div className="flex flex-col rounded-lg border border-gray-6">
            {candidates.slice(0, MAX_RESULTS).map((c) => (
              <button
                key={`${c.piece.id}-${c.action}`}
                type="button"
                onClick={() =>
                  setRequiredDraft((prev) => [
                    ...prev,
                    { pieceId: c.piece.id, action: c.action },
                  ])
                }
                className="flex items-center justify-between gap-3 border-b border-gray-6 px-3 py-2 text-left last:border-b-0 hover:bg-gray-3"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <PieceLogo piece={c.piece} size="xs" />
                  <span className="truncate">
                    <span className="text-gray-11">{c.piece.name} ·</span>{' '}
                    {c.action}
                  </span>
                </span>
                <Plus className="size-4 shrink-0 text-gray-11" />
              </button>
            ))}
            {candidates.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-11">
                {t('Nothing matches.')}
              </p>
            )}
            {candidates.length > MAX_RESULTS && (
              <p className="px-3 py-2 text-xs text-gray-11">
                {t('Showing {shown} of {total}. Search to narrow it down.', {
                  shown: MAX_RESULTS,
                  total: candidates.length,
                })}
              </p>
            )}
          </div>
        </section>
      </div>

      <SheetFooter className="mt-auto flex-row justify-end gap-2 border-t border-gray-6 p-5">
        <Button variant="outline" onClick={onClose}>
          {t('Cancel')}
        </Button>
        <Button
          onClick={() => {
            setRequired({ setId: set.id, required, mode });
            toast(t('Saved'));
            onClose();
          }}
        >
          {t('Save')}
        </Button>
      </SheetFooter>
    </>
  );
}

type RequiredActionsSheetProps = {
  set: PieceSet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
