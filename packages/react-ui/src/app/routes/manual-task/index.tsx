import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckIcon, Tag, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { Checkbox } from '@/components/ui/checkbox';
import {
  CURSOR_QUERY_PARAM,
  DataTable,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { StatusIconWithText } from '@/components/ui/status-icon-with-text';
import { TableTitle } from '@/components/ui/table-title';
import { UserFullName } from '@/components/ui/user-fullname';
import { manualTaskApi } from '@/features/manual-tasks/lib/manual-task-api';
import { projectMembersHooks } from '@/features/team/lib/project-members-hooks';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import {
  ManualTask,
  ManualTaskWithAssignee,
} from '@activepieces/ee-shared';

function ManualTasksPage() {
  const [selectedRows, setSelectedRows] = useState<Array<ManualTask>>([]);

  const location = useLocation();
  const projectId = authenticationSession.getProjectId()!;
  const platformId = authenticationSession.getPlatformId()!;
  const { data: currentUser } = userHooks.useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!searchParams.get('assignee')) {
      setSearchParams((prev) => {
        if (currentUser) {
          prev.set('assignee', currentUser.email);
        }
        return prev;
      });
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['manualTasks', searchParams, projectId],
    queryFn: () => {
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM)
        ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
        : 10;
      const assigneeId = searchParams.get('assigneeId') ?? undefined;
      const flowId = searchParams.get('flowId') ?? undefined;
      const title = searchParams.get('title') ?? undefined;
      return manualTaskApi.list({
        projectId,
        cursor: cursor ?? undefined,
        limit,
        platformId,
        assigneeId,
        flowId,
        statusOptions: undefined, // TODO: need to add status options
        title,
      });
    },
  });

  const filteredData = useMemo(() => {
    if (!data?.data) return undefined;
    const searchParams = new URLSearchParams(location.search);
    const assigneeEmails = searchParams.getAll('assignee');

    if (assigneeEmails.length === 0) return data;

    return {
      data: data.data.filter(
        (task) => task.assignee && assigneeEmails.includes(task.assignee.email),
      ),
      next: data.next,
      previous: data.previous,
    };
  }, [data, location.search]);

  const { projectMembers } = projectMembersHooks.useProjectMembers();
  const assigneeOptions = [
    ...(currentUser
      ? [
          {
            label: t('Me Only'),
            value: currentUser.email,
          },
        ]
      : []),
    ...(projectMembers?.map((member) => ({
      label: `${member.user.firstName} ${member.user.lastName} (${member.user.email})`,
      value: member.user.email,
    })) ?? []),
  ];
  const filters = [
    {
      type: 'select',
      title: t('Assigned to'),
      accessorKey: 'assignee',
      icon: User,
      options: assigneeOptions ?? [],
    } as const,
    {
      type: 'select',
      title: t('Status'),
      accessorKey: 'status',
      // TODO: need to the real status options
      options: [
        {
          label: 'Test Status',
          value: 'Test Status',
        },
      ],
      icon: CheckIcon,
    } as const,
    {
      type: 'input',
      title: t('Title'),
      accessorKey: 'title',
      icon: Tag,
      options: [],
    } as const,
  ];

  const columns: ColumnDef<
    RowDataWithActions<ManualTaskWithAssignee>,
    unknown
  >[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            table.getIsSomePageRowsSelected()
          }
          onCheckedChange={(value) => {
            const isChecked = !!value;
            table.toggleAllPageRowsSelected(isChecked);

            if (isChecked) {
              const allRows = table
                .getRowModel()
                .rows.map((row) => row.original);

              const newSelectedRows = [...allRows, ...selectedRows];

              const uniqueRows = Array.from(
                new Map(
                  newSelectedRows.map((item) => [item.id, item]),
                ).values(),
              );

              setSelectedRows(uniqueRows);
            } else {
              const filteredRows = selectedRows.filter((row) => {
                return !table
                  .getRowModel()
                  .rows.some((r) => r.original.id === row.id);
              });
              setSelectedRows(filteredRows);
            }
          }}
        />
      ),
      cell: ({ row }) => {
        const isChecked = selectedRows.some(
          (selectedRow) => selectedRow.id === row.original.id,
        );
        return (
          <Checkbox
            checked={isChecked}
            onCheckedChange={(value) => {
              const isChecked = !!value;
              let newSelectedRows = [...selectedRows];
              if (isChecked) {
                const exists = newSelectedRows.some(
                  (selectedRow) => selectedRow.id === row.original.id,
                );
                if (!exists) {
                  newSelectedRows.push(row.original);
                }
              } else {
                newSelectedRows = newSelectedRows.filter(
                  (selectedRow) => selectedRow.id !== row.original.id,
                );
              }
              setSelectedRows(newSelectedRows);
              row.toggleSelected(!!value);
            }}
          />
        );
      },
      accessorKey: 'select',
    },
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Title')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">{row.original.title}</div>
        );
      },
    },
    {
      accessorKey: 'assignee',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Assigned to')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {row.original.assignee && (
              <UserFullName
                firstName={row.original.assignee.firstName}
                lastName={row.original.assignee.lastName}
                email={row.original.assignee.email}
              />
            )}
            {!row.original.assignee && <div className="text-left">-</div>}
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
            <StatusIconWithText
              icon={CheckIcon}
              text={row.original.status.name}
              color={row.original.status.color}
              textColor={row.original.status.textColor}
            />
          </div>
        );
      },
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Date Created')} />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-left">
            {formatUtils.formatDate(new Date(row.original.created))}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex-col w-full">
      <TableTitle description={t('Manage manual tasks for your project.')}>
        {t('Manual Tasks')}
      </TableTitle>
      <DataTable
        columns={columns}
        page={filteredData}
        isLoading={isLoading}
        filters={filters}
      />
    </div>
  );
}

export { ManualTasksPage };
