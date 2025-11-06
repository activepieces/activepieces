import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import {
  ChevronDown,
  Undo2,
  GitBranch,
  RotateCcw,
  FolderOpenDot,
  Package,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { projectReleaseApi } from '@/features/project-version/lib/project-release-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { formatUtils } from '@/lib/utils';
import {
  ProjectRelease,
  ProjectReleaseType,
  Permission,
} from '@activepieces/shared';

import { ApplyButton } from './apply-plan';
import { PushEverythingDialog } from './push-everything-dialog';
import { SelectionButton } from './selection-dialog';

const ProjectReleasesPage = () => {
  const navigate = useNavigate();
  const { checkAccess } = useAuthorization();
  const doesUserHavePermissionToWriteRelease = checkAccess(
    Permission.WRITE_PROJECT_RELEASE,
  );
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['project-releases'],
    queryFn: () => projectReleaseApi.list(),
  });
  const { data: projects } = projectHooks.useProjects();
  const columns: ColumnDef<RowDataWithActions<ProjectRelease>>[] = [
    {
      accessorKey: 'name',
      accessorFn: (row) => row.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => <div className="text-left">{row.original.name}</div>,
    },
    {
      accessorKey: 'type',
      accessorFn: (row) => row.type,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Source')} />
      ),
      cell: ({ row }) => {
        const isGit = row.original.type === ProjectReleaseType.GIT;
        const isProject = row.original.type === ProjectReleaseType.PROJECT;
        return (
          <div className="flex items-center gap-2">
            {isGit ? (
              <GitBranch className="size-4" />
            ) : isProject ? (
              <div className="flex items-center gap-2">
                <FolderOpenDot className="size-4" />
                {projects?.find(
                  (project) => project.id === row.original.projectId,
                )?.displayName ?? t('Project')}
              </div>
            ) : (
              <RotateCcw className="size-4" />
            )}
            {isGit ? 'Git' : isProject ? '' : t('Rollback')}
          </div>
        );
      },
    },
    {
      accessorKey: 'created',
      accessorFn: (row) => row.created,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Imported At')} />
      ),
      cell: ({ row }) => (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      ),
    },
    {
      accessorKey: 'importedBy',
      accessorFn: (row) => row.importedBy,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Imported By')}
          className="text-center"
        />
      ),
      cell: ({ row }) => (
        <div className="text-left">{row.original.importedByUser?.email}</div>
      ),
    },
    {
      accessorKey: 'actions',
      id: 'select',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="" />
      ),
      cell: ({ row }) => {
        return (
          <div
            className="flex items-center justify-center z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ApplyButton
                  onSuccess={refetch}
                  variant="ghost"
                  className="size-8 p-0"
                  request={{
                    type: ProjectReleaseType.ROLLBACK,
                    projectReleaseId: row.original.id,
                  }}
                  defaultName={row.original.name}
                >
                  <Undo2 className="size-4" />
                </ApplyButton>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t('Rollback')}</TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex-col w-full gap-4">
      <DashboardPageHeader
        title={t('Project Releases')}
        description={
          <>
            {t(
              'Track and manage your project version history and deployments. ',
            )}
            <a
              href="https://www.activepieces.com/docs/operations/git-sync"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t('Environments & Releases')}
            </a>
          </>
        }
      ></DashboardPageHeader>
      <DataTable
        emptyStateTextTitle={t('No project releases found')}
        emptyStateTextDescription={t('Create a project release to get started')}
        emptyStateIcon={<Package className="size-14" />}
        columns={columns}
        bulkActions={[
          {
            render: () => (
              <div className="flex items-center gap-2">
                <PushEverythingDialog>
                  <Button
                    className="h-9"
                    variant="outline"
                    disabled={!doesUserHavePermissionToWriteRelease}
                  >
                    {t('Push Everything')}
                  </Button>
                </PushEverythingDialog>
                <PermissionNeededTooltip
                  hasPermission={doesUserHavePermissionToWriteRelease}
                >
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="h-9 w-full"
                        disabled={!doesUserHavePermissionToWriteRelease}
                      >
                        {t('Create Release')}
                        <ChevronDown className="h-3 w-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <ApplyButton
                          variant="ghost"
                          onSuccess={refetch}
                          className="w-full justify-start"
                          request={{ type: ProjectReleaseType.GIT }}
                        >
                          <div className="flex flex-row gap-2 items-center">
                            <GitBranch className="size-4" />
                            <span>{t('From Git')}</span>
                          </div>
                        </ApplyButton>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <SelectionButton
                          variant="ghost"
                          onSuccess={refetch}
                          className="w-full justify-start"
                          ReleaseType={ProjectReleaseType.PROJECT}
                        >
                          <div className="flex flex-row gap-2 items-center">
                            <FolderOpenDot className="size-4" />
                            <span>{t('From Project')}</span>
                          </div>
                        </SelectionButton>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </PermissionNeededTooltip>
              </div>
            ),
          },
        ]}
        page={data}
        isLoading={isLoading}
        onRowClick={(row) => {
          navigate(`/releases/${row.id}`);
        }}
      />
    </div>
  );
};

ProjectReleasesPage.displayName = 'ProjectReleasesPage';
export { ProjectReleasesPage };
