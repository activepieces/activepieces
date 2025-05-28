import { LoadingSpinner } from '@/components/ui/spinner';
import { PopulatedFlow } from '@activepieces/shared';

import { McpFlowActionsDialog } from './mcp-flow-actions-dialog';

type McpFlowsContentProps = {
  flows: PopulatedFlow[];
  searchQuery: string;
  selectedFlows: string[];
  setSelectedFlows: (value: string[] | ((prev: string[]) => string[])) => void;
  isFlowsLoading: boolean;
};

export const McpFlowsContent = ({
  flows,
  searchQuery,
  selectedFlows,
  setSelectedFlows,
  isFlowsLoading,
}: McpFlowsContentProps) => {
  if (isFlowsLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <McpFlowActionsDialog
      flows={flows || []}
      searchQuery={searchQuery}
      selectedFlows={selectedFlows}
      setSelectedFlows={setSelectedFlows}
    />
  );
};
