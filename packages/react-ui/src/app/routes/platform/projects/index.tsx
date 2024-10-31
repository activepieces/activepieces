import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Pencil, Plus, Trash } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { CURSOR_QUERY_PARAM, DataTable, LIMIT_QUERY_PARAM, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { projectApi } from '@/lib/project-api';
import { formatUtils, validationUtils } from '@/lib/utils';
import { ProjectWithLimits } from '@activepieces/shared';
import { TableTitle } from '../../../../components/ui/table-title';
import { NewProjectDialog } from './new-project-dialog';

const columns: ColumnDef<RowDataWithActions<ProjectWithLimits>>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Name')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.displayName}</div>;
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Created')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      );
    },
  },
  {
    accessorKey: 'members',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Members')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.usage.teamMembers}</div>;
    },
  },
  {
    accessorKey: 'tasks',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Tasks')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatNumber(row.original.usage.tasks)} /{' '}
          {formatUtils.formatNumber(row.original.plan.tasks)}
        </div>
      );
    },
  },
  {
    accessorKey: 'ai-tokens',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('AI Credits')} />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-left">
          {formatUtils.formatNumber(row.original.usage.aiTokens)} /{' '}
          {row.original.plan.aiTokens
            ? formatUtils.formatNumber(row.original.plan.aiTokens)
            : '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'externalId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('External ID')} />
    ),
    cell: ({ row }) => {
      return <div className="text-left">{row.original.externalId}</div>;
    },
  },
];
export default function ProjectsPage() {
  const { platform } = platformHooks.useCurrentPlatform();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setCurrentProject } = projectHooks.useCurrentProject();
  const navigate = useNavigate();
  const isEnabled = platform.manageProjectsEnabled;
  const { data: currentProject } = projectHooks.useCurrentProject();

  const [searchParams] = useSearchParams();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects', searchParams.toString()],
    staleTime: 0,
    queryFn: () => {
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM);
      return projectApi.list({
        cursor: cursor ?? undefined,
        limit: limit ? parseInt(limit) : undefined,
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await projectApi.delete(projectId);
    },
    onSuccess: () => {
      refetch();
    },
    onError: (error, _) => {
      toast({
        title: t('Error'),
        description: errorToastMessage(error),
        duration: 3000,
      });
    },
  });

  const errorToastMessage = (
    error: unknown,
  ): string | undefined => {
    if (validationUtils.isValidationError(error)) {
      console.error(t('Validation error'), error);
      switch (error.response?.data?.params?.message) {
        case 'PROJECT_HAS_ENABLED_FLOWS':
          return t(
            'Project has enabled flows. Please disable them first.',
          );
        case 'ACTIVE_PROJECT':
          return t(
            'This project is active. Please switch to another project first.',
          );
      }
      return undefined;
    }
  };

  return (
    <LockedFeatureGuard
      featureKey="PROJECTS"
      locked={!isEnabled}
      lockTitle={t('Unlock Projects')}
      lockDescription={t(
        'Orchestrate your automation teams across projects with their own flows, connections and usage quotas',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/projects.mp4"
    >
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between flex-row">
          <TableTitle>{t('Projects')}</TableTitle>
          <NewProjectDialog onCreate={() => refetch()}>
            <Button size="sm" className="flex items-center justify-center gap-2">
              <Plus className="size-4" />
              {t('New Project')}
            </Button>
          </NewProjectDialog>
        </div>
        <DataTable
          onRowClick={async (project) => {
            await setCurrentProject(queryClient, project);
            navigate('/');
          }}
          columns={columns}
          page={data}
          isLoading={isLoading}
          actions={[
            (row) => {
              return (
                <div className="flex items-end justify-end">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className="size-8 p-0"
                        onClick={async (e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          await setCurrentProject(queryClient, row);
                          navigate('/settings/general');
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t('Edit project')}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            },
            (row) => {
              const isActiveProject = row.id === currentProject?.id;
              const deleteButton = (
                <Button
                  disabled={isActiveProject}
                  variant="ghost"
                  className="size-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Trash className="size-4 text-destructive" />
                </Button>
              );

              return (
                <div className="flex items-end justify-end">
                  <ConfirmationDeleteDialog
                    title={t('Delete Project')}
                    message={t('Are you sure you want to delete this project?')}
                    entityName={t('Project')}
                    mutationFn={async () => {
                      await deleteProjectMutation.mutateAsync(row.id);
                    }}
                    onError={(error) => {
                      toast({
                        title: t('Error'),
                        description: errorToastMessage(error),
                        duration: 3000,
                      });
                    }}
                  >
                    {isActiveProject ? (
                      <Tooltip>
                        <TooltipTrigger>{deleteButton}</TooltipTrigger>
                        <TooltipContent side="bottom">
                          {isActiveProject
                            ? t('Cannot delete active project')
                            : t('Delete project')}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      deleteButton
                    )}
                  </ConfirmationDeleteDialog>
                </div>
              );
            },
          ]}
        />
      </div>
    </LockedFeatureGuard>
  );
}
