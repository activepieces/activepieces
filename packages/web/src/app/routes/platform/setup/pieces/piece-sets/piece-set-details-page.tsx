import { PieceSelectionMode, PieceSet } from '@activepieces/shared';
import { t } from 'i18next';
import { Boxes, Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  AdminEmpty,
  AdminPage,
  AdminPageHeader,
  SettingsPanel,
  adminPageResources,
} from '@/app/components/admin';
import { ProjectAvatar } from '@/app/routes/platform/infra/workers/project-avatar';
import { PlanFeatureSample } from '@/app/routes/platform/plan-feature-sample';
import { CopyToClipboardInput } from '@/components/custom/clipboard/copy-to-clipboard';
import { DataFetchErrorState } from '@/components/custom/data-fetch-error-state';
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
import {
  ChangePieceSet,
  pieceSetChanges,
  pieceSetMutations,
  pieceSetQueries,
  pieceSetTerms,
} from '@/features/piece-sets';
import { piecesHooks } from '@/features/pieces';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { api } from '@/lib/api';
import { formatUtils } from '@/lib/format-utils';

import { DuplicatePieceSetDialog } from './duplicate-piece-set-dialog';
import { EditPieceSetDialog } from './edit-piece-set-dialog';
import { PieceSetPiecesTab } from './piece-set-pieces-tab';
import {
  PieceSetProjectsDialog,
  usePieceSetProjects,
} from './piece-set-projects-dialog';
import { pieceSetSamples, SampleProject } from './piece-set-samples';
import { PolicyConfirmDialog, RailSection, SkeletonRows } from './policy-ui';
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
          title={t('{titleSingular}', pieceSetTerms.get())}
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
          title={t('{titleSingular}', pieceSetTerms.get())}
        />
        <SettingsPanel flush>
          <DataFetchErrorState
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
  const { mutateAsync } = pieceSetMutations.useChangePieceSet(pieceSet.id);
  const { assignedProjects, isLoading } = usePieceSetProjects(pieceSet);
  const change: ChangePieceSet = (next) =>
    mutateAsync({ change: next }).then(
      () => true,
      () => false,
    );
  return (
    <PieceSetDetails
      pieceSet={pieceSet}
      onChange={change}
      assignedProjects={assignedProjects}
      projectsLoading={isLoading}
    />
  );
}

function SamplePieceSetDetails({ id }: { id: string }) {
  const { pieces, isLoading } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
  });
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
    <PlanFeatureSample feature="piecePolicies">
      <PieceSetDetails
        pieceSet={sample}
        onChange={async () => false}
        assignedProjects={pieceSetSamples.sampleProjects(sample.id)}
        projectsLoading={false}
      />
    </PlanFeatureSample>
  );
}

function PieceSetDetailsSkeleton() {
  return (
    <AdminPage>
      <AdminPageHeader
        back={backLink()}
        title={<Skeleton className="h-8 w-48" />}
      />
      <DetailsColumns
        main={<SkeletonRows count={8} className="h-12 rounded-xl" />}
        aside={<SkeletonRows count={3} className="h-24 rounded-xl" />}
      />
    </AdminPage>
  );
}

function PieceSetDetails({
  pieceSet,
  onChange,
  assignedProjects,
  projectsLoading,
}: {
  pieceSet: PieceSet;
  onChange: ChangePieceSet;
  assignedProjects: SampleProject[];
  projectsLoading: boolean;
}) {
  const navigate = useNavigate();
  const [assigning, setAssigning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingRequired, setEditingRequired] = useState(false);
  const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({
    includeHidden: true,
    isTableQuery: true,
    skipProjectFilter: true,
  });
  const { mutateAsync: deleteSet } = pieceSetMutations.useDeletePieceSet();

  const includesNewPieces =
    pieceSet.config.pieces.mode === PieceSelectionMode.INCLUDE_ALL;
  const requiredCount = pieceSetChanges.countRequiredActions(pieceSet.config);
  const requiredMode = pieceSet.config.requiredActions.mode;

  const toggleNewPieces = (include: boolean) => {
    if (!pieces) return;
    onChange({
      type: 'newPieces',
      include,
      knownPieceNames: pieces.map((piece) => piece.name),
    }).catch(() => undefined);
  };

  const { platform } = platformHooks.useCurrentPlatform();
  const showKey = platform.plan.embeddingEnabled;
  const metaParts = [
    showKey
      ? pieceSet.key
        ? t('Key {key}', { key: pieceSet.key })
        : t('No key')
      : null,
    projectsLoading
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
        description={metaParts.join(' · ')}
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
            <RailSection title={t('Applies to')}>
              {pieceSet.isDefault && (
                <p className="text-sm text-gray-11">
                  {t(
                    'Every project not on another {term}.',
                    pieceSetTerms.get(),
                  )}
                </p>
              )}
              {projectsLoading ? (
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
                      ? t(
                          'Pieces installed later are allowed on this {term}.',
                          pieceSetTerms.get(),
                        )
                      : t(
                          'Pieces installed later stay blocked until you allow them.',
                        )}
                  </span>
                </span>
                <Switch
                  {...adminControl(AdminControl.PIECE_SETS_NEW_PIECES_TOGGLE)}
                  aria-label={t('Allow new pieces')}
                  checked={includesNewPieces}
                  disabled={piecesLoading}
                  onCheckedChange={toggleNewPieces}
                />
              </label>
            </RailSection>

            <RailSection title={t('Publishing rule')}>
              <PublishingRuleSentence
                count={requiredCount}
                mode={requiredMode}
                onModeChange={(mode) => {
                  if (mode !== requiredMode) {
                    onChange({ type: 'requiredMode', mode }).catch(
                      () => undefined,
                    );
                  }
                }}
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
            </RailSection>

            {showKey && (
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
            )}
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
      <PolicyConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={t('Delete {name}?', { name: pieceSet.name })}
        description={t(
          'The {term} is removed from the platform.',
          pieceSetTerms.get(),
        )}
        consequence={
          projectsLoading
            ? t('Its projects move to the Default {term}.', pieceSetTerms.get())
            : t(
                '{count, plural, =0 {No projects use this {term}.} =1 {1 project moves to the Default {term}.} other {# projects move to the Default {term}.}}',
                { ...pieceSetTerms.get(), count: assignedProjects.length },
              )
        }
        typeToConfirm={
          !projectsLoading && assignedProjects.length === 0
            ? undefined
            : pieceSet.name
        }
        confirmLabel={t('Delete {term}', pieceSetTerms.get())}
        controlId={AdminControl.PIECE_SETS_DELETE_CONFIRM}
        onConfirm={async () => {
          await deleteSet(pieceSet.id);
          toast.success(t('{name} deleted', { name: pieceSet.name }));
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
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-6">{main}</div>
      <aside className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-6">
        {aside}
      </aside>
    </div>
  );
}

function backLink() {
  return {
    to: '/platform/pieces/piece-sets',
    label: t('{title}', pieceSetTerms.get()),
  };
}

PieceSetDetailsPage.displayName = 'PieceSetDetailsPage';
export { PieceSetDetailsPage };

const MAX_PROJECT_CHIPS = 8;
