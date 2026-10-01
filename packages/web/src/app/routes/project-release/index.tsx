import { Permission } from '@activepieces/core-utils';
import { ProjectRelease, ProjectReleaseType } from '@activepieces/shared';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  ChevronDown,
  FolderOpenDot,
  GitBranch,
  LucideIcon,
  Package,
  Plus,
  RotateCcw,
  Undo2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  ProjectHeaderActions,
  ProjectHeaderMeta,
} from '@/app/components/project-layout/project-header-slots';
import { DataTable, RowDataWithActions } from '@/components/custom/data-table';
import { DataTableColumnHeader } from '@/components/custom/data-table/data-table-column-header';
import { FormattedDate } from '@/components/custom/formatted-date';
import { Page } from '@/components/custom/page';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { TextWithTooltip } from '@/components/custom/text-with-tooltip';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmptyMedia } from '@/components/ui/empty';
import { projectReleaseQueries } from '@/features/project-releases';
import { projectCollectionUtils } from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';

import { ApplyButton } from './apply-plan';
import { PushEverythingDialog } from './push-everything-dialog';
import { SelectionButton } from './selection-dialog';

const ProjectReleasesPage = () => {
  const navigate = useNavigate();
  const { checkAccess } = useAuthorization();
  const doesUserHavePermissionToWriteRelease = checkAccess(
    Permission.WRITE_PROJECT_RELEASE,
  );
  const { data, isLoading, isError, refetch } =
    projectReleaseQueries.useProjectReleases();
  const { data: projects } = projectCollectionUtils.useAll();
  const { project } = projectCollectionUtils.useCurrentProject();
  const sourceLabel = (release: ProjectRelease) => {
    switch (release.type) {
      case ProjectReleaseType.GIT:
        return t('From Git');
      case ProjectReleaseType.PROJECT:
        return t('From {project}', {
          project:
            projects?.find((item) => item.id === release.projectId)
              ?.displayName ?? t('another project'),
        });
      default:
        return t('Rollback');
    }
  };
  const columns: ColumnDef<RowDataWithActions<ProjectRelease>>[] = [
    {
      accessorKey: 'name',
      size: 480,
      accessorFn: (row) => row.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Release')} />
      ),
      cell: ({ row }) => {
        const Icon = SOURCE_ICONS[row.original.type];
        const meta = [
          sourceLabel(row.original),
          row.original.importedByUser?.email,
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gray-3 text-gray-11 [&_svg]:size-4">
              <Icon />
            </span>
            <div className="flex min-w-0 flex-col">
              <TextWithTooltip tooltipMessage={row.original.name}>
                <span className="font-medium text-gray-12">
                  {row.original.name}
                </span>
              </TextWithTooltip>
              <span className="truncate text-xs text-gray-11">{meta}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'created',
      size: 160,
      accessorFn: (row) => row.created,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Applied')}
          className="justify-end"
        />
      ),
      cell: ({ row }) => (
        <div className="flex justify-end">
          <FormattedDate
            date={new Date(row.original.created)}
            className="text-gray-11 tabular-nums"
          />
        </div>
      ),
    },
    {
      accessorKey: 'actions',
      id: 'select',
      size: 128,
      header: () => <span className="sr-only">{t('Actions')}</span>,
      cell: ({ row }) => {
        return (
          <div
            className="flex items-center justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <PermissionNeededTooltip
              hasPermission={doesUserHavePermissionToWriteRelease}
            >
              <ApplyButton
                onSuccess={refetch}
                variant="outline"
                size="sm"
                disabled={!doesUserHavePermissionToWriteRelease}
                request={{
                  projectId: authenticationSession.getProjectId()!,
                  type: ProjectReleaseType.ROLLBACK,
                  projectReleaseId: row.original.id,
                }}
                defaultName={row.original.name}
              >
                <Undo2 />
                {t('Roll back')}
              </ApplyButton>
            </PermissionNeededTooltip>
          </div>
        );
      },
    },
  ];

  return (
    <Page>
      <ProjectHeaderMeta>
        {t(
          'Bring flows into {project} from Git or another project, and see what changes before it applies.',
          { project: project.displayName },
        )}
      </ProjectHeaderMeta>
      <ProjectHeaderActions>
        <PushEverythingDialog>
          <Button
            variant="outline"
            disabled={!doesUserHavePermissionToWriteRelease}
          >
            {t('Push everything')}
          </Button>
        </PushEverythingDialog>
        <PermissionNeededTooltip
          hasPermission={doesUserHavePermissionToWriteRelease}
        >
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button disabled={!doesUserHavePermissionToWriteRelease}>
                <Plus />
                {t('New release')}
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <ApplyButton
                  variant="ghost"
                  onSuccess={refetch}
                  className="w-full justify-start"
                  request={{
                    type: ProjectReleaseType.GIT,
                    projectId: authenticationSession.getProjectId()!,
                  }}
                >
                  <GitBranch />
                  <span>{t('From Git')}</span>
                </ApplyButton>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <SelectionButton
                  variant="ghost"
                  onSuccess={refetch}
                  className="w-full justify-start"
                  ReleaseType={ProjectReleaseType.PROJECT}
                >
                  <FolderOpenDot />
                  <span>{t('From another project')}</span>
                </SelectionButton>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionNeededTooltip>
      </ProjectHeaderActions>
      <DataTable
        emptyStateTextTitle={t('No releases yet')}
        emptyStateTextDescription={t(
          'A release brings flows in from Git or another project, and shows what will change before it applies.',
        )}
        emptyStateIcon={
          <EmptyMedia variant="icon">
            <Package />
          </EmptyMedia>
        }
        columns={columns}
        page={data}
        isLoading={isLoading}
        isError={isError}
        errorStateEntity={t('releases')}
        onRetry={refetch}
        onRowClick={(row) => {
          navigate(`/releases/${row.id}`);
        }}
      />
    </Page>
  );
};

const SOURCE_ICONS: Record<ProjectReleaseType, LucideIcon> = {
  [ProjectReleaseType.GIT]: GitBranch,
  [ProjectReleaseType.PROJECT]: FolderOpenDot,
  [ProjectReleaseType.ROLLBACK]: RotateCcw,
};

ProjectReleasesPage.displayName = 'ProjectReleasesPage';
export { ProjectReleasesPage };
