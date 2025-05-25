import { useQuery } from '@tanstack/react-query';

import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/ui/spinner';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { authenticationSession } from '@/lib/authentication-session';
import { TriggerType, PopulatedFlow } from '@activepieces/shared';

import { McpFlowActionsDialog } from './mcp-flow-actions-dialog';

type McpFlowsContentProps = {
  selectedFlows: string[];
  setSelectedFlows: (value: string[] | ((prev: string[]) => string[])) => void;
};

export const McpFlowsContent = ({
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

  return (
    <div className="flex flex-col h-[calc(100vh-300px)]">
      {isFlowsLoading && (
        <div className="flex items-center justify-center w-full flex-1">
          <LoadingSpinner />
        </div>
      )}
      {!isFlowsLoading && (
        <ScrollArea className="flex-1">
          <div className="pr-4">
            <McpFlowActionsDialog
              flows={flows || []}
              selectedFlows={selectedFlows}
              setSelectedFlows={setSelectedFlows}
            />
          </div>
        </ScrollArea>
      )}
    </div>
  );
};
