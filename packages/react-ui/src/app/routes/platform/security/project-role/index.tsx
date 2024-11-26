import { useQuery, useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Pencil, Trash, Plus, Eye } from 'lucide-react';
import { useState } from 'react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TableTitle } from '@/components/ui/table-title';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { projectRoleApi } from '@/features/platform-admin-panel/lib/project-role-api';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/utils';
import { ProjectRole, RoleType } from '@activepieces/shared';

import ProjectMembersDialog from './project-members-dialog';
import { ProjectRoleDialog } from './project-role-dialog';

const ProjectRolePage = () => {
  const { toast } = useToast();
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
    enabled: platform.projectRolesEnabled,
  });

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
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProjectRole, setSelectedProjectRole] =
    useState<ProjectRole | null>(null);

  const handleUserCountClick = (projectRole: ProjectRole) => {
    setIsDialogOpen(true);
    setSelectedProjectRole(projectRole);
  };

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
        <div
          className="text-left cursor-pointer"
          onClick={() => handleUserCountClick(row.original)}
        >
          {row.original.userCount}
        </div>
      ),
    },
  ];

  return (
    <LockedFeatureGuard
      featureKey="TEAM"
      locked={!platform.projectRolesEnabled}
      lockTitle={t('Project Role Management')}
      lockDescription={t(
        'Define custom roles and permissions to control what your team members can access and modify',
      )}
      lockVideoUrl="https://cdn.activepieces.com/videos/showcase/roles.mp4"
    >
      <div className="flex-col w-full">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <TableTitle>{t('Project Role Management')}</TableTitle>
            <div className="text-sm text-muted-foreground">
              {t(
                'Define custom roles and permissions that can be assigned to your team members',
              )}
            </div>
          </div>
          {!platform.customRolesEnabled && (
            <Tooltip>
              <TooltipTrigger>
                <Button size="sm" className="flex items-center gap-2" disabled>
                  <Plus className="size-4" />
                  {t('New Role')}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t('Contact sales to unlock custom roles')}
              </TooltipContent>
            </Tooltip>
          )}
          {platform.customRolesEnabled && (
            <ProjectRoleDialog
              mode="create"
              onSave={() => refetch()}
              platformId={platform.id}
            >
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="size-4" />
                {t('New Role')}
              </Button>
            </ProjectRoleDialog>
          )}
        </div>

        <DataTable
          columns={columns}
          page={data}
          isLoading={isLoading}
          actions={[
            (row) => {
              return (
                <div className="flex items-center justify-center">
                  <Tooltip>
                    <TooltipTrigger>
                      <ProjectRoleDialog
                        mode="edit"
                        projectRole={row}
                        platformId={platform.id}
                        onSave={() => refetch()}
                        disabled={row.type === RoleType.DEFAULT}
                      >
                        {row.type === RoleType.DEFAULT ? (
                          <Eye className="size-4" />
                        ) : (
                          <Pencil className="size-4" />
                        )}
                      </ProjectRoleDialog>
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
                  <div className="flex items-center justify-center">
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
                  </div>
                );
              }
              return <></>;
            },
          ]}
        />
        <ProjectMembersDialog
          projectRole={selectedProjectRole}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedProjectRole(null);
          }}
          refetch={refetch}
        />
      </div>
    </LockedFeatureGuard>
  );
};

ProjectRolePage.displayName = 'ProjectRolePage';
export { ProjectRolePage };
