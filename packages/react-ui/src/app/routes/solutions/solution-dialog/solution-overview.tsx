import { Table, Workflow, Bot, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { ImportSolutionResponse, isNil } from '@activepieces/shared';

import { solutions } from '../solutions';

interface SolutionOverviewProps {
  solution: (typeof solutions)[0];
  onAction: () => void;
  actionLabel: string;
  actionIcon?: React.ReactNode;
  isLoading?: boolean;
  importResponse: ImportSolutionResponse | null;
}

const SolutionOverview = ({
  solution,
  onAction,
  actionLabel,
  actionIcon,
  isLoading = false,
  importResponse,
}: SolutionOverviewProps) => {
  const handleAssetClick = (id: string, type: 'flow' | 'table' | 'agent') => {
    // Open in new tab/window based on asset type
    const baseUrl = window.location.origin;
    let url = '';

    switch (type) {
      case 'flow':
        url = `${baseUrl}/flows/${id}`;
        break;
      case 'table':
        url = `${baseUrl}/tables/${id}`;
        break;
      case 'agent':
        url = `${baseUrl}/agents/${id}`;
        break;
    }

    if (url) {
      window.open(url, '_blank');
    }
  };

  const agents =
    (!isNil(importResponse) ? importResponse.agents : solution.state.agents) ??
    [];

  return (
    <div className="w-1/3 border-l pb-6 px-6 flex-shrink-0 flex flex-col">
      <div className="space-y-4 flex-1">
        {/* Solution Name */}
        <div>
          <h2 className="text-lg font-semibold">{solution.name}</h2>
        </div>

        {/* Thumbnail */}
        {solution.thumbnail && (
          <div>
            <ImageWithFallback
              src={solution.thumbnail}
              alt={solution.name}
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Assets section */}
        <div>
          <h3 className="text-base font-semibold mb-3">Assets</h3>
          <div className="space-y-2">
            {solution.state.flows.map((flow) => (
              <div
                key={flow.version.id}
                className="flex items-center justify-between text-sm font-medium"
              >
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  {flow.version.displayName}
                </div>
                {importResponse && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1"
                    onClick={() => {
                      const importedFlow = importResponse?.flows?.find(
                        (f) => f.externalId === flow.externalId,
                      );
                      if (importedFlow) {
                        handleAssetClick(importedFlow.id, 'flow');
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {solution.state.tables?.map((table) => (
              <div
                key={table.externalId || table.id}
                className="flex items-center justify-between text-sm font-medium"
              >
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  {table.name}
                </div>
                {importResponse && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1"
                    onClick={() => {
                      const importedTable = importResponse?.tables?.find(
                        (t) => t.externalId === table.externalId,
                      );
                      if (importedTable) {
                        handleAssetClick(importedTable.id, 'table');
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {agents.map((agent, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm font-medium"
              >
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  {agent.displayName}
                </div>
                {importResponse && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1"
                    onClick={() => {
                      const importedAgent = importResponse.agents?.find(
                        (a) => a.externalId === agent.externalId,
                      );
                      if (importedAgent) {
                        handleAssetClick(importedAgent.id, 'agent');
                      }
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Connections section */}
        {solution.state.connections &&
          solution.state.connections.length > 0 && (
            <div>
              <h3 className="text-base font-semibold mb-3">Connections</h3>
              <div className="space-y-2">
                {solution.state.connections.map((connection) => (
                  <div
                    key={connection.externalId}
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <PieceIconWithPieceName
                      pieceName={connection.pieceName}
                      size="sm"
                    />

                    {connection.displayName}
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Action button at bottom */}
      <div className="mt-6">
        <Button className="w-full" onClick={onAction} disabled={isLoading}>
          {actionIcon}
          {isLoading ? 'Importing...' : actionLabel}
        </Button>
      </div>
    </div>
  );
};

export { SolutionOverview };
