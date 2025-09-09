import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { EllipsisVertical, Plus, Table as TableIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SidebarMenu,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSkeleton,
} from '@/components/ui/sidebar-shadcn';
import { ApTableActionsMenu } from '@/features/tables/components/ap-table-actions-menu';
import { tableHooks } from '@/features/tables/lib/table-hooks';
import { tablesApi } from '@/features/tables/lib/tables-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { Permission, Table } from '@activepieces/shared';

export function TablesSection() {
  const navigate = useNavigate();
  const { tableId: currentTableId } = useParams();

  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );

  const {
    data: tables,
    isLoading: isTablesLoading,
    refetch,
  } = tableHooks.useTables(1000000);
  const { mutate: createTable, isPending: isCreatingTable } =
    tableHooks.useCreateTable();

  const handleTableClick = (tableId: string) => {
    navigate(
      authenticationSession.appendProjectRoutePrefix(`/tables/${tableId}`),
    );
  };

  const isTableActive = (tableId: string) => currentTableId === tableId;

  if (isTablesLoading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{t('Tables')}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarSkeleton numOfItems={6} />
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="max-h-[50%] pb-2">
      <SidebarGroupLabel className="flex px-0 justify-between items-center w-full mb-1">
        {t('Tables')}
        <PermissionNeededTooltip hasPermission={userHasTableWritePermission}>
          <Button
            onClick={() => createTable({ name: t('New Table') })}
            size="icon"
            variant="ghost"
            className="size-9"
            disabled={!userHasTableWritePermission || isCreatingTable}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </PermissionNeededTooltip>
      </SidebarGroupLabel>
      <ScrollArea scrollHideDelay={2}>
        <SidebarGroupContent>
          <SidebarMenu>
            {tables?.data.map((table) => (
              <TableItem
                key={table.id}
                table={table}
                isActive={isTableActive(table.id)}
                onClick={() => handleTableClick(table.id)}
                refetch={refetch}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </ScrollArea>
    </SidebarGroup>
  );
}

interface FlowItemProps {
  table: Table;
  isActive: boolean;
  onClick: () => void;
  refetch: () => void;
}

function TableItem({ table, isActive, onClick, refetch }: FlowItemProps) {
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => tablesApi.delete(id)));
    },
    onSuccess: () => {
      refetch();
    },
  });

  return (
    <SidebarMenuSubItem className="cursor-pointer group/item">
      <SidebarMenuSubButton
        onClick={onClick}
        className={cn(isActive && 'bg-sidebar-accent', 'pl-2 pr-0')}
      >
        <span className="size-5 flex mr-1 items-center justify-center rounded-sm bg-sidebar-accent">
          <TableIcon className="w-3 h-3 !text-muted-foreground" />
        </span>
        <span className="truncate">{table.name}</span>

        <ApTableActionsMenu
          table={table}
          refetch={refetch}
          deleteMutation={bulkDeleteMutation}
        >
          <Button
            variant="ghost"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto group-hover/item:opacity-100 opacity-0"
            size="icon"
          >
            <EllipsisVertical />
          </Button>
        </ApTableActionsMenu>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}
