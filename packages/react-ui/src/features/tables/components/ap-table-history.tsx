import { Play, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatUtils } from '@/lib/utils';

import { RunDetailView } from './agent-run-details';
import { useTableState } from './ap-table-state-provider';

type ApTableHistoryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function ApTableHistory({ open, onOpenChange, trigger }: ApTableHistoryProps) {
  const [runs, serverRecords] = useTableState((state) => [
    state.runs,
    state.serverRecords,
  ]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [isRunDetailOpen, setIsRunDetailOpen] = useState(false);
  console.log('runs', runs);
  console.log('serverRecords', serverRecords);


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

  if (selectedRunData) {
    return (
      <RunDetailView
        run={selectedRunData}
        open={isRunDetailOpen}
        setOpen={setIsRunDetailOpen}
        onGoBack={() => setSelectedRun(null)}
        trigger={<div />}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div onClick={(e) => e.preventDefault()}>{trigger}</div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[500px] max-h-[85vh] overflow-y-auto p-0 z-[9999]"
        align="end"
        side="bottom"
        sideOffset={8}
      >
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
              <h2 className="text-lg font-semibold">AI Agent Run History</h2>
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
                  const recordIndex = serverRecords?.findIndex(
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
                              {run.finishTime ? formatUtils.formatDate(new Date(run.finishTime)) : 'In Progress'}
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
                              <span className="text-xs text-muted-foreground"> {run.finishTime ? formatUtils.formatDate(new Date(run.finishTime)) : 'In Progress'} </span>
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
                  <p className="text-sm">No agent runs yet</p>
                  <p className="text-xs">
                    Agent runs will appear here after execution
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
