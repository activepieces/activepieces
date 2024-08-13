import { ConfirmationDeleteDialog } from "@/components/delete-dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { INTERNAL_ERROR_TOAST, useToast } from "@/components/ui/use-toast";
import { platformUserApi } from "@/features/platform-admin-panel/lib/platform-user-api";
import { formatUtils } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { CircleMinus, Pencil, RotateCcw, Trash } from "lucide-react";
import { useState } from "react";
import { UserStatus } from "@activepieces/shared";
import { UpdateUserRoleDialog } from "./update-role-dialog";

export default function UsersPage() {
  const [refreshCount, setRefreshCount] = useState(0);

  const { toast } = useToast();

  const refreshData = () => {
    setRefreshCount(prev => prev + 1);
  };

  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationKey: ['delete-user'],
    mutationFn: async (userId: string) => {
      await platformUserApi.delete(userId);
    },
    onSuccess: () => {
      refreshData();
      toast({
        title: 'Success',
        description: 'User deleted successfully',
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  })

  const { mutate: updateUserStatus, isPending: isUpdatingStatus } = useMutation({
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
        title: 'Success',
        description: data.status === UserStatus.ACTIVE ? 'User activated successfully' : 'User deactivated successfully',
        duration: 3000,
      });
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });


  return <div className="flex flex-col gap-4 w-full">
    <div className="flex items-center justify-between flex-row">
      <span className="text-2xl py-2">Users</span>
    </div>
    <DataTable
      columns={[
        {
          accessorKey: 'email',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email" />
          ),
          cell: ({ row }) => {
            return <div className="text-left">{row.original.email}</div>;
          },
        },
        {
          accessorKey: 'name',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Name" />
          ),
          cell: ({ row }) => {
            return <div className="text-left">{row.original.firstName} {row.original.lastName}</div>;
          },
        },
        {
          accessorKey: 'externalId',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="External Id" />
          ),
          cell: ({ row }) => {
            return <div className="text-left">{row.original.externalId}</div>;
          },
        },
        {
          accessorKey: 'role',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Role" />
          ),
          cell: ({ row }) => {
            return <div className="text-left">{row.original.platformRole}</div>;
          },
        },
        {
          accessorKey: 'createdAt',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Created" />
          ),
          cell: ({ row }) => {
            return <div className="text-left">{formatUtils.formatDate(new Date(row.original.created))}</div>;
          },
        },
        {
          accessorKey: 'status',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Status" />
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
          return <div className="flex items-end justify-end">
            <Tooltip>
              <TooltipTrigger>
                <UpdateUserRoleDialog userId={row.id} role={row.platformRole} onUpdate={() => refreshData()}>
                  <Button variant="ghost" className="size-8 p-0">
                    <Pencil className="size-4" />
                  </Button>
                </UpdateUserRoleDialog>
              </TooltipTrigger>
              <TooltipContent side="bottom">Edit user</TooltipContent>
            </Tooltip>
          </div>
        },
        (row) => {
          return <div className="flex items-end justify-end">
            <Tooltip>
              <TooltipTrigger>
                <Button disabled={isDeleting} variant="ghost" className="size-8 p-0"
                  onClick={() => {
                    updateUserStatus({
                      userId: row.id,
                      status: row.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE
                    })
                  }}
                >
                  {row.status === UserStatus.ACTIVE ? <CircleMinus className="size-4" /> : <RotateCcw className="size-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{row.status === UserStatus.ACTIVE ? 'Deactivate user' : 'Activate user'}</TooltipContent>
            </Tooltip>
          </div>
        },
        (row) => {
          return <div className="flex items-end justify-end">
            <Tooltip>
              <TooltipTrigger>
                <ConfirmationDeleteDialog
                  title="Delete User"
                  message="Are you sure you want to delete this user?"
                  entityName={`User ${row.email}`}
                  mutationFn={async () => {
                    deleteUser(row.id)
                  }}
                >
                  <Button loading={isDeleting} variant="ghost" className="size-8 p-0">
                    <Trash className="size-4 text-destructive" />
                  </Button>
                </ConfirmationDeleteDialog>
              </TooltipTrigger>
              <TooltipContent side="bottom">Delete user</TooltipContent>
            </Tooltip>
          </div>
        }
      ]}
    />
  </div>
}

