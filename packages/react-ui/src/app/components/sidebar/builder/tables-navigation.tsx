import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { EllipsisVertical, Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ApTableActionsMenu } from '@/features/tables/components/ap-table-actions-menu';
import { tableHooks } from '@/features/tables/lib/table-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { authenticationSession } from '@/lib/authentication-session';
import { cn } from '@/lib/utils';
import { Permission, Table } from '@activepieces/shared';

export function TablesNavigation() {
  const navigate = useNavigate();
  const { tableId: currentTableId } = useParams();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const userHasTableWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_TABLE,
  );

  const {
    data: tables,
    isLoading: isTablesLoading,
    refetch,
  } = tableHooks.useTables(999999);
  const { mutate: createTable, isPending: isCreatingTable } =
    tableHooks.useCreateTable();

  useEffect(() => {
    if (!currentTableId || isTablesLoading) return;

    const timeoutId = setTimeout(() => {
      const selectedTableElement = document.querySelector(
        `[data-table-id="${currentTableId}"]`,
      );
      if (selectedTableElement && scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector(
          '[data-radix-scroll-area-viewport]',
        )!;
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = selectedTableElement.getBoundingClientRect();

        if (
          elementRect.top < containerRect.top ||
          elementRect.bottom > containerRect.bottom
        ) {
          selectedTableElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
        }
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [currentTableId, isTablesLoading]);

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
    <SidebarGroup className="pb-2 max-h-[calc(50%-10px)] pr-0">
      <SidebarGroupLabel className="flex px-2 text-sm text-foreground font-semibold justify-between items-center w-full mb-1">
        {t('Tables')}
        <Tooltip>
          <TooltipTrigger>
            <Button
              onClick={() => createTable({ name: t('New Table') })}
              size="icon"
              variant="ghost"
              className="size-9"
              disabled={!userHasTableWritePermission || isCreatingTable}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{t('New table')}</TooltipContent>
        </Tooltip>
      </SidebarGroupLabel>
      <ScrollArea ref={scrollAreaRef} scrollHideDelay={2} showGradient>
        <SidebarGroupContent>
          <SidebarMenu className="pr-2">
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
  const { tableId } = useParams();
  const queryClient = useQueryClient();

  return (
    <SidebarMenuSubItem
      className="cursor-pointer group/item"
      data-table-id={table.id}
    >
      <SidebarMenuSubButton
        onClick={onClick}
        className={cn(isActive && 'bg-sidebar-accent', 'pl-2 pr-0')}
      >
        <span className="truncate">{table.name}</span>

        <ApTableActionsMenu
          table={table}
          refetch={refetch}
          onDelete={() => {
            if (table.id === tableId) {
              queryClient.invalidateQueries({ queryKey: ['table', tableId] });
            }
          }}
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
