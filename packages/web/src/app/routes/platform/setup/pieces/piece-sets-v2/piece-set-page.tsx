import { t } from 'i18next';
import {
  Ban,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { BackLink } from '@/components/custom/back-link';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

import { AssignProjectsDialog } from './assign-projects-dialog';
import { PieceActionsSheet } from './piece-actions-sheet';
import { PieceSetFormDialog } from './piece-set-form-dialog';
import {
  CATALOG,
  CATEGORIES,
  CatalogPiece,
  PieceSet,
  pieceSetsUtils,
  usePieceSetsStore,
} from './piece-sets-store';
import { piecesSummary, PieceLogo, ProjectAvatar } from './piece-sets-ui';
import {
  Eyebrow,
  FilterSearch,
  Panel,
  PolicyPage,
  Segmented,
} from './policy-kit';
import { PublishingRuleSentence } from './publishing-rule';
import { RequiredActionsSheet } from './required-actions-sheet';

export const PieceSetPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const set = usePieceSetsStore((s) => s.sets.find((x) => x.id === id));
  const { setAllowed, setPieceAccess, create, remove } = usePieceSetsStore();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openPiece, setOpenPiece] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [editingRequired, setEditingRequired] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState<PieceRow[] | null>(null);

  const rows = useMemo<PieceRow[]>(() => {
    if (!set) return [];
    return CATALOG.map((p) => {
      const access = pieceSetsUtils.accessOf(set, p.id);
      return {
        piece: p,
        allowed: access.allowed,
        limited: pieceSetsUtils.isLimited(p, access),
        actions: pieceSetsUtils.allowedActionNames(p, access).length,
        triggers: pieceSetsUtils.allowedTriggerNames(p, access).length,
        required: set.required.filter((r) => r.pieceId === p.id).length,
        flows: pieceSetsUtils.liveFlows({ set, pieceId: p.id }),
      };
    });
  }, [set]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (status === 'all' ||
          (status === 'allowed' && r.allowed) ||
          (status === 'blocked' && !r.allowed) ||
          (status === 'limited' && r.limited)) &&
        (categories.length === 0 || categories.includes(r.piece.category)) &&
        (q === '' ||
          r.piece.name.toLowerCase().includes(q) ||
          r.piece.actions.some((a) => a.name.toLowerCase().includes(q))),
    );
  }, [rows, status, categories, query]);

  if (!set) return <Navigate to="/platform/pieces/piece-sets" replace />;

  const counts = {
    all: rows.length,
    allowed: rows.filter((r) => r.allowed).length,
    blocked: rows.filter((r) => !r.allowed).length,
    limited: rows.filter((r) => r.limited).length,
  };
  const selectedRows = rows.filter((r) => selected.has(r.piece.id));
  const allVisibleSelected =
    visible.length > 0 && visible.every((r) => selected.has(r.piece.id));
  const someVisibleSelected = visible.some((r) => selected.has(r.piece.id));

  const toggleSelected = (pieceId: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pieceId)) next.delete(pieceId);
      else next.add(pieceId);
      return next;
    });
  const toggleAllVisible = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      visible.forEach((r) =>
        allVisibleSelected ? next.delete(r.piece.id) : next.add(r.piece.id),
      );
      return next;
    });

  const applyAllowed = (target: PieceRow[], allowed: boolean) => {
    setAllowed({
      setId: set.id,
      pieceIds: target.map((r) => r.piece.id),
      allowed,
    });
    toast(
      allowed
        ? t('allowedPiecesToast', { count: target.length, name: set.name })
        : t('blockedPiecesToast', { count: target.length, name: set.name }),
    );
  };
  const block = (target: PieceRow[]) => {
    if (target.some((r) => r.flows > 0)) {
      setConfirmBlock(target);
      return;
    }
    applyAllowed(target, false);
    setSelected(new Set());
  };
  const makeReadOnly = (target: PieceRow[]) => {
    const eligible = target.filter((r) =>
      r.piece.actions.some((a) => a.kind === 'read'),
    );
    eligible.forEach((r) => {
      const reads = r.piece.actions
        .filter((a) => a.kind === 'read')
        .map((a) => a.name);
      setPieceAccess({
        setId: set.id,
        pieceId: r.piece.id,
        access: {
          allowed: true,
          actions: reads,
          triggers: 'all',
          newActions: 'block',
        },
        required: set.required
          .filter((x) => x.pieceId === r.piece.id && reads.includes(x.action))
          .map((x) => x.action),
      });
    });
    toast(t('readOnlyToast', { count: eligible.length }));
    setSelected(new Set());
  };

  const opened = openPiece ? pieceSetsUtils.piece(openPiece) : undefined;

  return (
    <PolicyPage>
      <header className="flex flex-col gap-4">
        <BackLink
          label={t('Piece policies')}
          onClick={() => navigate('/platform/pieces/piece-sets')}
        />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2.5">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-12">
                {set.name}
              </h1>
              {set.isDefault && <Badge variant="outline">{t('Default')}</Badge>}
            </div>
            <p className="text-sm text-gray-11">
              {appliesTo(set)} ·{' '}
              {t('Updated {time}', {
                time: piecesSummary.timeAgo(set.updatedAt),
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setRenaming(true)}>
              <Pencil className="size-4" />
              {t('Rename')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label={t('More')}>
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onSelect={() => {
                    const copyId = create({
                      name: t('{name} copy', { name: set.name }),
                      key: `${set.key}-copy`,
                      copyFrom: set.id,
                    });
                    toast(t('Duplicated {name}', { name: set.name }));
                    navigate(`/platform/pieces/piece-sets/${copyId}`);
                  }}
                >
                  <Copy className="size-4" />
                  {t('Duplicate')}
                </DropdownMenuItem>
                {!set.isDefault && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleting(true)}
                    >
                      <Trash2 className="size-4" />
                      {t('Delete policy')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel>
          <div className="flex flex-wrap items-start justify-between gap-4 px-5 pb-4 pt-5">
            <div>
              <h2 className="text-base font-semibold text-gray-12">
                {t('Pieces')}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <FilterSearch
                value={query}
                onChange={setQuery}
                placeholder={t('Search pieces or actions')}
                className="w-64"
              />
              <CategoryFilter value={categories} onChange={setCategories} />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4">
            <Segmented
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: t('All'), count: counts.all },
                {
                  value: 'allowed',
                  label: t('Allowed'),
                  count: counts.allowed,
                },
                {
                  value: 'blocked',
                  label: t('Blocked'),
                  count: counts.blocked,
                },
                {
                  value: 'limited',
                  label: t('Limited'),
                  count: counts.limited,
                },
              ]}
            />
            {selectedRows.length > 0 && !openPiece && (
              <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-gray-6 bg-panel p-1.5 pl-4 shadow-lg">
                <span className="mr-2 text-sm font-medium text-gray-12">
                  {t('{count} selected', { count: selectedRows.length })}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={selectedRows.every((r) => r.allowed)}
                  onClick={() => {
                    applyAllowed(selectedRows, true);
                    setSelected(new Set());
                  }}
                >
                  <Check className="size-4" />
                  {t('Allow')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={selectedRows.every((r) => !r.allowed)}
                  onClick={() => block(selectedRows)}
                >
                  <Ban className="size-4" />
                  {t('Block')}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => makeReadOnly(selectedRows)}
                >
                  <Eye className="size-4" />
                  {t('Read-only')}
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t('Clear selection')}
                  onClick={() => setSelected(new Set())}
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <table className="w-full table-fixed border-collapse text-sm">
            <colgroup>
              <col className="w-12" />
              <col />
              <col className="w-52" />
              <col className="w-28" />
              <col className="w-20" />
              <col className="w-10" />
            </colgroup>
            <thead>
              <tr className="border-y border-gray-6 bg-gray-2 text-left text-xs font-medium text-gray-11">
                <th className="py-2.5 pl-5">
                  <Checkbox
                    aria-label={t('Select all shown')}
                    checked={
                      allVisibleSelected
                        ? true
                        : someVisibleSelected
                        ? 'indeterminate'
                        : false
                    }
                    onCheckedChange={toggleAllVisible}
                  />
                </th>
                <th className="py-2.5 font-medium">{t('Piece')}</th>
                <th className="py-2.5 font-medium">{t('What it can do')}</th>
                <th className="py-2.5 font-medium">{t('Used in')}</th>
                <th className="py-2.5 font-medium">{t('Allowed')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr
                  key={r.piece.id}
                  onClick={() => setOpenPiece(r.piece.id)}
                  className={cn(
                    'cursor-pointer border-b border-gray-6 transition-colors last:border-b-0 hover:bg-gray-2',
                    selected.has(r.piece.id) && 'bg-accent-2 hover:bg-accent-2',
                  )}
                >
                  <td
                    className="py-3 pl-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      aria-label={t('Select {piece}', { piece: r.piece.name })}
                      checked={selected.has(r.piece.id)}
                      onCheckedChange={() => toggleSelected(r.piece.id)}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <PieceLogo piece={r.piece} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'truncate font-medium',
                              r.allowed ? 'text-gray-12' : 'text-gray-11',
                            )}
                          >
                            {r.piece.name}
                          </span>
                          {r.piece.custom && (
                            <Badge variant="outline">{t('Custom')}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <CapabilityCell row={r} />
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-gray-11">
                    {r.flows > 0 ? t('flowsCount', { count: r.flows }) : '—'}
                  </td>
                  <td className="py-3" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      aria-label={t('Allow {piece}', { piece: r.piece.name })}
                      checked={r.allowed}
                      onCheckedChange={(on) =>
                        on ? applyAllowed([r], true) : block([r])
                      }
                    />
                  </td>
                  <td className="py-3 pr-4 text-gray-9">
                    <ChevronRight className="size-4" />
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="font-medium text-gray-12">
                      {t('No piece matches')}
                    </p>
                    <p className="mt-1 text-sm text-gray-11">
                      {t('Try another search, category or tab.')}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Panel>

        <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:rounded-2xl">
          <Panel className="divide-y divide-gray-6">
            <RailSection title={t('Applies to')}>
              <ProjectsBlock set={set} onChange={() => setAssigning(true)} />
            </RailSection>
            <RailSection title={t('New pieces')}>
              <NewPiecesBlock set={set} />
            </RailSection>
            <RailSection title={t('Publishing rule')}>
              <RequiredBlock
                set={set}
                onEdit={() => setEditingRequired(true)}
              />
            </RailSection>
            <RailSection title={t('Embed key')}>
              <CopyToClipboardInput textToCopy={set.key} useInput={true} />
            </RailSection>
          </Panel>
        </aside>
      </div>

      {opened && (
        <PieceActionsSheet
          key={opened.id}
          set={set}
          piece={opened}
          onClose={() => setOpenPiece(null)}
        />
      )}
      <AssignProjectsDialog
        set={set}
        open={assigning}
        onOpenChange={setAssigning}
      />
      <RequiredActionsSheet
        set={set}
        open={editingRequired}
        onOpenChange={setEditingRequired}
      />
      <PieceSetFormDialog
        open={renaming}
        onOpenChange={setRenaming}
        mode="edit"
        set={set}
      />
      {deleting && (
        <ConfirmationDeleteDialog
          open={true}
          onOpenChange={setDeleting}
          title={t('Delete {name}', { name: set.name })}
          entityName={t('Policy')}
          message={t(
            'Its projects move to the Default policy and can then use the pieces Default allows.',
          )}
          showToast={false}
          mutationFn={async () => {
            remove({ setId: set.id });
            toast(t('Deleted {name}', { name: set.name }));
            navigate('/platform/pieces/piece-sets');
          }}
        />
      )}
      {confirmBlock && (
        <Dialog
          open={true}
          onOpenChange={(open) => !open && setConfirmBlock(null)}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {t('blockPiecesTitle', { count: confirmBlock.length })}
              </DialogTitle>
              <DialogDescription>
                {t(
                  'Live flows on {name} use some of these. They keep running, but nobody can add these pieces to a flow or edit those steps.',
                  { name: set.name },
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col divide-y divide-gray-6 rounded-xl border border-gray-6">
              {confirmBlock
                .filter((r) => r.flows > 0)
                .map((r) => (
                  <div
                    key={r.piece.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <span className="flex items-center gap-2.5 text-sm">
                      <PieceLogo piece={r.piece} size="xs" />
                      {r.piece.name}
                    </span>
                    <span className="text-sm text-gray-11">
                      {t('flowsCount', { count: r.flows })}
                    </span>
                  </div>
                ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmBlock(null)}>
                {t('Cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  applyAllowed(confirmBlock, false);
                  setConfirmBlock(null);
                  setSelected(new Set());
                }}
              >
                {t('Block anyway')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PolicyPage>
  );
};

function appliesTo(set: PieceSet): string {
  if (set.isDefault) return t('Every project not on another policy');
  if (set.sdkProjectCount > 0)
    return t('sdkProjectsLong', { count: set.sdkProjectCount });
  const names = set.projectIds.flatMap((id) => {
    const p = pieceSetsUtils.project(id);
    return p ? [p.name] : [];
  });
  if (names.length === 0) return t('No projects yet');
  return t('projectsAssignedCount', { count: names.length });
}

function CapabilityCell({ row }: { row: PieceRow }) {
  if (!row.allowed) {
    return <span className="text-gray-11">{t('Blocked')}</span>;
  }
  const { piece } = row;
  const allActions = row.actions === piece.actions.length;
  const allTriggers = row.triggers === piece.triggers.length;
  return (
    <div className="flex min-w-0 flex-col">
      <span
        className={cn(
          'truncate',
          row.limited ? 'text-accent-11' : 'text-gray-12',
        )}
      >
        {allActions && allTriggers
          ? t('Everything')
          : t('{count} of {total} actions', {
              count: row.actions,
              total: piece.actions.length,
            })}
      </span>
      {(row.required > 0 || !allTriggers) && (
        <span className="flex items-center gap-1.5 truncate text-xs text-gray-11">
          {!allTriggers &&
            t('{count} of {total} triggers', {
              count: row.triggers,
              total: piece.triggers.length,
            })}
          {row.required > 0 && (
            <span className="flex items-center gap-0.5 text-warning-11">
              <Star className="size-3 fill-current" />
              {t('{count} required', { count: row.required })}
            </span>
          )}
        </span>
      )}
    </div>
  );
}

function CategoryFilter({
  value,
  onChange,
}: {
  value: string[];
  onChange: (value: string[]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-1.5">
          {value.length === 0
            ? t('All categories')
            : value.length === 1
            ? value[0]
            : t('{count} categories', { count: value.length })}
          <ChevronDown className="size-4 text-gray-11" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {CATEGORIES.map((c) => (
          <DropdownMenuCheckboxItem
            key={c}
            checked={value.includes(c)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={(on) =>
              onChange(on ? [...value, c] : value.filter((x) => x !== c))
            }
          >
            {c}
          </DropdownMenuCheckboxItem>
        ))}
        {value.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange([])}>
              {t('Clear')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-5">
      <Eyebrow>{title}</Eyebrow>
      {children}
    </div>
  );
}

function ProjectsBlock({
  set,
  onChange,
}: {
  set: PieceSet;
  onChange: () => void;
}) {
  if (set.sdkProjectCount > 0) {
    return (
      <p className="text-sm text-gray-12">
        {t('sdkProjectsLong', { count: set.sdkProjectCount })}
      </p>
    );
  }
  const projects = set.projectIds.flatMap((pid) => {
    const p = pieceSetsUtils.project(pid);
    return p ? [p] : [];
  });
  return (
    <>
      {set.isDefault && (
        <p className="text-sm text-gray-11">
          {t('Every project not on another policy')}
        </p>
      )}
      {projects.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {projects.slice(0, 6).map((p) => (
            <span
              key={p.id}
              className="flex items-center gap-1.5 rounded-md border border-gray-6 p-0.5 pr-2 text-sm text-gray-12"
            >
              <ProjectAvatar project={p} />
              {p.name}
            </span>
          ))}
          {projects.length > 6 && (
            <span className="flex items-center px-1 text-sm text-gray-11">
              {t('+{count} more', { count: projects.length - 6 })}
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-11">{t('No projects yet')}</p>
      )}
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={onChange}
      >
        {t('Change projects')}
      </Button>
    </>
  );
}

function NewPiecesBlock({ set }: { set: PieceSet }) {
  const setIncludeNewPieces = usePieceSetsStore((s) => s.setIncludeNewPieces);
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span className="text-sm text-gray-12">{t('Allow automatically')}</span>
      <Switch
        aria-label={t('Allow new pieces automatically')}
        checked={set.includeNewPieces}
        onCheckedChange={(include) => {
          setIncludeNewPieces({ setId: set.id, include });
          toast(
            include
              ? t('New pieces will be allowed on {name}', { name: set.name })
              : t('New pieces will be blocked on {name}', { name: set.name }),
          );
        }}
      />
    </label>
  );
}

function RequiredBlock({ set, onEdit }: { set: PieceSet; onEdit: () => void }) {
  const setRequired = usePieceSetsStore((s) => s.setRequired);
  return (
    <>
      <PublishingRuleSentence
        count={set.required.length}
        mode={set.requiredMode}
        onModeChange={(mode) => {
          setRequired({ setId: set.id, required: set.required, mode });
          toast(
            mode === 'all'
              ? t('Flows now need all of these actions')
              : t('Flows now need at least one of these actions'),
          );
        }}
      />
      {set.required.length > 0 && (
        <ul className="flex flex-col gap-2">
          {set.required.map((r) => {
            const p = pieceSetsUtils.piece(r.pieceId);
            return p ? (
              <li
                key={`${r.pieceId}-${r.action}`}
                className="flex min-w-0 items-center gap-2.5 text-sm"
              >
                <PieceLogo piece={p} size="xs" />
                <span className="truncate text-gray-12">
                  {r.action}
                  <span className="text-gray-11"> · {p.name}</span>
                </span>
              </li>
            ) : null;
          })}
        </ul>
      )}
      <Button
        variant="outline"
        size="sm"
        className="self-start"
        onClick={onEdit}
      >
        {set.required.length === 0 ? t('Require an action') : t('Edit actions')}
      </Button>
    </>
  );
}

type StatusFilter = 'all' | 'allowed' | 'blocked' | 'limited';
type PieceRow = {
  piece: CatalogPiece;
  allowed: boolean;
  limited: boolean;
  actions: number;
  triggers: number;
  required: number;
  flows: number;
};
