import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { CheckCircle, CheckIcon, Tag, User } from 'lucide-react';
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
import { projectMembersHooks } from '@/features/team/lib/project-members-hooks';
import { todosApi } from '@/features/todos/lib/todos-api';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import {
  Todo,
  TodoWithAssignee,
  UNRESOLVED_STATUS,
  RESOLVED_STATUS,
  STATUS_COLORS,
} from '@activepieces/shared';

import { TodoDetails } from './todo-details';

function TodosPage() {
  const [selectedRows, setSelectedRows] = useState<Array<Todo>>([]);
  const [selectedTask, setSelectedTask] = useState<TodoWithAssignee | null>(
    null,
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rowIndex, setRowIndex] = useState(0);

  const location = useLocation();
  const projectId = authenticationSession.getProjectId()!;
  const platformId = authenticationSession.getPlatformId()!;
  const { data: currentUser } = userHooks.useCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (!location.search.includes('assignee')) {
      setSearchParams((prev) => {
        if (currentUser) {
          prev.set('assignee', currentUser.email);
        }
        prev.set('status', UNRESOLVED_STATUS.name);
        return prev;
      });
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['todos', location, projectId],
    queryFn: () => {
      const cursor = searchParams.get(CURSOR_QUERY_PARAM);
      const limit = searchParams.get(LIMIT_QUERY_PARAM)
        ? parseInt(searchParams.get(LIMIT_QUERY_PARAM)!)
        : 10;
      const assigneeId = searchParams.get('assigneeId') ?? undefined;
      const flowId = searchParams.get('flowId') ?? undefined;
      const title = searchParams.get('title') ?? undefined;
      const status = searchParams.getAll('status') ?? undefined;
      const isUnresolved =
        status.length === 1 && status[0] === UNRESOLVED_STATUS.name
          ? true
          : false;
      const isAllStatus = status.length === 0 || status.length === 2;
      const statusOptions = isAllStatus
        ? undefined
        : isUnresolved
        ? [UNRESOLVED_STATUS.name]
        : [RESOLVED_STATUS.name];
      return todosApi.list({
        projectId,
        cursor: cursor ?? undefined,
        limit,
        platformId,
        assigneeId,
        flowId,
        statusOptions,
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
    ...(projectMembers
      ?.filter((member) => member.user.email !== currentUser?.email)
      .map((member) => ({
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
      options: [
        {
          label: t('Unresolved'),
          value: UNRESOLVED_STATUS.name,
        },
        {
          label: t('Resolved'),
          value: RESOLVED_STATUS.name,
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

  const columns: ColumnDef<RowDataWithActions<TodoWithAssignee>, unknown>[] = [
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
              color={STATUS_COLORS[row.original.status.variant].color}
              textColor={STATUS_COLORS[row.original.status.variant].textColor}
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
      <div className="flex items-center gap-2">
        <TableTitle
          description={t(
            'Manage todos for your project that are created by automations',
          )}
          beta={true}
        >
          {t('Todos')}
        </TableTitle>
      </div>
      <DataTable
        emptyStateTextTitle={t('No todos found')}
        emptyStateTextDescription={t(
          'You do not have any pending todos. Great job!',
        )}
        emptyStateIcon={<CheckCircle className="size-14" />}
        columns={columns}
        page={filteredData}
        isLoading={isLoading}
        filters={filters}
        onRowClick={(row) => {
          setSelectedTask(row);
          setDrawerOpen(true);
          setRowIndex(data?.data.findIndex((task) => task.id === row.id) ?? 0);
        }}
      />
      {selectedTask && (
        <TodoDetails
          key={selectedTask.id}
          currentTodo={selectedTask}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onClose={() => {
            setSelectedTask(null);
            setDrawerOpen(false);
          }}
          onNext={() => {
            if (!data || !data.data.length) return;
            const length = data.data.length;
            const nextIndex = (rowIndex + 1) % length;
            setRowIndex(nextIndex);
            setSelectedTask(data.data[nextIndex]);
          }}
          onPrevious={() => {
            if (!data || !data.data.length) return;
            const length = data.data.length;
            const previousIndex = (rowIndex - 1 + length) % length;
            setRowIndex(previousIndex);
            setSelectedTask(data.data[previousIndex]);
          }}
        />
      )}
    </div>
  );
}

export { TodosPage };
