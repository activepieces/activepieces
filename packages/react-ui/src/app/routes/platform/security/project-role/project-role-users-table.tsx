import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { useNavigate } from 'react-router-dom';

import { DataTable, RowDataWithActions } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { UserWithProjectRole } from '@activepieces/shared';

interface ProjectRoleUsersTableProps {
  users: UserWithProjectRole[];
}

export const ProjectRoleUsersTable = ({
  users,
}: ProjectRoleUsersTableProps) => {
  const navigate = useNavigate();
  const columns: ColumnDef<RowDataWithActions<UserWithProjectRole>>[] = [
    {
      accessorKey: 'email',
      accessorFn: (row) => row.email,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Email')} />
      ),
      cell: ({ row }) => <div className="text-left">{row.original.email}</div>,
    },
    {
      accessorKey: 'project',
      accessorFn: (row) => row.project.displayName,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Project')} />
      ),
      cell: ({ row }) => (
        <div
          className="text-left cursor-pointer hover:underline hover:text-primary"
          onClick={() => {
            navigate(`/projects/${row.original.project.id}/settings/team`);
          }}
        >
          {row.original.project.displayName}
        </div>
      ),
    },
    {
      accessorKey: 'projectRole',
      accessorFn: (row) => row.projectRole.name,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('First Name')}
          className="text-center"
        />
      ),
      cell: ({ row }) => (
        <div className="text-left">{row.original.projectRole.name}</div>
      ),
    },
    {
      accessorKey: 'lastName',
      accessorFn: (row) => row.lastName,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Last Name')} />
      ),
      cell: ({ row }) => (
        <div className="text-left">{row.original.lastName}</div>
      ),
    },
  ];
  return (
    <DataTable
      columns={columns}
      page={{
        data: users,
        next: null,
        previous: null,
      }}
      isLoading={false}
    />
  );
};
