import { PieceSelectionMode, PieceSet } from '@activepieces/shared';
import { t } from 'i18next';
import { Boxes, Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import {
  AdminEmpty,
  AdminFetchErrorState,
  AdminPage,
  AdminPageHeader,
  InstantSwitch,
  SettingsPanel,
  adminPageResources,
  ConfirmDialog,
} from '@/app/components/admin';
import { ProjectAvatar } from '@/app/routes/platform/infra/workers/project-avatar';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
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
import {
  ChangePieceSet,
  pieceSetChanges,
  pieceSetMutations,
  pieceSetQueries,
  pieceSetTerms,
  usePieceSetChange,
} from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';
import { formatUtils } from '@/lib/format-utils';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { DuplicatePieceSetDialog } from './duplicate-piece-set-dialog';
import { EditPieceSetDialog } from './edit-piece-set-dialog';
import { PieceSetPiecesTab } from './piece-set-pieces-tab';
import {
  PieceSetProjectsDialog,
  usePieceSetProjects,
} from './piece-set-projects-dialog';
import { pieceSetSamples, SampleProject } from './piece-set-samples';
import { pieceSetSummary } from './piece-set-summary';
import { RailSection, SkeletonRows, savedOrThrow } from './policy-ui';
import {
  PublishingRuleSentence,
  RequiredActionsList,
  RequiredActionsSheet,
} from './required-actions';

const PieceSetDetailsPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const { platform } = platformHooks.useCurrentPlatform();
  if (!platform.plan.managePiecesEnabled) {
    return <SamplePieceSetDetails id={id} />;
  }
  return <LivePieceSetDetails id={id} />;
};

function LivePieceSetDetails({ id }: { id: string }) {
  const {
    data: pieceSet,
    isLoading,
    isError,
    error,
    refetch,
  } = pieceSetQueries.usePieceSet(id);

  if (api.isError(error) && error.response?.status === 404) {
    return (
      <AdminPage>
        <AdminPageHeader
          back={backLink()}
          title={pieceSetTerms.get().titleSingular}
        />
        <AdminEmpty
          icon={<Boxes />}
          title={t('This {term} no longer exists', pieceSetTerms.get())}
          description={t(
            'It may have been deleted. Pick another {term} from the list.',
            pieceSetTerms.get(),
          )}
          action={
            <Button variant="outline" asChild>
              <Link to={backLink().to}>
                {t('All {terms}', pieceSetTerms.get())}
              </Link>
            </Button>
          }
        />
      </AdminPage>
    );
  }

  if (isError) {
    return (
      <AdminPage>
        <AdminPageHeader
          back={backLink()}
          title={pieceSetTerms.get().titleSingular}
        />
        <SettingsPanel flush>
          <AdminFetchErrorState
            entity={t('this {term}', pieceSetTerms.get())}
            onRetry={refetch}
          />
        </SettingsPanel>
      </AdminPage>
    );
  }

  if (isLoading || !pieceSet) {
    return <PieceSetDetailsSkeleton />;
  }

  return <LivePieceSetEditor pieceSet={pieceSet} />;
}

function LivePieceSetEditor({ pieceSet }: { pieceSet: PieceSet }) {
  const change = usePieceSetChange(pieceSet.id);
  const { assignedProjects, isLoading, isError, refetch } =
    usePieceSetProjects(pieceSet);
  return (
    <PieceSetDetails
      pieceSet={pieceSet}
      onChange={change}
      assignedProjects={assignedProjects}
      projectsLoading={isLoading}
      projectsFailed={isError}
      onRetryProjects={refetch}
    />
  );
}

function SamplePieceSetDetails({ id }: { id: string }) {
  const { pieces, isLoading } = piecesHooks.usePlatformCatalog();
  if (isLoading) {
    return <PieceSetDetailsSkeleton />;
  }
  const sample = pieceSetSamples.samplePieceSet({
    id,
    pieceNames: (pieces ?? []).map((piece) => piece.name),
  });
  if (!sample) {
    return <Navigate to={backLink().to} replace />;
  }
  return (
    <PieceSetDetails
      pieceSet={sample}
      onChange={async () => false}
      assignedProjects={pieceSetSamples.sampleProjects(sample.id)}
      projectsLoading={false}
      projectsFailed={false}
    />
  );
}

