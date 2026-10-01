import { PieceSelection, PieceSelectionMode } from '@activepieces/shared';
import { t } from 'i18next';
import { Copy, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { ProjectAvatar } from '@/app/routes/platform/infra/workers/project-avatar';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { Page, PageHeader } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { pieceSetMutations, pieceSetQueries } from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';

import { DuplicatePieceSetDialog } from './duplicate-piece-set-dialog';
import { EditPieceSetDialog } from './edit-piece-set-dialog';
import { PieceSetPiecesTab } from './piece-set-pieces-tab';
import {
  PieceSetProjectsDialog,
  usePieceSetProjects,
} from './piece-set-projects-dialog';

const PieceSetDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { platform } = platformHooks.useCurrentPlatform();
  const { data: pieceSet, isLoading } = pieceSetQueries.usePieceSet(id ?? '');

  if (!platform.plan.managePiecesEnabled) {
    return <Navigate to="/platform/pieces/piece-sets" replace />;
  }

  if (isLoading || !pieceSet) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <PieceSetDetails pieceSet={pieceSet} />;
};

function PieceSetDetails({ pieceSet }: { pieceSet: PieceSetValue }) {
  const navigate = useNavigate();
  const [assigning, setAssigning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
  });
  const { assignedProjects, isLoading: projectsLoading } =
    usePieceSetProjects(pieceSet);
  const { mutate: updateSet, isPending } =
    pieceSetMutations.useUpdatePieceSet();
  const { mutateAsync: deleteSet } = pieceSetMutations.useDeletePieceSet();

  const includesNewPieces =
    pieceSet.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL;

  const toggleNewPieces = (include: boolean) => {
    if (!pieces) return;
    updateSet({
      id: pieceSet.id,
      request: {
        pieces: flipSelectionMode({
          current: pieceSet.config.pieces,
          include,
          knownPieceNames: pieces.map((p) => p.name),
        }),
      },
    });
  };

  return (
    <Page>
      <PageHeader
        back={{ to: '/platform/pieces/piece-sets', label: t('Piece sets') }}
        title={pieceSet.name}
        badge={
          pieceSet.isDefault ? (
            <Badge variant="outline">{t('Default')}</Badge>
          ) : undefined
        }
        description={
          <span className="flex flex-wrap items-center gap-x-2 tabular-nums">
            {pieceSet.key ? (
              <span>
                {t('Key')}{' '}
                <code className="font-mono text-xs text-gray-12">
                  {pieceSet.key}
                </code>
              </span>
            ) : (
              <span>{t('No key')}</span>
            )}
            <span aria-hidden>·</span>
            <span>
              {t('{count, plural, =1 {1 project} other {# projects}}', {
                count: assignedProjects.length,
              })}
            </span>
            <span aria-hidden>·</span>
            <span>
              {t('Updated {date}', {
                date: formatUtils.formatDate(new Date(pieceSet.updated)),
              })}
            </span>
          </span>
        }
      >
        <Button variant="outline" onClick={() => setAssigning(true)}>
          <Users />
          {t('Assign projects')}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label={t('More actions')}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Pencil />
              {t('Edit details')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDuplicating(true)}>
              <Copy />
              {t('Duplicate')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={pieceSet.isDefault}
              onSelect={() => setDeleting(true)}
            >
              <Trash2 />
              {t('Delete set')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <PieceSetPiecesTab pieceSet={pieceSet} />
        <div className="flex min-w-0 flex-col gap-4">
          <Panel flush title={t('New pieces')}>
            <SettingRows>
              <SettingRow
                title={t('Include pieces installed later')}
                description={
                  includesNewPieces
                    ? t(
                        'A newly installed piece is allowed on this set unless you block it.',
                      )
                    : t(
                        'A newly installed piece stays blocked on this set until you allow it.',
                      )
                }
              >
                <Switch
                  aria-label={t('Include pieces installed later')}
                  checked={includesNewPieces}
                  disabled={isPending || piecesLoading}
                  onCheckedChange={toggleNewPieces}
                />
              </SettingRow>
            </SettingRows>
          </Panel>

          <Panel
            flush
            title={
              <span className="flex items-baseline gap-2">
                {t('Projects on this set')}
                <span className="text-xs font-normal text-gray-11 tabular-nums">
                  {assignedProjects.length}
                </span>
              </span>
            }
          >
            {projectsLoading ? (
              <div className="p-4">
                <SkeletonList numberOfItems={3} className="h-8 rounded-xl" />
              </div>
            ) : assignedProjects.length === 0 ? (
              <p className="p-4 text-sm text-gray-11">
                {t('No project is assigned yet.')}
              </p>
            ) : (
              <div className="flex flex-col px-1 pb-1">
                {assignedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex h-11 items-center gap-3 border-t border-gray-6 px-3 first:border-t-0"
                  >
                    <ProjectAvatar project={project} size="sm" />
                    <span className="min-w-0 truncate text-sm font-medium text-gray-12">
                      {project.displayName}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel flush title={t('Danger zone')}>
            <SettingRows>
              <SettingRow
                title={t('Delete this set')}
                description={
                  pieceSet.isDefault
                    ? t('The default set cannot be deleted.')
                    : t('Projects on this set move to the default set.')
                }
              >
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pieceSet.isDefault}
                  onClick={() => setDeleting(true)}
                >
                  <Trash2 />
                  {t('Delete')}
                </Button>
              </SettingRow>
            </SettingRows>
          </Panel>
        </div>
      </div>

      <PieceSetProjectsDialog
        pieceSet={pieceSet}
        open={assigning}
        onOpenChange={setAssigning}
      />
      {editing && (
        <EditPieceSetDialog
          open={editing}
          onOpenChange={setEditing}
          id={pieceSet.id}
          currentName={pieceSet.name}
          currentKey={pieceSet.key ?? null}
        />
      )}
      {duplicating && (
        <DuplicatePieceSetDialog
          open={duplicating}
          onOpenChange={setDuplicating}
          sourceId={pieceSet.id}
          sourceName={pieceSet.name}
        />
      )}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t('Delete {name}?', { name: pieceSet.name })}
        description={t('The set is removed from the platform.')}
        consequence={t('Projects on this set move to the default set.')}
        typeToConfirm={pieceSet.name}
        confirmLabel={t('Delete set')}
        onConfirm={async () => {
          await deleteSet(pieceSet.id);
          navigate('/platform/pieces/piece-sets');
        }}
      />
    </Page>
  );
}

function flipSelectionMode({
  current,
  include,
  knownPieceNames,
}: {
  current: PieceSelection;
  include: boolean;
  knownPieceNames: string[];
}): PieceSelection {
  const excluded = new Set(current.exceptions);
  return {
    mode: include
      ? PieceSelectionMode.INCLUDE_ALL
      : PieceSelectionMode.EXCLUDE_ALL,
    exceptions: knownPieceNames.filter((name) => !excluded.has(name)),
  };
}

PieceSetDetailsPage.displayName = 'PieceSetDetailsPage';
export { PieceSetDetailsPage };

type PieceSetValue = NonNullable<
  ReturnType<typeof pieceSetQueries.usePieceSet>['data']
>;
