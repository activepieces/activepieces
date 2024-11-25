import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { CircleMinus, Pencil, RotateCcw, Trash } from 'lucide-react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { platformUserHooks } from '@/hooks/platform-user-hooks';
import { platformUserApi } from '@/lib/platform-user-api';
import { formatUtils } from '@/lib/utils';
import { PlatformRole, UserStatus } from '@activepieces/shared';

import { TableTitle } from '../../../../components/ui/table-title';

import { UpdateUserDialog } from './update-user-dialog';

export default function UsersPage() {
  const { toast } = useToast();

  const { data, isLoading, refetch } = platformUserHooks.useUsers();

  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationKey: ['delete-user'],
    mutationFn: async (userId: string) => {
      await platformUserApi.delete(userId);
    },
    onSuccess: () => {
      refetch();
      toast({
        title: t('Success'),
        description: t('User deleted successfully'),
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const { mutate: updateUserStatus, isPending: isUpdatingStatus } = useMutation(
    {
      mutationFn: async (data: { userId: string; status: UserStatus }) => {
        await platformUserApi.update(data.userId, {
          status: data.status,
        });
        return {
          userId: data.userId,
          status: data.status,
        };
      },
      onSuccess: (data) => {
        refetch();
        toast({
          title: t('Success'),
          description:
            data.status === UserStatus.ACTIVE
              ? t('User activated successfully')
              : t('User deactivated successfully'),
          duration: 3000,
        });
      },
      onError: () => {
        toast(INTERNAL_ERROR_TOAST);
      },
    },
  );

  return (
    <LockedFeatureGuard
      featureKey="USERS"
      locked={false}
      lockTitle={t('Unlock Users')}
      lockDescription={t('Manage your users and their access to your projects')}
    >
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between flex-row">
          <TableTitle>{t('Users')}</TableTitle>
        </div>
        <DataTable
          columns={[
            {
              accessorKey: 'email',
              header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t('Email')} />
              ),
              cell: ({ row }) => {
                return <div className="text-left">{row.original.email}</div>;
              },
            },
            {
              accessorKey: 'name',
              header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t('Name')} />
              ),
              cell: ({ row }) => {
                return (
                  <div className="text-left">
                    {row.original.firstName} {row.original.lastName}
                  </div>
                );
              },
            },
            {
              accessorKey: 'externalId',
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('External Id')}
                />
              ),
              cell: ({ row }) => {
                return (
                  <div className="text-left">{row.original.externalId}</div>
                );
              },
            },
            {
              accessorKey: 'role',
              header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t('Role')} />
              ),
              cell: ({ row }) => {
                return (
                  <div className="text-left">
                    {row.original.platformRole === PlatformRole.ADMIN
                      ? t('Admin')
                      : t('Member')}
                  </div>
                );
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
              accessorKey: 'status',
              header: ({ column }) => (
                <DataTableColumnHeader column={column} title={t('Status')} />
              ),
              cell: ({ row }) => {
                return (
                  <div className="text-left">
                    {row.original.status === UserStatus.ACTIVE
                      ? t('Active')
                      : t('Inactive')}
                  </div>
                );
              },
            },
          ]}
          page={data}
          hidePagination={true}
          isLoading={isLoading}
          actions={[
            (row) => {
              return (
                <div className="flex items-end justify-end">
                  <Tooltip>
                    <TooltipTrigger>
                      <UpdateUserDialog
                        userId={row.id}
                        role={row.platformRole}
                        externalId={row.externalId}
                        onUpdate={() => refetch()}
                      >
                        <Button variant="ghost" className="size-8 p-0">
                          <Pencil className="size-4" />
                        </Button>
                      </UpdateUserDialog>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {t('Edit user')}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            },
            (row) => {
              return (
                <div className="flex items-end justify-end">
                  <Tooltip>
                    <TooltipTrigger>
                      <Button
                        disabled={isUpdatingStatus}
                        variant="ghost"
                        className="size-8 p-0"
                        loading={isUpdatingStatus}
                        onClick={() => {
                          updateUserStatus({
                            userId: row.id,
                            status:
                              row.status === UserStatus.ACTIVE
                                ? UserStatus.INACTIVE
                                : UserStatus.ACTIVE,
                          });
                        }}
                      >
                        {row.status === UserStatus.ACTIVE ? (
                          <CircleMinus className="size-4" />
                        ) : (
                          <RotateCcw className="size-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {row.status === UserStatus.ACTIVE
                        ? t('Deactivate user')
                        : t('Activate user')}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            },
            (row) => {
              return (
                <div className="flex items-end justify-end">
                  <Tooltip>
                    <TooltipTrigger>
                      <ConfirmationDeleteDialog
                        title={t('Delete User')}
                        message={t(
                          'Are you sure you want to delete this user?',
                        )}
                        entityName={`${t('User')} ${row.email}`}
                        mutationFn={async () => {
                          deleteUser(row.id);
                        }}
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
                      {t('Delete user')}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            },
          ]}
        />
      </div>
    </LockedFeatureGuard>
  );
}
