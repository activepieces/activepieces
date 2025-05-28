import { useMutation } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Plus, Trash2, CheckIcon, Table2, WorkflowIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ConfirmationDeleteDialog } from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BulkAction,
  DataTable,
  RowDataWithActions,
} from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table/data-table-column-header';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { TableTitle } from '@/components/ui/table-title';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { mcpApi } from '@/features/mcp/lib/mcp-api';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { api } from '@/lib/api';
import { formatUtils, NEW_MCP_QUERY_PARAM } from '@/lib/utils';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import {
  ApFlagId,
  McpWithTools,
  Permission,
} from '@activepieces/shared';
import { McpToolsIcon } from './mcp-tools-icon';

const McpServersPage = () => {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<McpWithTools[]>([]);
  const { data: maxMcps } = flagsHooks.useFlag(ApFlagId.MAX_MCPS_PER_PROJECT);
  const { data: project } = projectHooks.useCurrentProject();
  const [searchParams] = useSearchParams();
  const userHasMcpWritePermission = useAuthorization().checkAccess(
    Permission.WRITE_MCP,
  );
  const { pieces: allPiecesMetadata, isLoading: isLoadingPiecesMetadata } =
    piecesHooks.usePieces({});

  const pieceMetadataMap = allPiecesMetadata
    ? new Map(allPiecesMetadata.map((p) => [p.name, p]))
    : new Map<string, PieceMetadataModelSummary>();

  const { data, isLoading, refetch } = mcpHooks.useMcps({
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : undefined,
    name: searchParams.get('name') ?? undefined,
  });

  const { mutate: createMcp, isPending: isCreatingMcp } = useMutation({
    mutationFn: async (name: string) => {
      return mcpApi.create({
        name,
        projectId: project.id,
      });
    },
    onSuccess: (newMcpServer) => {
      refetch();
      navigate(`/projects/${project.id}/mcp/${newMcpServer.id}?${NEW_MCP_QUERY_PARAM}=true`);
    },
    onError: (err: Error) => {
      if (
        api.isError(err) &&
        err.response?.status === api.httpStatus.Conflict
      ) {
        toast({
          title: t('Max MCP servers reached'),
          description: t(`You can't create more than {maxMcps} MCP servers`, {
            maxMcps,
          }),
          variant: 'destructive',
        });
      } else {
        toast(INTERNAL_ERROR_TOAST);
      }
    },
  });

  const columns: ColumnDef<RowDataWithActions<McpWithTools>, unknown>[] = [
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
              setSelectedRows(allRows);
            } else {
              setSelectedRows([]);
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
                newSelectedRows.push(row.original);
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
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Name')} />
      ),
      cell: ({ row }) => <div className="text-left">{row.original.name}</div>,
    },
    {
      id: 'usedTools',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Tools')} />
      ),
      cell: ({ row }) => {
        return (
          <McpToolsIcon
            mcpTools={row.original.tools || []}
            pieceMetadataMap={pieceMetadataMap}
            isLoadingPiecesMetadata={isLoadingPiecesMetadata}
          />
        );
      },
    },
    {
      accessorKey: 'updated',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('Last Modified')} />
      ),
      cell: ({ row }) => (
        <div className="text-left">
          {formatUtils.formatDate(new Date(row.original.updated))}
        </div>
      ),
    },
  ];

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => mcpApi.delete(id)));
    },
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
    },
  });

  const bulkActions: BulkAction<McpWithTools>[] = useMemo(
    () => [
      {
        render: (_, resetSelection) => (
          <ConfirmationDeleteDialog
            title={t('Delete MCP Servers')}
            message={t(
              'Are you sure you want to delete the selected MCP servers? This action cannot be undone.',
            )}
            entityName={t('MCP server')}
            mutationFn={async () => {
              try {
                await bulkDeleteMutation.mutateAsync(
                  selectedRows.map((row) => row.id),
                );
                resetSelection();
                setSelectedRows([]);
              } catch (error) {
                console.error('Error deleting MCP servers:', error);
              }
            }}
          >
            {selectedRows.length > 0 && (
              <Button className="w-full mr-2" size="sm" variant="destructive">
                <Trash2 className="mr-2 w-4" />
                {`${t('Delete')} (${selectedRows.length})`}
              </Button>
            )}
          </ConfirmationDeleteDialog>
        ),
      },
    ],
    [selectedRows, bulkDeleteMutation],
  );

  if (isCreatingMcp) {
    return <LoadingScreen mode="container" />;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between">
        <TableTitle
          beta={true}
          description={t('Create and manage your MCP servers')}
        >
          {t('MCP Servers')}
        </TableTitle>
        <PermissionNeededTooltip hasPermission={userHasMcpWritePermission}>
          <Button 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => createMcp('Untitled')}
            disabled={!userHasMcpWritePermission}
          >
            <Plus className="h-4 w-4" />
            {t('New MCP Server')}
          </Button>
        </PermissionNeededTooltip>
      </div>

      <DataTable
        filters={[
          {
            accessorKey: 'name',
            type: 'input',
            title: t('Name'),
            icon: CheckIcon,
            options: [],
          },
        ]}
        emptyStateIcon={<Table2 className="size-14" />}
        emptyStateTextTitle={t('No MCP servers have been created yet')}
        emptyStateTextDescription={t('Create a MCP server to get started')}
        columns={columns}
        page={data}
        isLoading={isLoading}
        onRowClick={(row) => {
          const path = `/projects/${project.id}/mcp/${row.id}`;
          navigate(path);
        }}
        bulkActions={bulkActions}
      />
    </div>
  );
};

export default McpServersPage;
