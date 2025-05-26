import { useQuery } from '@tanstack/react-query';

import { LoadingSpinner } from '@/components/ui/spinner';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { authenticationSession } from '@/lib/authentication-session';
import { TriggerType, PopulatedFlow } from '@activepieces/shared';

import { McpFlowActionsDialog } from './mcp-flow-actions-dialog';

type McpFlowsContentProps = {
  searchQuery: string;
  selectedFlows: string[];
  setSelectedFlows: (value: string[] | ((prev: string[]) => string[])) => void;
};

export const McpFlowsContent = ({
  searchQuery,
  selectedFlows,
  setSelectedFlows,
}: McpFlowsContentProps) => {
  const projectId = authenticationSession.getProjectId();
  const { data: flows, isLoading: isFlowsLoading } = useQuery({
    queryKey: ['flows'],
    queryFn: async () => {
      const flows = await flowsApi
        .list({
          cursor: undefined,
          limit: 1000,
          projectId: projectId!,
        })
        .then((response) => {
          return response.data.filter(
            (flow: PopulatedFlow) =>
              flow.version.trigger.type === TriggerType.PIECE &&
              flow.version.trigger.settings.pieceName ===
                '@activepieces/piece-mcp',
          );
        });
      return flows;
    },
  });

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
