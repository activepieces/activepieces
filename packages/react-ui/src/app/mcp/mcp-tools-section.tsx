import { t } from 'i18next';
import { Plus, ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PermissionNeededTooltip } from '@/components/ui/permission-needed-tooltip';
import { PopulatedFlow, McpPieceWithConnection } from '@activepieces/shared';

import { McpFlowCard } from './mcp-flow-card';
import { McpPiece } from './mcp-piece';
import { McpPieceDialog } from './mcp-piece-dialog';

// Define a union type for tool items
type ToolItem = McpPieceWithConnection | PopulatedFlow;

interface McpToolsProps {
  title: string;
  tools: ToolItem[];
  emptyMessage: React.ReactNode;
  isLoading: boolean;
  type: 'pieces' | 'flows';
  onAddClick: () => void;
  onToolClick?: (tool: PopulatedFlow) => void;
  onToolDelete?: (tool: McpPieceWithConnection) => void;
  pieceInfoMap?: Record<string, { displayName: string; logoUrl?: string }>;
  canAddTool: boolean;
  addButtonLabel: string;
  isPending?: boolean;
}

export const McpToolsSection = ({
  title,
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
}: McpToolsProps) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleTools = isExpanded ? tools : tools.slice(0, 3);
  const hasMoreTools = tools.length > 3;

  const renderAddButton = () => {
    // Only render the button if there's at least one tool
    if (tools.length === 0) {
      return null;
    }

    if (type === 'pieces') {
      return (
        <PermissionNeededTooltip hasPermission={canAddTool}>
          <McpPieceDialog>
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1"
              disabled={!canAddTool || isPending}
            >
              <Plus className="h-4 w-4" />
              {addButtonLabel}
            </Button>
          </McpPieceDialog>
        </PermissionNeededTooltip>
      );
    } else {
      return (
        <PermissionNeededTooltip hasPermission={canAddTool}>
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
        </PermissionNeededTooltip>
      );
    }
  };

  const renderSkeletons = () => {
    if (type === 'pieces') {
      return Array(3)
        .fill(0)
        .map((_, index) => (
          <McpPiece
            key={`skeleton-${index}`}
            piece={{} as McpPieceWithConnection}
            pieceInfo={{ displayName: '', logoUrl: '' }}
            onDelete={() => {}}
            isLoading={true}
            hasPermissionToEdit={canAddTool}
          />
        ));
    } else {
      return Array(3)
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
    if (type === 'pieces') {
      return (
        <PermissionNeededTooltip hasPermission={canAddTool}>
          <McpPieceDialog>
            <Button
              className="w-64 p-0 h-auto hover:bg-transparent"
              variant="ghost"
              disabled={!canAddTool}
            >
              <div
                className={`w-full flex flex-col items-center justify-center py-6 px-5 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow bg-white`}
                style={{ minHeight: '160px' }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`rounded-full ${
                      theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'
                    } p-2.5 mb-1`}
                  >
                    <Plus
                      className={`h-5 w-5 ${
                        theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
                      }`}
                    />
                  </div>
                  <p
                    className={`font-medium text-base ${
                      theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {t(addButtonLabel)}
                  </p>
                  <p
                    className={`text-xs mt-0.5 text-center ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                    }`}
                    style={{
                      maxWidth: '200px',
                      whiteSpace: 'normal',
                      wordWrap: 'break-word',
                    }}
                  >
                    {t('Connect your AI assistant to external services')}
                  </p>
                </div>
              </div>
            </Button>
          </McpPieceDialog>
        </PermissionNeededTooltip>
      );
    } else {
      return emptyMessage || null;
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground text-lg">{title}</h3>
        </div>
        {renderAddButton()}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          renderSkeletons()
        ) : tools.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {visibleTools.map((tool) => {
              if (type === 'pieces') {
                const piece = tool as McpPieceWithConnection;
                const pieceInfo = pieceInfoMap[piece.id] || {
                  displayName: piece.pieceName,
                  logoUrl: '',
                };

                return (
                  <McpPiece
                    key={piece.id}
                    piece={piece}
                    pieceInfo={pieceInfo}
                    onDelete={() => onToolDelete && onToolDelete(piece)}
                    hasPermissionToEdit={canAddTool}
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
