import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  CircleMinus,
  Pencil,
  RotateCcw,
  Trash,
  User,
  Mail,
  Tag,
  Hash,
  Shield,
  Clock,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

import { DashboardPageHeader } from '@/app/components/dashboard-page-header';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TruncatedColumnTextValue } from '@/components/ui/data-table/truncated-column-text-value';
import { FormattedDate } from '@/components/ui/formatted-date';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformUserHooks } from '@/hooks/platform-user-hooks';
import { platformUserApi } from '@/lib/platform-user-api';
import { PlatformRole, UserStatus } from '@activepieces/shared';

import { UpdateUserDialog } from './update-user-dialog';

export default function UsersPage() {
  const { data, isLoading, refetch } = platformUserHooks.useUsers();

  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationKey: ['delete-user'],
    mutationFn: async (userId: string) => {
      await platformUserApi.delete(userId);
    },
    onSuccess: () => {
      refetch();
      toast.success(t('User deleted successfully'), {
        duration: 3000,
      });
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
        toast.success(
          data.status === UserStatus.ACTIVE
            ? t('User activated successfully')
            : t('User deactivated successfully'),
          {
            duration: 3000,
          },
        );
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
        <DashboardPageHeader
          title={t('Users')}
          description={t(
            'Manage, delete, activate and deactivate users on platform',
          )}
        />
        <DataTable
          emptyStateTextTitle={t('No users found')}
          emptyStateTextDescription={t('Start inviting users to your project')}
          emptyStateIcon={<User className="size-14" />}
          columns={[
            {
              accessorKey: 'email',
              size: 200,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Email')}
                  icon={Mail}
                />
              ),
              cell: ({ row }) => {
                return <TruncatedColumnTextValue value={row.original.email} />;
              },
            },
            {
              accessorKey: 'name',
              size: 150,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Name')}
                  icon={Tag}
                />
              ),
              cell: ({ row }) => {
                return (
                  <TruncatedColumnTextValue
                    value={row.original.firstName + ' ' + row.original.lastName}
                  />
                );
              },
            },
            {
              accessorKey: 'externalId',
              size: 120,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('External Id')}
                  icon={Hash}
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
              size: 100,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Role')}
                  icon={Shield}
                />
              ),
              cell: ({ row }) => {
                return (
                  <div className="text-left">
                    {row.original.platformRole === PlatformRole.ADMIN
                      ? t('Admin')
                      : row.original.platformRole === PlatformRole.OPERATOR
                      ? t('Operator')
                      : t('Member')}
                  </div>
                );
              },
            },
            {
              accessorKey: 'createdAt',
              size: 150,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Created')}
                  icon={Clock}
                />
              ),
              cell: ({ row }) => {
                return (
                  <div className="text-left">
                    <FormattedDate date={new Date(row.original.created)} />
                  </div>
                );
              },
            },
            {
              accessorKey: 'lastActiveDate',
              size: 150,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Last Active')}
                  icon={Clock}
                />
              ),
              cell: ({ row }) => {
                return row.original.lastActiveDate ? (
                  <div className="text-left">
                    <FormattedDate
                      date={new Date(row.original.lastActiveDate)}
                    />
                  </div>
                ) : (
                  '-'
                );
              },
            },
            {
              accessorKey: 'status',
              size: 100,
              header: ({ column }) => (
                <DataTableColumnHeader
                  column={column}
                  title={t('Status')}
                  icon={Activity}
                />
              ),
              cell: ({ row }) => {
                return (
                  <div className="text-left">
                    {row.original.status === UserStatus.ACTIVE
                      ? t('Activated')
                      : t('Deactivated')}
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
                        externalId={row.externalId ?? undefined}
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
                        disabled={
                          isUpdatingStatus ||
                          row.platformRole === PlatformRole.ADMIN
                        }
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
                      {row.platformRole === PlatformRole.ADMIN
                        ? t('Admin cannot be deactivated')
                        : row.status === UserStatus.ACTIVE
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
