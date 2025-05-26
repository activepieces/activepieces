import { useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { mcpToolHistoryApi } from '@/features/mcp/lib/mcp-tool-history-api';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { formatUtils } from '@/lib/utils';
import { McpToolHistory, McpToolHistoryStatus } from '@activepieces/shared';

import {
  getToolIcon,
  getToolDisplayName,
  getActionName,
  getTooltipContent,
  copyToClipboard,
  formatJsonData,
  createColumns,
  createFilters,
  calculateStats,
  renderCopyButton,
} from './mcp-history-utils';

type McpHistoryPageProps = {
  mcpId?: string;
};

export const McpHistoryPage = ({ mcpId: propMcpId }: McpHistoryPageProps) => {
  const { mcpId: paramMcpId } = useParams();
  const mcpId = propMcpId || paramMcpId;
  const [searchParams] = useSearchParams();
  const { metadata, isLoading: isPiecesLoading } =
    piecesHooks.useAllStepsMetadata({
      searchQuery: '',
      type: 'action',
    });

  const [selectedItem, setSelectedItem] = useState<McpToolHistory | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    data: historyItems,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['mcp-tool-history', mcpId, searchParams.toString()],
    queryFn: () => {
      const metadata = searchParams.get('metadata');
      const statusParams = searchParams.getAll(
        'status',
      ) as McpToolHistoryStatus[];
      const status = statusParams.length > 0 ? statusParams : undefined;
      const cursor = searchParams.get('cursorRequest');
      const limit = searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 10;

      return mcpToolHistoryApi.list({
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

  const handleCopyToClipboard = (text: string, fieldName: string) => {
    copyToClipboard(text, fieldName, setCopiedField);
  };

  if (!mcpId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('No MCP server selected')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('Tool Usage History')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('Track and monitor your MCP tool executions')}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading || isPiecesLoading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
          />
          {t('Refresh')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <Activity className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('Total Executions')}
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('Successful')}
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.successful}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('Failed')}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.failed}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DataTable */}
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
        hidePagination={true}
        onRowClick={(row) => {
          setSelectedItem(row);
        }}
      />

      {/* Detail Sheet */}
      <Sheet open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <SheetContent className="w-[600px] sm:w-[700px] sm:max-w-none">
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
                  {selectedItem.status === McpToolHistoryStatus.SUCCESS ? (
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
                  {/* Input */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        {t('Input')}
                        {renderCopyButton(
                          formatJsonData(selectedItem.input),
                          'input',
                          copiedField,
                          handleCopyToClipboard,
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {formatJsonData(selectedItem.input)}
                      </pre>
                    </CardContent>
                  </Card>

                  {/* Output */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        {t('Output')}
                        {renderCopyButton(
                          formatJsonData(selectedItem.output),
                          'output',
                          copiedField,
                          handleCopyToClipboard,
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                        {formatJsonData(selectedItem.output)}
                      </pre>
                    </CardContent>
                  </Card>
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
