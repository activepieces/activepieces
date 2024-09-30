import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { CircleMinus, Pencil, RotateCcw, Trash } from 'lucide-react';
import { useState } from 'react';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { platformUserApi } from '@/features/platform-admin-panel/lib/platform-user-api';
import { formatUtils } from '@/lib/utils';
import { UserStatus } from '@activepieces/shared';

import { TableTitle } from '../../../../components/ui/table-title';

import { UpdateUserRoleDialog } from './update-role-dialog';

export default function UsersPage() {
  const [refreshCount, setRefreshCount] = useState(0);

  const { toast } = useToast();

  const refreshData = () => {
    setRefreshCount((prev) => prev + 1);
  };

  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationKey: ['delete-user'],
    mutationFn: async (userId: string) => {
      await platformUserApi.delete(userId);
    },
    onSuccess: () => {
      refreshData();
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
        refreshData();
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
                  <div className="text-left">{row.original.platformRole}</div>
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
                return <div className="text-left">{row.original.status}</div>;
              },
            },
          ]}
          fetchData={() => platformUserApi.list()}
          refresh={refreshCount}
          actions={[
            (row) => {
              return (
                <div className="flex items-end justify-end">
                  <Tooltip>
                    <TooltipTrigger>
                      <UpdateUserRoleDialog
                        userId={row.id}
                        role={row.platformRole}
                        onUpdate={() => refreshData()}
                      >
                        <Button variant="ghost" className="size-8 p-0">
                          <Pencil className="size-4" />
                        </Button>
                      </UpdateUserRoleDialog>
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
                        disabled={isDeleting}
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
