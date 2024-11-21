import { useQuery, useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Pencil, Trash, Plus, Eye } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { projectRoleApi } from '@/features/platform-admin-panel/lib/project-role-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/utils';
import { ProjectRole, RoleType, Permission } from '@activepieces/shared';

import { CreateProjectRoleDialog } from './create-project-role-dialog';
import { EditProjectRoleDialog } from './edit-project-role-dialog';

const columns: ColumnDef<RowDataWithActions<ProjectRole>>[] = [
  {
    accessorKey: 'name',
    accessorFn: (row) => row.name,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Name')} />
    ),
    cell: ({ row }) => <div className="text-left">{row.original.name}</div>,
  },
  {
    accessorKey: 'updated',
    accessorFn: (row) => row.updated,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Updated')} />
    ),
    cell: ({ row }) => (
      <div className="text-left">
        {formatUtils.formatDate(new Date(row.original.updated))}
      </div>
    ),
  },
  {
    accessorKey: 'created',
    accessorFn: (row) => row.created,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Created')} />
    ),
    cell: ({ row }) => (
      <div className="text-left">
        {formatUtils.formatDate(new Date(row.original.created))}
      </div>
    ),
  },
  {
    accessorKey: 'userCount',
    accessorFn: (row) => row.userCount,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Users')} />
    ),
    cell: ({ row }) => (
      <div className="text-left">{row.original.userCount}</div>
    ),
  },
];

export const InitialPermissions = [
  {
    name: 'App Connections',
    description: 'Read and write app connections',
    read: [Permission.READ_APP_CONNECTION],
    write: [Permission.READ_APP_CONNECTION, Permission.WRITE_APP_CONNECTION],
  },
  {
    name: 'Flows',
    description: 'Read and write flows',
    read: [Permission.READ_FLOW],
    write: [
      Permission.READ_FLOW,
      Permission.UPDATE_FLOW_STATUS,
      Permission.WRITE_FLOW,
    ],
  },
  {
    name: 'Project Members',
    description: 'Read and write project members',
    read: [Permission.READ_PROJECT_MEMBER],
    write: [Permission.READ_PROJECT_MEMBER, Permission.WRITE_PROJECT_MEMBER],
  },
  {
    name: 'Invitations',
    description: 'Read and write invitations',
    read: [Permission.READ_INVITATION],
    write: [Permission.READ_INVITATION, Permission.WRITE_INVITATION],
  },
  {
    name: 'Git Repos',
    description: 'Read and write git repos',
    read: [Permission.READ_GIT_REPO],
    write: [Permission.READ_GIT_REPO, Permission.WRITE_GIT_REPO],
  },
  {
    name: 'Runs',
    description: 'Read and write runs',
    read: [Permission.READ_RUN],
    write: [Permission.READ_RUN, Permission.WRITE_RUN],
  },
  {
    name: 'Issues',
    description: 'Read and write issues',
    read: [Permission.READ_ISSUES],
    write: [Permission.READ_ISSUES, Permission.WRITE_ISSUES],
  },
  {
    name: 'Folders',
    description: 'Read and write folders',
    read: [Permission.READ_FOLDER],
    write: [Permission.READ_FOLDER, Permission.WRITE_FOLDER],
  },
];

const ProjectRolePage = () => {
  const { toast } = useToast();
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
  });

  const { mutate: deleteProjectRole, isPending: isDeleting } = useMutation({
    mutationKey: ['delete-project-role'],
    mutationFn: (id: string) => projectRoleApi.delete(id),
    onSuccess: () => {
      refetch();
      toast({
        title: t('Success'),
        description: t('Project Role entry deleted successfully'),
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between flex-row mb-4">
        <h1 className="text-2xl font-bold">{t('Project Role Management')}</h1>
        <CreateProjectRoleDialog
          onCreate={() => refetch()}
          platformId={platform.id}
        >
          <Button className="flex items-center">
            <Plus className="mr-2" />
            {t('New Role')}
          </Button>
        </CreateProjectRoleDialog>
      </div>
      <DataTable
        columns={columns}
        page={data}
        isLoading={isLoading}
        actions={[
          (row) => {
            return (
              <div className="flex items-end justify-end">
                <Tooltip>
                  <TooltipTrigger>
                    <EditProjectRoleDialog
                      projectRole={row}
                      onUpdate={() => refetch()}
                      disabled={row.type === RoleType.DEFAULT}
                    >
                      {row.type === RoleType.DEFAULT ? (
                        <Eye className="size-4" />
                      ) : (
                        <Pencil className="size-4" />
                      )}
                    </EditProjectRoleDialog>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {row.type === RoleType.DEFAULT
                      ? t('View Role')
                      : t('Edit Role')}
                  </TooltipContent>
                </Tooltip>
              </div>
            );
          },
          (row) => {
            if (row.type !== RoleType.DEFAULT) {
              return (
                <div className="flex items-end justify-end">
                  <Tooltip>
                    <TooltipTrigger>
                      <ConfirmationDeleteDialog
                        title={t('Delete Role')}
                        message={t(
                          'Are you sure you want to delete this role?',
                        )}
                        entityName={`${t('Project Role')} ${row.name}`}
                        mutationFn={async () => deleteProjectRole(row.id)}
                      >
                        <Button
                          loading={isDeleting}
                          variant="ghost"
                          className="size-8 p-0"
                        >
                          <Trash className="size-4 text-destructive" />
                        </Button>
                      </ConfirmationDeleteDialog>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t('Delete Role')}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            }
            return <></>;
          },
        ]}
      />
    </div>
  );
};

ProjectRolePage.displayName = 'ProjectRolePage';
export { ProjectRolePage };
