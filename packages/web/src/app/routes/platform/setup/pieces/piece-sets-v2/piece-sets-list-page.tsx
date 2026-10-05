import { t } from 'i18next';
import {
  ChevronRight,
  Copy,
  MoreHorizontal,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { PieceSetFormDialog } from './piece-set-form-dialog';
import {
  PieceSet,
  pieceSetsUtils,
  usePieceSetsStore,
} from './piece-sets-store';
import { piecesSummary, ProjectsCell } from './piece-sets-ui';
import { FilterSearch, Panel, PolicyPage } from './policy-kit';

export const PieceSetsListPage = () => {
  const navigate = useNavigate();
  const sets = usePieceSetsStore((s) => s.sets);
  const { create, remove } = usePieceSetsStore();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PieceSet | null>(null);
  const [deleting, setDeleting] = useState<PieceSet | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sets.filter(
      (s) =>
        q === '' ||
        s.name.toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q),
    );
  }, [sets, query]);

  const duplicate = (set: PieceSet) => {
    const id = create({
      name: t('{name} copy', { name: set.name }),
      key: `${set.key}-copy`,
      copyFrom: set.id,
    });
    toast(t('Duplicated {name}', { name: set.name }));
    navigate(`/platform/pieces/piece-sets/${id}`);
  };

  return (
    <PolicyPage>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-12">
            {t('Piece policies')}
          </h1>
          <p className="text-sm text-gray-11">
            {t('Which pieces each project can build with.')}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          {t('New policy')}
        </Button>
      </header>

      <Panel>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <FilterSearch
            value={query}
            onChange={setQuery}
            placeholder={t('Search by name or embed key')}
            className="w-72"
          />
        </div>
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col />
            <col className="w-56" />
            <col className="w-36" />
            <col className="w-44" />
            <col className="w-28" />
            <col className="w-20" />
          </colgroup>
          <thead>
            <tr className="border-y border-gray-6 bg-gray-2 text-left text-xs font-medium text-gray-11">
              <th className="py-2.5 pl-5 font-medium">{t('Policy')}</th>
              <th className="py-2.5 font-medium">{t('Applies to')}</th>
              <th className="py-2.5 font-medium">{t('New pieces')}</th>
              <th className="py-2.5 font-medium">{t('Required in flows')}</th>
              <th className="py-2.5 font-medium">{t('Updated')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((set) => {
              const limited = pieceSetsUtils.limitedCount(set);
              return (
                <tr
                  key={set.id}
                  onClick={() =>
                    navigate(`/platform/pieces/piece-sets/${set.id}`)
                  }
                  className="cursor-pointer border-b border-gray-6 transition-colors last:border-b-0 hover:bg-gray-2"
                >
                  <td className="py-3.5 pl-5 pr-4">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <div className="flex h-6 items-center gap-2">
                        <span className="truncate font-medium text-gray-12">
                          {set.name}
                        </span>
                        {set.isDefault && (
                          <Badge variant="outline">{t('Default')}</Badge>
                        )}
                      </div>
                      <span className="truncate text-xs text-gray-11">
                        {piecesSummary.sentence(set)}
                        {limited > 0 &&
                          ` · ${t('limitedPiecesCount', { count: limited })}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    {set.isDefault ? (
                      <span className="text-sm text-gray-11">
                        {t('Every other project')}
                      </span>
                    ) : (
                      <ProjectsCell set={set} />
                    )}
                  </td>
                  <td className="py-3.5 pr-4">
                    {set.includeNewPieces ? (
                      <Badge variant="success">{t('Allowed')}</Badge>
                    ) : (
                      <Badge variant="neutral">{t('Blocked')}</Badge>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-gray-11">
                    {set.required.length === 0 ? (
                      '—'
                    ) : (
                      <span className="flex items-center gap-1.5 text-gray-12">
                        <Star className="size-3.5 fill-current text-warning-11" />
                        {t('requiredActionsCount', {
                          count: set.required.length,
                        })}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 pr-4 text-gray-11">
                    {piecesSummary.timeAgo(set.updatedAt)}
                  </td>
                  <td
                    className="py-3.5 pr-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t('More')}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onSelect={() => setEditing(set)}>
                            <Pencil className="size-4" />
                            {t('Rename')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => duplicate(set)}>
                            <Copy className="size-4" />
                            {t('Duplicate')}
                          </DropdownMenuItem>
                          {!set.isDefault && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleting(set)}
                              >
                                <Trash2 className="size-4" />
                                {t('Delete')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ChevronRight className="size-4 text-gray-9" />
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center">
                  <p className="font-medium text-gray-12">
                    {t('No policy matches')}
                  </p>
                  <p className="mt-1 text-sm text-gray-11">
                    {t('Try a different name or embed key.')}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>

      <PieceSetFormDialog
        open={creating}
        onOpenChange={setCreating}
        mode="create"
      />
      <PieceSetFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        mode="edit"
        set={editing ?? undefined}
      />
      {deleting && (
        <ConfirmationDeleteDialog
          open={true}
          onOpenChange={(open) => !open && setDeleting(null)}
          title={t('Delete {name}', { name: deleting.name })}
          entityName={t('Policy')}
          message={t(
            'Its projects move to the Default policy and can then use the pieces Default allows.',
          )}
          showToast={false}
          mutationFn={async () => {
            remove({ setId: deleting.id });
            toast(t('Deleted {name}', { name: deleting.name }));
            setDeleting(null);
          }}
        />
      )}
    </PolicyPage>
  );
};
