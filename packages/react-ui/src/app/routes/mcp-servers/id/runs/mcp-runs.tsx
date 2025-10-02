import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { Activity } from 'lucide-react';
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { DataTable } from '@/components/ui/data-table';
import { mcpRunApi } from '@/features/mcp/lib/mcp-run-api';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { McpRun, McpRunStatus } from '@activepieces/shared';

import McpRunDetails from './mcp-run-details';
import { mcpRunColumns, mcpRunFilters } from './mcp-run-utils';

export const McpHistoryPage = () => {
  const { mcpId, projectId } = useParams();
  const [searchParams] = useSearchParams();
  const { metadata, isLoading: isPiecesLoading } =
    stepsHooks.useAllStepsMetadata({
      searchQuery: '',
      type: 'action',
    });

  const [selectedItem, setSelectedItem] = useState<McpRun | null>(null);

  const { data: runs, isLoading } = useQuery({
    queryKey: ['mcp-runs', mcpId, searchParams.toString()],
    queryFn: () => {
      const metadata = searchParams.get('metadata');
      const statusParams = searchParams.getAll('status') as McpRunStatus[];
      const status = statusParams.length > 0 ? statusParams : undefined;
      const cursor = searchParams.get('cursorRequest');
      const limit = searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10;

      return mcpRunApi.list({
        projectId: projectId!,
        mcpId: mcpId!,
        cursorRequest: cursor ?? undefined,
        limit,
        metadata: metadata ?? undefined,
        status,
      });
    },
    enabled: !!mcpId,
  });

  const columns = mcpRunColumns(metadata ?? []);
  const filters = mcpRunFilters();

  return (
    <div className="w-full ">
      <div className="flex items-center justify-between">
        <div className="space-y-0 mb-4">
          <h1 className="text-xl font-semibold tracking-tight">
            {t('Tool Usage History')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('Track and monitor your MCP tool executions')}
          </p>
        </div>
      </div>

      <DataTable
        emptyStateTextTitle={t('No tool executions yet')}
        emptyStateTextDescription={t(
          'Tool executions will appear here once they start running',
        )}
        emptyStateIcon={<Activity className="size-14" />}
        columns={columns}
        page={runs}
        isLoading={isLoading || isPiecesLoading}
        filters={filters}
        onRowClick={(row) => {
          setSelectedItem(row);
        }}
      />

      {selectedItem && (
        <McpRunDetails
          selectedItem={selectedItem}
          metadata={metadata ?? []}
          setSelectedItem={setSelectedItem}
        />
      )}
    </div>
  );
};

McpHistoryPage.displayName = 'McpHistoryPage';

export default McpHistoryPage;
