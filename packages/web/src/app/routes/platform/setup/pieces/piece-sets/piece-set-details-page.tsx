import {
  PieceSelection,
  PieceSelectionMode,
  PieceSet,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Copy, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { ProjectAvatar } from '@/app/routes/platform/infra/workers/project-avatar';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { listFormat } from '@/components/custom/list/list-format';
import { Page, PageColumns, PageHeader } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { DangerZone } from '@/components/custom/settings-parts';
import { SkeletonList } from '@/components/custom/skeleton-list';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { pieceSetMutations, pieceSetQueries } from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';

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
  const {
    data: pieceSet,
    isLoading,
    isError,
    refetch,
  } = pieceSetQueries.usePieceSet(id ?? '');

  if (!platform.plan.managePiecesEnabled) {
    return <Navigate to="/platform/pieces/piece-sets" replace />;
  }

  if (isError) {
    return (
      <Page>
        <PageHeader back={backLink()} title={t('Piece set')} />
        <Panel flush>
          <DataFetchErrorState entity={t('this piece set')} onRetry={refetch} />
        </Panel>
      </Page>
    );
  }

  if (isLoading || !pieceSet) {
    return (
      <Page>
        <PageHeader
          back={backLink()}
          title={<Skeleton className="h-8 w-48" />}
        />
        <PageColumns
          main={<SkeletonList numberOfItems={8} className="h-12 rounded-xl" />}
          aside={
            <SkeletonList numberOfItems={3} className="h-24 rounded-2xl" />
          }
        />
      </Page>
    );
  }

  return <PieceSetDetails pieceSet={pieceSet} />;
};

function PieceSetDetails({ pieceSet }: { pieceSet: PieceSet }) {
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

  const metaParts = [
    pieceSet.key ? t('Key {key}', { key: pieceSet.key }) : t('No key'),
    projectsLoading
      ? null
      : t('{count, plural, =1 {1 project} other {# projects}}', {
          count: assignedProjects.length,
        }),
    t('Updated {date}', {
      date: listFormat.relativeDate(pieceSet.updated).toLowerCase(),
    }),
  ].filter((part) => part !== null);

  return (
    <Page>
      <PageHeader
        back={backLink()}
        title={pieceSet.name}
        badge={
          pieceSet.isDefault ? (
            <Badge variant="outline">{t('Default')}</Badge>
          ) : undefined
        }
        description={<span>{metaParts.join(' · ')}</span>}
      >
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
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Pencil />
              {t('Edit details')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setDuplicating(true)}>
              <Copy />
              {t('Duplicate')}
            </DropdownMenuItem>
            {!pieceSet.isDefault && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleting(true)}
                >
                  <Trash2 />
                  {t('Delete')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button onClick={() => setAssigning(true)}>
          <Plus />
          {t('Assign projects')}
        </Button>
      </PageHeader>

      <PageColumns
        main={<PieceSetPiecesTab pieceSet={pieceSet} />}
        aside={
          <>
            <Panel flush title={t('New pieces')}>
              <SettingRows>
                <SettingRow
                  title={t('Allow new pieces')}
                  description={
                    includesNewPieces
                      ? t('Pieces installed later are allowed on this set.')
                      : t(
                          'Pieces installed later stay blocked until you allow them.',
                        )
                  }
                >
                  <Switch
                    aria-label={t('Allow new pieces')}
                    checked={includesNewPieces}
                    disabled={isPending || piecesLoading}
                    onCheckedChange={toggleNewPieces}
                  />
                </SettingRow>
              </SettingRows>
            </Panel>

            <Panel
              flush
              title={t('Projects on this set')}
              description={
                pieceSet.isDefault
                  ? t('Projects without a set of their own use this one.')
                  : undefined
              }
            >
              {projectsLoading ? (
                <div className="p-4">
                  <SkeletonList numberOfItems={3} className="h-8 rounded-xl" />
                </div>
              ) : assignedProjects.length === 0 ? (
                <div className="flex flex-col items-start gap-3 p-4">
                  <p className="text-sm text-gray-11">
                    {t('No project uses this set yet.')}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssigning(true)}
                  >
                    <Plus />
                    {t('Assign projects')}
                  </Button>
                </div>
              ) : (
                <ul className="flex flex-col">
                  {assignedProjects.map((project) => (
                    <li
                      key={project.id}
                      className="flex h-10 min-w-0 items-center gap-2.5 border-t border-gray-6 px-4 first:border-t-0"
                    >
                      <ProjectAvatar project={project} size="sm" />
                      <TextWithTooltip tooltipMessage={project.displayName}>
                        <span className="min-w-0 truncate text-sm font-medium text-gray-12">
                          {project.displayName}
                        </span>
                      </TextWithTooltip>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {!pieceSet.isDefault && (
              <DangerZone
                actions={[
                  {
                    title: t('Delete this set'),
                    description: t(
                      'Projects on this set move to the default set.',
                    ),
                    control: (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-danger-11 hover:text-danger-11"
                        onClick={() => setDeleting(true)}
                      >
                        {t('Delete')}
                      </Button>
                    ),
                  },
                ]}
              />
            )}
          </>
        }
      />

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

function backLink() {
  return { to: '/platform/pieces/piece-sets', label: t('Piece sets') };
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
