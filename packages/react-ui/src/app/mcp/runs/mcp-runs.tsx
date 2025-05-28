import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { JsonViewer } from '@/components/json-viewer';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  TooltipContent,
  Tooltip,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { mcpRunApi } from '@/features/mcp/lib/mcp-run-api';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { formatUtils } from '@/lib/utils';
import { McpRun, McpRunStatus } from '@activepieces/shared';

import {
  getToolIcon,
  getToolDisplayName,
  getActionName,
  getTooltipContent,
  createColumns,
  createFilters,
  calculateStats,
} from './mcp-run-utils';

type McpHistoryPageProps = {
  mcpId?: string;
};

export const McpHistoryPage = ({ mcpId: propMcpId }: McpHistoryPageProps) => {
  const { mcpId: paramMcpId, projectId } = useParams();
  const mcpId = propMcpId || paramMcpId;
  const [searchParams] = useSearchParams();
  const { metadata, isLoading: isPiecesLoading } =
    piecesHooks.useAllStepsMetadata({
      searchQuery: '',
      type: 'action',
    });

  const [selectedItem, setSelectedItem] = useState<McpRun | null>(null);

  const {
    data: historyItems,
    isLoading,
    refetch,
  } = useQuery({
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

  const pageData = historyItems;
  const stats = useMemo(() => calculateStats(historyItems), [historyItems]);
  const columns = useMemo(() => createColumns(metadata), [metadata]);
  const filters = useMemo(() => createFilters(), []);

  if (!mcpId) {
    return (<></>);
  }

  return (
    <div className="w-full ">
      <div className="flex items-center justify-between">
        <div className="space-y-0">
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
        page={pageData}
        isLoading={isLoading || isPiecesLoading}
        filters={filters}
        onRowClick={(row) => {
          setSelectedItem(row);
        }}
      />

      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent
          className="w-[600px] sm:w-[700px] sm:max-w-none"
          hideCloseButton={true}
        >
          {selectedItem && (
            <>
              <SheetHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <SheetTitle className="flex items-center gap-2">
                    {getToolIcon(selectedItem, metadata)}
                    {getActionName(selectedItem)}
                  </SheetTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItem(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <SheetDescription className="flex items-center gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>{getToolDisplayName(selectedItem)}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{getTooltipContent(selectedItem)}</p>
                    </TooltipContent>
                  </Tooltip>
                  <span>•</span>
                  <span>
                    {formatUtils.formatDate(new Date(selectedItem.created))}
                  </span>
                  <span>•</span>
                  {selectedItem.status === McpRunStatus.SUCCESS ? (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700">
                      <CheckCircle2 className="h-3 w-3" />
                      <span className="text-xs font-medium">
                        {t('Success')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs font-medium">{t('Failed')}</span>
                    </div>
                  )}
                </SheetDescription>
              </SheetHeader>

              <ScrollArea className="h-[calc(100vh-120px)] mt-6">
                <div className="space-y-6">
                  <JsonViewer json={selectedItem.input} title={t('Input')} />
                  <JsonViewer json={selectedItem.output} title={t('Output')} />
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

McpHistoryPage.displayName = 'McpHistoryPage';

export default McpHistoryPage;
