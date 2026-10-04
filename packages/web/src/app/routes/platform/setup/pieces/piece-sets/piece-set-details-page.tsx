import {
  PieceSelection,
  PieceSelectionMode,
  PieceSet,
  RequiredActionsMode,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Boxes, Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import { ProjectAvatar } from '@/app/routes/platform/infra/workers/project-avatar';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { ConfirmDialog } from '@/components/custom/confirm-dialog';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
import { listFormat } from '@/components/custom/list/list-format';
import { Page, PageColumns, PageHeader } from '@/components/custom/page';
import { Panel } from '@/components/custom/panel';
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
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { pieceSetMutations, pieceSetQueries } from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { api } from '@/lib/api';

import { DuplicatePieceSetDialog } from './duplicate-piece-set-dialog';
import { EditPieceSetDialog } from './edit-piece-set-dialog';
import { PieceSetPiecesTab } from './piece-set-pieces-tab';
import {
  PieceSetProjectsDialog,
  usePieceSetProjects,
} from './piece-set-projects-dialog';
import {
  PublishingRuleSentence,
  RequiredActionRow,
  RequiredActionsSheet,
} from './required-actions';

const PieceSetDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { platform } = platformHooks.useCurrentPlatform();
  const {
    data: pieceSet,
    isLoading,
    isError,
    error,
    refetch,
  } = pieceSetQueries.usePieceSet(id ?? '');

  if (!platform.plan.managePiecesEnabled) {
    return <Navigate to="/platform/pieces/piece-sets" replace />;
  }

  if (api.isError(error) && error.response?.status === 404) {
    return (
      <Page>
        <PageHeader back={backLink()} title={t('Piece set')} />
        <Empty className="rounded-2xl bg-panel shadow-edge">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Boxes />
            </EmptyMedia>
            <EmptyTitle>{t('This piece set no longer exists')}</EmptyTitle>
            <EmptyDescription>
              {t('It may have been deleted. Pick another set from the list.')}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" asChild>
              <Link to={backLink().to}>{t('All piece sets')}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </Page>
    );
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

  const [editingRequired, setEditingRequired] = useState(false);
  const includesNewPieces =
    pieceSet.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL;
  const requiredActions = pieceSet.config.requiredActions ?? [];
  const requiredMode =
    pieceSet.config.requiredActionsMode ?? RequiredActionsMode.ANY;

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
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil />
          {t('Edit details')}
        </Button>
      </PageHeader>

      <PageColumns
        main={<PieceSetPiecesTab pieceSet={pieceSet} />}
        aside={
          <Panel flush>
            <RailSection title={t('Applies to')}>
              {pieceSet.isDefault && (
                <p className="text-sm text-gray-11">
                  {t('Every project not on another set.')}
                </p>
              )}
              {projectsLoading ? (
                <SkeletonList numberOfItems={2} className="h-7 rounded-lg" />
              ) : assignedProjects.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                  {assignedProjects
                    .slice(0, MAX_PROJECT_CHIPS)
                    .map((project) => (
                      <li
                        key={project.id}
                        className="flex h-7 max-w-full min-w-0 items-center gap-1.5 rounded-lg border py-0.5 pr-2 pl-0.5 text-sm text-gray-12"
                      >
                        <ProjectAvatar project={project} size="sm" />
                        <TextWithTooltip tooltipMessage={project.displayName}>
                          <span className="min-w-0 truncate">
                            {project.displayName}
                          </span>
                        </TextWithTooltip>
                      </li>
                    ))}
                  {assignedProjects.length > MAX_PROJECT_CHIPS && (
                    <li className="flex h-7 items-center px-1 text-sm text-gray-11">
                      {t('+{count} more', {
                        count: assignedProjects.length - MAX_PROJECT_CHIPS,
                      })}
                    </li>
                  )}
                </ul>
              ) : (
                !pieceSet.isDefault && (
                  <p className="text-sm text-gray-11">
                    {t('No project uses this set yet.')}
                  </p>
                )
              )}
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setAssigning(true)}
              >
                {t('Change projects')}
              </Button>
            </RailSection>

            <RailSection title={t('New pieces')}>
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm text-gray-12">
                    {t('Allow automatically')}
                  </span>
                  <span className="text-xs text-gray-11">
                    {includesNewPieces
                      ? t('Pieces installed later are allowed on this set.')
                      : t(
                          'Pieces installed later stay blocked until you allow them.',
                        )}
                  </span>
                </span>
                <Switch
                  aria-label={t('Allow new pieces')}
                  checked={includesNewPieces}
                  disabled={isPending || piecesLoading}
                  onCheckedChange={toggleNewPieces}
                />
              </label>
            </RailSection>

            <RailSection title={t('Publishing rule')}>
              <PublishingRuleSentence
                count={requiredActions.length}
                mode={requiredMode}
                onModeChange={(mode) =>
                  updateSet({
                    id: pieceSet.id,
                    request: { requiredActionsMode: mode },
                  })
                }
              />
              {requiredActions.length > 0 && (
                <ul className="flex flex-col">
                  {requiredActions.map((action) => (
                    <RequiredActionRow
                      key={`${action.pieceName}:${action.actionName}`}
                      action={action}
                    />
                  ))}
                </ul>
              )}
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setEditingRequired(true)}
              >
                {requiredActions.length === 0
                  ? t('Require an action')
                  : t('Edit actions')}
              </Button>
              <p className="text-xs text-gray-11">
                {t('Saved on the set. Publishing does not check it yet.')}
              </p>
            </RailSection>

            <RailSection title={t('Embed key')}>
              {pieceSet.key ? (
                <CopyToClipboardInput textToCopy={pieceSet.key} useInput />
              ) : (
                <p className="text-sm text-gray-11">
                  {t(
                    'No key. Add one in Edit details to use this set from the embed SDK.',
                  )}
                </p>
              )}
            </RailSection>
          </Panel>
        }
      />

      <RequiredActionsSheet
        pieceSet={pieceSet}
        open={editingRequired}
        onOpenChange={setEditingRequired}
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

function RailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-t p-5 first:border-t-0">
      <h2 className="text-sm font-semibold text-gray-12">{title}</h2>
      {children}
    </section>
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

const MAX_PROJECT_CHIPS = 8;
