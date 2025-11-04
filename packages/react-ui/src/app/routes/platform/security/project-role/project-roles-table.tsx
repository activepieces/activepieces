import { useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Eye, Pencil, Trash, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { projectRoleApi } from '@/features/platform-admin/lib/project-role-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/utils';
import { ProjectRole, RoleType, SeekPage } from '@activepieces/shared';

import { ProjectRoleDialog } from './project-role-dialog';

interface ProjectRolesTableProps {
  projectRoles: SeekPage<ProjectRole> | undefined;
  isLoading: boolean;
  refetch: () => void;
}

export const ProjectRolesTable = ({
  projectRoles,
  isLoading,
  refetch,
}: ProjectRolesTableProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { platform } = platformHooks.useCurrentPlatform();

  const { mutate: deleteProjectRole, isPending: isDeleting } = useMutation({
    mutationKey: ['delete-project-role'],
    mutationFn: (name: string) => projectRoleApi.delete(name),
    onSuccess: () => {
      refetch();
      toast({
        title: t('Success'),
        description: t('Project Role entry deleted successfully'),
        duration: 3000,
      });
    },
  });

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
      accessorKey: 'userCount',
      accessorFn: (row) => row.userCount,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('Users')}
          className="text-center"
        />
      ),
      cell: ({ row }) => (
        <div className="text-left">{row.original.userCount}</div>
      ),
    },
  ];

  return (
    <DataTable
      emptyStateTextTitle={t('No project roles found')}
      emptyStateTextDescription={t(
        'Create custom project roles to manage permissions for platform users',
      )}
      emptyStateIcon={<Users className="size-14" />}
      columns={columns}
      page={projectRoles}
      isLoading={isLoading}
      hidePagination={true}
      actions={[
        (row) => {
          return (
            <div className="flex items-center justify-center gap-2">
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    loading={isDeleting}
                    variant="ghost"
                    className="size-8 p-0"
                    onClick={() => {
                      navigate(`/platform/security/project-roles/${row.id}`);
                    }}
                  >
                    <Users className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t('Show Users')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <ProjectRoleDialog
                    mode="edit"
                    projectRole={row}
                    platformId={platform.id}
                    onSave={() => refetch()}
                    disabled={row.type === RoleType.DEFAULT}
                  >
                    <Button variant="ghost" className="size-8 p-0">
                      {row.type === RoleType.DEFAULT ? (
                        <Eye className="size-4" />
                      ) : (
                        <Pencil className="size-4" />
                      )}
                    </Button>
                  </ProjectRoleDialog>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {row.type === RoleType.DEFAULT
                    ? t('View Role')
                    : t('Edit Role')}
                </TooltipContent>
              </Tooltip>

              {row.type !== RoleType.DEFAULT && (
                <Tooltip>
                  <TooltipTrigger>
                    <ConfirmationDeleteDialog
                      isDanger={true}
                      title={t('Delete Role')}
                      message={t(
                        `Deleting this role will remove ${
                          row.userCount
                        } project member${
                          row.userCount === 1 ? '' : 's'
                        } and all associated invitations. Are you sure you want to proceed?`,
                      )}
                      entityName={`${t('Project Role')} ${row.name}`}
                      mutationFn={async () => deleteProjectRole(row.name)}
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
              )}
            </div>
          );
        },
      ]}
    />
  );
};
