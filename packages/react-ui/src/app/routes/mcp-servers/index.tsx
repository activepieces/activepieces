import { useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Server, Plus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
  DataTable,
  CURSOR_QUERY_PARAM,
  LIMIT_QUERY_PARAM,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { TableTitle } from '@/components/ui/table-title';
import { Button } from '@/components/ui/button';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { mcpApi } from '@/features/mcp/lib/mcp-api';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/utils';
import { McpWithPieces, Permission, SeekPage } from '@activepieces/shared';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { useToast } from '@/components/ui/use-toast';

const DEFAULT_PAGE_SIZE = 10;

export const McpServersPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAccess } = useAuthorization();
  const { toast } = useToast();

  const canWriteMcp = checkAccess(Permission.WRITE_MCP);
  const searchParams = new URLSearchParams(location.search);


  const { data: mcpServersPageData, isLoading: isLoadingMcps, refetch: refetchMcps } = mcpHooks.useMcpsList({
    limit: Number(searchParams.get(LIMIT_QUERY_PARAM)) || DEFAULT_PAGE_SIZE,
    cursor: searchParams.get(CURSOR_QUERY_PARAM) ?? undefined,
  });

  const createMcpMutation = useMutation({
    mutationFn: async () => {
      return mcpApi.create();
    },
    onSuccess: (newMcp) => {
      if (newMcp) {
        toast({
          title: t('MCP Server Created'),
          description: t('New MCP server has been successfully created.'),
          duration: 3000,
        });
        refetchMcps();
      } else {
        toast({
          title: t('MCP Server'),
          description: t('MCP server already exists or could not be created.'),
          variant: 'default',
          duration: 3000,
        });
        refetchMcps();
      }
    },
    onError: (error) => {
      toast({
        title: t('Error Creating MCP Server'),
        description: error.message || t('An unexpected error occurred.'),
        variant: 'destructive',
        duration: 5000,
      });
    },
  });

  const columns: ColumnDef<RowDataWithActions<McpWithPieces>, unknown>[] = [
    {
      accessorKey: 'id',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Server ID')} />
      ),
      cell: ({ row }) => <div className="text-left">{row.original.id}</div>,
    },
    {
      accessorKey: 'created',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Created At')} />
      ),
      cell: ({ row }) => (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.created))}
        </div>
      ),
    },
    {
      accessorKey: 'updated',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Last Updated')} />
      ),
      cell: ({ row }) => (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.updated))}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-col w-full">
      <div className="flex items-center justify-between mb-4">
        <TableTitle description={t('Create and manage your MCP servers.')}>
          {t('MCP Servers')}
        </TableTitle>
        <PermissionNeededTooltip hasPermission={canWriteMcp}>
          <Button
            onClick={() => createMcpMutation.mutate()}
            disabled={!canWriteMcp || createMcpMutation.isPending}
            loading={createMcpMutation.isPending}
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('New MCP Server')}
          </Button>
        </PermissionNeededTooltip>
      </div>
      <DataTable
        columns={columns}
        page={mcpServersPageData as SeekPage<McpWithPieces> | undefined}
        isLoading={isLoadingMcps}
        emptyStateTextTitle={t('No MCP Servers Found')}
        emptyStateTextDescription={t('Create an MCP server to connect your AI assistants.')}
        emptyStateIcon={<Server className="size-14" />}
        onRowClick={(row) => navigate(`/mcp/${row.id}`)}
      />
    </div>
  );
};

export default McpServersPage;