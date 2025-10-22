import { ColumnDef } from '@tanstack/react-table';
import { t } from 'i18next';
import { Plus, Trash2, Table2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { DashboardPageHeader } from '@/components/custom/dashboard-page-header';
import { PermissionNeededTooltip } from '@/components/custom/permission-needed-tooltip';
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
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { formatUtils, NEW_MCP_QUERY_PARAM } from '@/lib/utils';
import { PieceMetadataModelSummary } from '@activepieces/pieces-framework';
import { McpWithTools, Permission } from '@activepieces/shared';

import { McpToolsIcon } from './mcp-tools-icon';

const McpServersPage = () => {
  const navigate = useNavigate();
  const [selectedRows, setSelectedRows] = useState<McpWithTools[]>([]);
  const { data: project } = projectHooks.useCurrentProject();
  const [searchParams] = useSearchParams();
  const { platform } = platformHooks.useCurrentPlatform();
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

  const createMcpMutation = mcpHooks.useCreateMcp();

  const createMcp = (name: string) => {
    createMcpMutation.mutate(name, {
      onSuccess: (newMcpServer) => {
        refetch();
        navigate(
          `/projects/${project.id}/mcps/${newMcpServer.id}?${NEW_MCP_QUERY_PARAM}=true`,
        );
      },
    });
  };

  const isCreatingMcp = createMcpMutation.isPending;

  const columns: ColumnDef<RowDataWithActions<McpWithTools>, unknown>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            table.getIsSomePageRowsSelected()
          }
          variant="secondary"
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
            variant="secondary"
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

  const deleteMcpMutation = mcpHooks.useDeleteMcp();

  const bulkDeleteMutation = {
    mutateAsync: async (ids: string[]) => {
      await Promise.all(ids.map((id) => deleteMcpMutation.mutateAsync(id)));
    },
    isPending: deleteMcpMutation.isPending,
  };

  const bulkActions: BulkAction<McpWithTools>[] = useMemo(
    () => [
      {
        render: (_, __) => (
          <PermissionNeededTooltip hasPermission={userHasMcpWritePermission}>
            <Button
              className="flex items-center gap-2"
              onClick={() => createMcp('Untitled')}
              disabled={!userHasMcpWritePermission}
            >
              <Plus className="h-4 w-4" />
              {t('New MCP Server')}
            </Button>
          </PermissionNeededTooltip>
        ),
      },
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
                refetch();
                resetSelection();
                setSelectedRows([]);
              } catch (error) {
                toast(INTERNAL_ERROR_TOAST);
              }
            }}
          >
            {selectedRows.length > 0 && (
              <Button variant="destructive">
                <Trash2 className="w-4" />
                {`${t('Delete')} (${selectedRows.length})`}
              </Button>
            )}
          </ConfirmationDeleteDialog>
        ),
      },
    ],
    [selectedRows, bulkDeleteMutation, refetch],
  );

  if (isCreatingMcp) {
    return <LoadingScreen mode="container" />;
  }

  return (
    <LockedFeatureGuard
      featureKey="MCPS"
      locked={!platform.plan.mcpsEnabled}
      lockTitle={t('MCP Servers')}
      lockDescription={t('Create and manage your MCP servers')}
    >
      <div className="flex flex-col h-full">
        <DashboardPageHeader
          title={t('MCP Servers')}
          description={t('Create and manage your MCP servers')}
          tutorialTab="mcpServers"
        ></DashboardPageHeader>

        <DataTable
          filters={[]}
          emptyStateIcon={<Table2 className="size-14" />}
          emptyStateTextTitle={t('No MCP servers have been created yet')}
          emptyStateTextDescription={t('Create a MCP server to get started')}
          columns={columns}
          page={data}
          isLoading={isLoading}
          onRowClick={(row) => {
            navigate(`/projects/${project.id}/mcps/${row.id}`);
          }}
          bulkActions={bulkActions}
        />
      </div>
    </LockedFeatureGuard>
  );
};

export default McpServersPage;
