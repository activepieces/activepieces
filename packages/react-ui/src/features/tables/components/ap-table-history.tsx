import { Play, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatUtils } from '@/lib/utils';

import { RunDetailView } from './agent-run-details';
import { useTableState } from './ap-table-state-provider';

type ApTableHistoryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function ApTableHistory({
  open,
  onOpenChange,
  trigger,
}: ApTableHistoryProps) {
  const [runs, serverRecords] = useTableState((state) => [
    state.runs,
    state.serverRecords,
  ]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [isRunDetailOpen, setIsRunDetailOpen] = useState(false);

  const sortedRuns = runs
    ? [...runs].sort((a, b) => {
        // Failed runs first, then by creation date (newest first)
        if (a.status === 'FAILED' && b.status !== 'FAILED') return -1;
        if (b.status === 'FAILED' && a.status !== 'FAILED') return 1;
        return new Date(b.created).getTime() - new Date(a.created).getTime();
      })
    : [];

  const selectedRunData = selectedRun
    ? sortedRuns.find((run) => run.id === selectedRun)
    : null;

  const content = (
    <div>
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          onOpenChange(newOpen);
          if (!newOpen) {
            setSelectedRun(null);
            setIsRunDetailOpen(false);
          }
        }}
      >
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          className="w-[500px] max-h-[85vh] overflow-y-auto p-0"
          align="end"
          side="bottom"
          sideOffset={30}
        >
          {selectedRunData && (
            <RunDetailView
              run={selectedRunData}
              open={isRunDetailOpen}
              setOpen={setIsRunDetailOpen}
              onGoBack={() => setSelectedRun(null)}
              trigger={<div />}
            />
          )}
          {!selectedRunData && (
            <div className="relative p-6">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex flex-col space-y-6">
                <div className="text-center">
                  <h2 className="text-lg font-semibold">
                    AI Agent Run History
                  </h2>
                </div>

                <ScrollArea className=" w-full">
                  {sortedRuns && sortedRuns.length > 0 ? (
                    sortedRuns.map((run) => {
                      const isFailed = run.status === 'FAILED';
                      const responsePreview = run.title ?? '';
                      const truncatedResponse =
                        run.summary && run.summary.length > 200
                          ? run.summary?.substring(0, 200) + '...'
                          : run.summary;
                      const recordIndex =
                        serverRecords?.findIndex(
                          (record) => record.id === run.metadata?.recordId,
                        ) + 1;

                      return (
                        <div
                          key={run.id}
                          className={`p-3 rounded-lg mb-3 cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                            isFailed ? 'bg-red-50' : 'bg-muted'
                          }`}
                          onClick={() => {
                            setSelectedRun(run.id);
                            setIsRunDetailOpen(true);
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            {isFailed ? (
                              <div className="flex gap-2 mb-1 flex-col">
                                <span className="text-xs font-medium text-red-700">
                                  Agent error .{' '}
                                  {run.finishTime
                                    ? formatUtils.formatDate(
                                        new Date(run.finishTime),
                                      )
                                    : 'In Progress'}
                                </span>
                                <div className="text-sm font-light line-clamp-2">
                                  {truncatedResponse}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mb-1 w-full">
                                  {run.metadata?.recordId && (
                                    <span className="text-xs whitespace-nowrap">
                                      Row {recordIndex}:
                                    </span>
                                  )}
                                  <span className="text-xs font-medium truncate flex-1">
                                    {responsePreview}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {' '}
                                    {run.finishTime
                                      ? formatUtils.formatDate(
                                          new Date(run.finishTime),
                                        )
                                      : 'In Progress'}{' '}
                                  </span>
                                </div>
                                <div className="text-sm font-light line-clamp-2">
                                  {truncatedResponse}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Play className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-sm font-medium">No activity yet</p>
                      <p className="text-xs text-center font-light max-w-64">
                        Your AI agent will show completed tasks here once you
                        start using it
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );

  if (open) {
    return content;
  }

  return (
    <Tooltip delayDuration={50}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>
        <p>Runs History</p>
      </TooltipContent>
    </Tooltip>
  );
}
