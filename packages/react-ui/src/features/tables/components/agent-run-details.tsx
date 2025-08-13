import { ArrowLeft, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AgentTimeline } from '@/features/agents/agent-timeline';
import { formatUtils } from '@/lib/utils';
import { AgentRun } from '@activepieces/shared';

import { useTableState } from './ap-table-state-provider';

type RunDetailViewProps = {
  run: AgentRun;
  open: boolean;
  setOpen: (open: boolean) => void;
  onGoBack: () => void;
  trigger?: React.ReactNode;
};

export const RunDetailView = ({
  run,
  open,
  setOpen,
  onGoBack,
  trigger,
}: RunDetailViewProps) => {
  const [serverRecords] = useTableState((state) => [state.serverRecords]);
  const recordIndex =
    serverRecords?.findIndex((record) => record.id === run.metadata?.recordId) +
    1;

  return (
    <div className="relative p-6">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={() => setOpen(false)}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex flex-col space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={onGoBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-md font-semibold truncate flex-1 min-w-0">
            {String(
              run.title ?? `Run ${run.id.slice(0, 8)}. Row ${recordIndex}`,
            )}
          </h2>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {run.finishTime
              ? formatUtils.formatDate(new Date(run.finishTime))
              : 'In Progress'}
          </span>
        </div>

        <div className="space-y-3 flex flex-col">
          <span className="font-medium">Summary:</span>
          <span className="text-sm">{run.summary}</span>
        </div>

        <div className="border-t border-border pt-4">
          <AgentTimeline agentRunId={run.id} />
        </div>
      </div>
    </div>
  );
};
