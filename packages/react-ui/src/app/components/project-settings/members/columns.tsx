import { useMutation, useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { ChevronDown, Info, Trash2, User, Shield } from 'lucide-react';
import { toast } from 'sonner';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { internalErrorToast } from '@/components/ui/sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserAvatar } from '@/components/ui/user-avatar';
import { projectMembersApi } from '@/features/members/lib/project-members-api';
import { userInvitationApi } from '@/features/members/lib/user-invitation';
import { projectRoleApi } from '@/features/platform-admin/lib/project-role-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { ProjectMemberWithUser } from '@activepieces/ee-shared';
import { Permission, UserInvitation } from '@activepieces/shared';

export type MemberRowData =
  | {
      id: string;
      type: 'member';
      data: ProjectMemberWithUser;
    }
  | {
      id: string;
      type: 'invitation';
      data: UserInvitation;
    };

type MembersTableColumnsProps = {
  refetch: () => void;
};

const RoleCell = ({
  row,
  refetch,
}: {
  row: { original: MemberRowData };
  refetch: () => void;
}) => {
  const { data: rolesData } = useQuery({
    queryKey: ['project-roles'],
    queryFn: () => projectRoleApi.list(),
  });

  const roles = rolesData?.data ?? [];
  const { checkAccess } = useAuthorization();
  const { project } = projectCollectionUtils.useCurrentProject();
  const userHasPermissionToUpdateRole =
    checkAccess(Permission.WRITE_PROJECT_MEMBER) &&
    row.original.type === 'member';

  const isOwner =
    row.original.type === 'member' &&
    project.ownerId === row.original.data.userId;

  const { mutate } = useMutation({
    mutationFn: (newRole: string) => {
      if (row.original.type === 'member') {
        return projectMembersApi.update(row.original.data.id, {
          role: newRole,
        });
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      toast.success(t('Role updated successfully'));
      refetch();
    },
    onError: () => {
      internalErrorToast();
    },
  });

  const handleValueChange = (value: string) => {
    mutate(value);
  };

  const roleName =
    row.original.type === 'member'
      ? row.original.data.projectRole.name
      : row.original.data.projectRole?.name ?? '';

  if (isOwner) {
    return <span className="text-sm">{roleName}</span>;
  }

  if (row.original.type === 'invitation') {
    return (
      <div className="relative">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-orange-700 absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Pending Invitation')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          variant="outline"
          className="w-[150px] justify-between cursor-not-allowed"
          disabled={true}
        >
          <span>{roleName}</span>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </div>
    );
  }

  return (
    <PermissionNeededTooltip hasPermission={userHasPermissionToUpdateRole}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-[150px] justify-between"
            disabled={!userHasPermissionToUpdateRole}
          >
            <span>{roleName}</span>
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[150px]">
          {roles.map((role) => (
            <DropdownMenuItem
              key={role.name}
              onClick={(e) => {
                e.stopPropagation();
                handleValueChange(role.name);
              }}
            >
              {role.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </PermissionNeededTooltip>
  );
};

const ActionsCell = ({
  row,
  refetch,
}: {
  row: { original: MemberRowData };
  refetch: () => void;
}) => {
  const { checkAccess } = useAuthorization();
  const { project } = projectCollectionUtils.useCurrentProject();

  const userHasPermissionToDelete =
    row.original.type === 'member'
      ? checkAccess(Permission.WRITE_PROJECT_MEMBER)
      : checkAccess(Permission.WRITE_INVITATION);

  const isOwner =
    row.original.type === 'member' &&
    project.ownerId === row.original.data.userId;

  const deleteMember = async () => {
    if (row.original.type === 'member') {
      await projectMembersApi.delete(row.original.data.id);
    } else {
      await userInvitationApi.delete(row.original.data.id);
    }
    refetch();
  };

  if (isOwner) {
    return null;
  }

  return (
    <PermissionNeededTooltip hasPermission={userHasPermissionToDelete}>
      <ConfirmationDeleteDialog
        title={
          row.original.type === 'invitation'
            ? t('Remove {email}', { email: row.original.data.email })
            : `${t('Remove')} ${row.original.data.user.firstName} ${
                row.original.data.user.lastName
              }`
        }
        message={
          row.original.type === 'invitation'
            ? t('Are you sure you want to remove this invitation?')
            : t('Are you sure you want to remove this member?')
        }
        mutationFn={() => deleteMember()}
        entityName={
          row.original.type === 'invitation'
            ? row.original.data.email
            : `${row.original.data.user.firstName} ${row.original.data.user.lastName}`
        }
      >
        <Button
          variant="ghost"
          size="sm"
          disabled={!userHasPermissionToDelete}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </ConfirmationDeleteDialog>
    </PermissionNeededTooltip>
  );
};

export const membersTableColumns = ({
  refetch,
}: MembersTableColumnsProps): (ColumnDef<RowDataWithActions<MemberRowData>> & {
  accessorKey: string;
})[] => [
  {
    accessorKey: 'member',
    size: 250,
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('User Name')}
        icon={User}
      />
    ),
    cell: ({ row }) => {
      if (row.original.type === 'invitation') {
        const email = row.original.data.email;
        return (
          <div className="flex items-center space-x-4">
            <UserAvatar
              name={email}
              email={email}
              size={32}
              disableTooltip={true}
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-orange-700">{email}</p>
            </div>
          </div>
        );
      }

      const email = row.original.data.user.email;
      const name = `${row.original.data.user.firstName} ${row.original.data.user.lastName}`;

      return (
        <div className="flex items-center space-x-4">
          <UserAvatar
            name={name}
            email={email}
            size={32}
            disableTooltip={true}
          />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">{name}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'role',
    size: 180,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('Role')} icon={Shield} />
    ),
    cell: ({ row }) => {
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <RoleCell row={row} refetch={refetch} />
        </div>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: ({ column }) => <DataTableColumnHeader column={column} title="" />,
    cell: ({ row }) => {
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <ActionsCell row={row} refetch={refetch} />
        </div>
      );
    },
  },
];
