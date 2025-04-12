import { t } from 'i18next';
import { Hammer, Info, Plus, ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';

import { NewConnectionDialog } from '@/app/connections/new-connection-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AppConnectionWithoutSensitiveData,
  PopulatedFlow,
} from '@activepieces/shared';

import { McpConnection } from './mcp-connection';
import { McpFlowCard } from './mcp-flow-card';

interface McpToolsProps {
  title: string;
  description?: string;
  tools: AppConnectionWithoutSensitiveData[] | PopulatedFlow[];
  emptyMessage: React.ReactNode;
  isLoading: boolean;
  type: 'connections' | 'flows';
  onAddClick: () => void;
  onToolClick?: (tool: PopulatedFlow) => void;
  onToolDelete?: (tool: AppConnectionWithoutSensitiveData) => void;
  pieceInfoMap?: Record<string, { displayName: string; logoUrl?: string }>;
  canAddTool: boolean;
  addButtonLabel: string;
  isPending?: boolean;
  onConnectionCreated?: (connection: AppConnectionWithoutSensitiveData) => void;
}

export const McpToolsSection = ({
  title,
  description,
  tools,
  emptyMessage,
  isLoading,
  type,
  onAddClick,
  onToolClick,
  onToolDelete,
  pieceInfoMap = {},
  canAddTool,
  addButtonLabel,
  isPending,
  onConnectionCreated,
}: McpToolsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // We always want to show at least one row (4 items)
  const visibleTools = isExpanded ? tools : tools.slice(0, 4);
  const hasMoreTools = tools.length > 4;

  const renderAddButton = () => {
    if (type === 'connections' && onConnectionCreated) {
      return (
        <NewConnectionDialog
          onConnectionCreated={onConnectionCreated}
          isGlobalConnection={false}
        >
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-1"
            disabled={!canAddTool || isPending}
          >
            <Plus className="h-4 w-4" />
            {addButtonLabel}
          </Button>
        </NewConnectionDialog>
      );
    } else {
      return (
        <Button
          variant="default"
          size="sm"
          className="flex items-center gap-1"
          onClick={onAddClick}
          disabled={!canAddTool || isPending}
        >
          <Plus className="h-4 w-4" />
          {addButtonLabel}
        </Button>
      );
    }
  };

  const renderSkeletons = () => {
    if (type === 'connections') {
      return Array(4)
        .fill(0)
        .map((_, index) => (
          <McpConnection
            key={`skeleton-${index}`}
            connection={{} as AppConnectionWithoutSensitiveData}
            isUpdating={false}
            pieceInfo={{ displayName: '', logoUrl: '' }}
            onDelete={() => {}}
            isLoading={true}
          />
        ));
    } else {
      return Array(4)
        .fill(0)
        .map((_, index) => (
          <Card
            key={`flow-skeleton-${index}`}
            className="overflow-hidden transition-all duration-200 relative hover:shadow-sm group border-border"
          >
            <div className="p-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-24 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
            </div>
          </Card>
        ));
    }
  };

  const renderEmptyState = () => {
    if (type === 'connections' && onConnectionCreated) {
      // For connections, we need to replace the button in the empty message with our dialog
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
          <div className="rounded-full bg-muted/50 p-3 mb-3">
            <Hammer className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <p className="font-medium text-foreground">
            {t('No MCP Connections Added')}
          </p>
          <p className="text-sm mt-1 max-w-md text-center">
            {t(
              "Add connections to enhance your AI assistant's capabilities. Your assistant will be able to interact with your Activepieces data and perform actions on your behalf.",
            )}
          </p>
          <NewConnectionDialog
            onConnectionCreated={onConnectionCreated}
            isGlobalConnection={false}
          >
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1 mt-4"
            >
              <Plus className="h-4 w-4" />
              {t('Add Your First MCP Connection')}
            </Button>
          </NewConnectionDialog>
        </div>
      );
    } else {
      return emptyMessage || null;
    }
  };

  return (
    <div className="space-y-5 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">{title}</h3>
          </div>
          {description && (
            <div className="flex items-center gap-2 mt-1">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {description}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">{renderAddButton()}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          renderSkeletons()
        ) : tools.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {visibleTools.map((tool) => {
              if (type === 'connections') {
                const connection = tool as AppConnectionWithoutSensitiveData;
                const pieceInfo = pieceInfoMap[connection.id] || {
                  displayName: connection.pieceName,
                  logoUrl: '',
                };
                return (
                  <McpConnection
                    key={connection.id}
                    connection={connection}
                    isUpdating={false}
                    pieceInfo={pieceInfo}
                    onDelete={() => onToolDelete && onToolDelete(connection)}
                  />
                );
              } else {
                const flow = tool as PopulatedFlow;
                return (
                  <McpFlowCard
                    key={flow.id}
                    flow={flow}
                    onClick={() => onToolClick && onToolClick(flow)}
                  />
                );
              }
            })}
          </>
        )}
      </div>

      {hasMoreTools && !isLoading && tools.length > 0 && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1 px-8"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ArrowUp className="h-4 w-4" />
                {t('Collapse')}
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4" />
                {t('Show All')} ({tools.length})
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
