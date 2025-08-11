import { ArrowLeft, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AgentTimeline } from '@/features/agents/agent-timeline';
import { AgentRun } from '@activepieces/shared';

import { useTableState } from './ap-table-state-provider';

type RunDetailViewProps = {
  run: AgentRun;
  onGoBack: () => void;
  onClose: () => void;
};

export const RunDetailView = ({
  run,
  onGoBack,
  onClose,
}: RunDetailViewProps) => {
  const [serverRecords] = useTableState((state) => [state.serverRecords]);
  const recordIndex = serverRecords?.findIndex(
    (record) => record.id === run.metadata?.recordId,
  ) + 1;
  return (
    <div className="absolute right-0 t  op-0 z-50">
      <div className="flex bg-background flex-col h-[85vh] w-[500px] border items-center mt-4 mr-4 rounded-lg relative overflow-hidden">
        <div className="flex w-full pt-6 px-4 mb-3 justify-between flex-col">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onGoBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-md font-semibold truncate">
              {String(run.title ?? `Run ${run.id.slice(0, 8)}. Row ${recordIndex}`)}
            </h2>
          </div>
          <div className="flex  gap-3 flex-col mt-4">
            <span>Summary: </span>
            <span className="text-sm">
              {run.summary}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 flex flex-col p-4 pb-10 w-full">
          <AgentTimeline agentRunId={run.id} />
        </div>
      </div>
    </div>
  );
};