function PieceSetDetailsSkeleton() {
  return (
    <AdminPage>
      <AdminPageHeader
        back={backLink()}
        title={<Skeleton className="h-8 w-48" />}
        description={<Skeleton className="h-4 w-72" />}
      />
      <DetailsColumns
        main={
          <SettingsPanel flush>
            <div className="flex flex-col gap-2 p-5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="flex items-center gap-3 p-5">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-64" />
            </div>
            <div className="flex flex-col px-4 py-1">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="flex h-12 items-center gap-3">
                  <Skeleton className="size-4 rounded-sm" />
                  <Skeleton className="size-6 rounded-md" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="ml-auto h-5 w-9 rounded-full" />
                </div>
              ))}
            </div>
          </SettingsPanel>
        }
        aside={
          <SettingsPanel flush>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex flex-col gap-3 p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </SettingsPanel>
        }
      />
    </AdminPage>
  );
}

function PieceSetDetails({
  pieceSet,
  onChange,
  assignedProjects,
  projectsLoading,
  projectsFailed,
  onRetryProjects,
}: {
  pieceSet: PieceSet;
  onChange: ChangePieceSet;
  assignedProjects: SampleProject[];
  projectsLoading: boolean;
  projectsFailed: boolean;
  onRetryProjects?: () => unknown;
}) {
  const { platform } = platformHooks.useCurrentPlatform();
  const navigate = useNavigate();
  const [assigning, setAssigning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingRequired, setEditingRequired] = useState(false);
  const { pieces, isLoading: piecesLoading } = piecesHooks.usePlatformCatalog();
  const { mutateAsync: deleteSet } = pieceSetMutations.useDeletePieceSet();

  const includesNewPieces =
    pieceSet.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL;
  const requiredCount = pieceSetChanges.countRequiredActions(pieceSet.config);
  const requiredMode = pieceSet.config.requiredActions.mode;

  const piecesFailed = !piecesLoading && !pieces;
  const toggleNewPieces = (include: boolean) => {
    if (!pieces) {
      return Promise.reject(
        mutationFeedback.userError(
          t('The pieces list did not load. Refresh the page and try again.'),
        ),
      );
    }
    return savedOrThrow(
      onChange({
        type: 'newPieces',
        include,
        knownPieceNames: pieces.map((piece) => piece.name),
      }),
    );
  };

  const metaParts = [
    pieceSet.key
      ? t('Key {embedKey}', { embedKey: pieceSet.key })
      : t('No key'),
    projectsLoading || projectsFailed
      ? null
      : t('{count, plural, =1 {1 project} other {# projects}}', {
          count: assignedProjects.length,
        }),
    t('Updated {date}', {
      date: formatUtils.formatDate(new Date(pieceSet.updated)),
    }),
  ].filter((part) => part !== null);

  return (
    <AdminPage>
      <AdminPageHeader
        back={backLink()}
        title={pieceSet.name}
        badge={
          pieceSet.isDefault ? (
            <Badge variant="outline">{t('Default')}</Badge>
          ) : undefined
        }
        description={
          <div className="flex flex-col gap-1">
            <span className="text-gray-12">
              {[
                pieceSetSummary.newPiecesStance(pieceSet),
                pieceSetSummary.describe(pieceSet),
              ].join(' · ')}
            </span>
            <span>{metaParts.join(' · ')}</span>
          </div>
        }
        resources={adminPageResources.pieces}
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
            <DropdownMenuItem
              {...adminControl(AdminControl.PIECE_SETS_DUPLICATE_OPEN)}
              onSelect={() => setDuplicating(true)}
            >
              <Copy />
              {t('Duplicate')}
            </DropdownMenuItem>
            {!pieceSet.isDefault && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  {...adminControl(AdminControl.PIECE_SETS_DELETE_OPEN)}
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
        <Button
          {...adminControl(AdminControl.PIECE_SETS_EDIT_OPEN)}
          variant="outline"
          onClick={() => setEditing(true)}
        >
          <Pencil />
          {t('Edit details')}
        </Button>
      </AdminPageHeader>

      <DetailsColumns
        main={<PieceSetPiecesTab pieceSet={pieceSet} onChange={onChange} />}
        aside={
          <SettingsPanel flush>
            <RailSection title={t('New pieces')}>
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm text-gray-12">
                    {t('Show automatically')}
                  </span>
                  <span
                    id={NEW_PIECES_HINT_ID}
                    className="text-xs text-gray-11"
                  >
                    {piecesFailed
                      ? t(
                          'The pieces list did not load. Refresh the page to change this.',
                        )
                      : includesNewPieces
                      ? t('Pieces installed later are shown in the builder.')
                      : t(
                          'Pieces installed later stay hidden until you show them.',
                        )}
                  </span>
                </span>
                <InstantSwitch
                  controlId={AdminControl.PIECE_SETS_NEW_PIECES_TOGGLE}
                  aria-label={t('Show new pieces automatically')}
                  aria-describedby={NEW_PIECES_HINT_ID}
                  checked={includesNewPieces}
                  disabled={piecesLoading || piecesFailed}
                  onCheckedChange={toggleNewPieces}
                />
              </label>
            </RailSection>

            <RailSection title={t('Projects')}>
              {pieceSet.isDefault && (
                <p className="text-sm text-gray-11">
                  {t(
                    "Projects without another {term} use this one, and new projects start here. It can't be deleted, and projects can't be removed from it: move them to another {term} instead.",
                    pieceSetTerms.get(),
                  )}
                </p>
              )}
              {platform.plan.embeddingEnabled && (
                <p className="text-xs text-gray-11">
                  {t(
                    'Embedded projects get their {term} from the embed token at each sign-in. Changes here last until their next sign-in.',
                    pieceSetTerms.get(),
                  )}
                </p>
              )}
              {projectsFailed ? (
                <AdminFetchErrorState
                  entity={t('projects')}
                  onRetry={onRetryProjects}
                />
              ) : projectsLoading ? (
                <SkeletonRows count={2} className="h-7 rounded-lg" />
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
                    {t('No project uses this {term} yet.', pieceSetTerms.get())}
                  </p>
                )
              )}
              <Button
                {...adminControl(AdminControl.PIECE_SETS_PROJECTS_OPEN)}
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setAssigning(true)}
              >
                {t('Assign projects')}
              </Button>
            </RailSection>

            <RailSection title={t('Publishing rule')}>
              <PublishingRuleSentence
                count={requiredCount}
                mode={requiredMode}
                onChange={onChange}
              />
              <RequiredActionsList pieceSet={pieceSet} onChange={onChange} />
              <Button
                {...adminControl(AdminControl.PIECE_SETS_REQUIRED_OPEN)}
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => setEditingRequired(true)}
              >
                {requiredCount === 0
                  ? t('Require an action')
                  : t('Edit actions')}
              </Button>
              <Link
                to="/platform/pieces/required-actions"
                className="text-sm text-gray-11 underline-offset-4 hover:text-gray-12 hover:underline"
              >
                {t('See the rule of every {term}', pieceSetTerms.get())}
              </Link>
            </RailSection>

            <RailSection title={t('Embed key')}>
              {pieceSet.key ? (
                <CopyToClipboardInput textToCopy={pieceSet.key} useInput />
              ) : (
                <p className="text-sm text-gray-11">
                  {t(
                    'No embed key. Add one in Edit details to use this {term} from the embed SDK.',
                    pieceSetTerms.get(),
                  )}
                </p>
              )}
            </RailSection>
          </SettingsPanel>
        }
      />

      <RequiredActionsSheet
        pieceSet={pieceSet}
        open={editingRequired}
        onOpenChange={setEditingRequired}
        onChange={onChange}
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
        description={t(
          'The {term} is removed from the platform.',
          pieceSetTerms.get(),
        )}
        consequence={
          projectsLoading || projectsFailed
            ? t('Its projects move to the Default {term}.', pieceSetTerms.get())
            : t(
                '{count, plural, =0 {No projects use this {term}.} =1 {1 project moves to the Default {term}.} other {# projects move to the Default {term}.}}',
                { ...pieceSetTerms.get(), count: assignedProjects.length },
              )
        }
        confirmLabel={t('Delete {term}', pieceSetTerms.get())}
        controlId={AdminControl.PIECE_SETS_DELETE_CONFIRM}
        successMessage={t('{name} deleted', { name: pieceSet.name })}
        onConfirm={async () => {
          await deleteSet(pieceSet.id);
          navigate(backLink().to);
        }}
      />
    </AdminPage>
  );
}

function DetailsColumns({
  main,
  aside,
}: {
  main: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex min-w-0 flex-col gap-6">{main}</div>
      <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-6">
        {aside}
      </aside>
    </div>
  );
}

function backLink() {
  return {
    to: '/platform/pieces/piece-sets',
    label: pieceSetTerms.get().title,
  };
}

PieceSetDetailsPage.displayName = 'PieceSetDetailsPage';
export { PieceSetDetailsPage };

const MAX_PROJECT_CHIPS = 8;
const NEW_PIECES_HINT_ID = 'piece-set-new-pieces-hint';
