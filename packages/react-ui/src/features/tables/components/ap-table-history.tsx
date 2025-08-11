import { Play, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatUtils } from '@/lib/utils';

import { RunDetailView } from './agent-run-details';
import { useTableState } from './ap-table-state-provider';

type ApTableHistoryProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ApTableHistory({ open, onOpenChange }: ApTableHistoryProps) {
  const [runs, serverRecords] = useTableState((state) => [
    state.runs,
    state.serverRecords,
  ]);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  console.log('runs', runs);
  console.log('serverRecords', serverRecords);

  if (!open) {
    return null;
  }

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
        onGoBack={() => setSelectedRun(null)}
        onClose={() => onOpenChange(false)}
      />
    );
  }

  return (
    <div className="absolute right-0 top-0 z-50">
      <div className="flex bg-background flex-col h-[85vh] w-[500px] border items-center mt-4 mr-4 rounded-lg relative overflow-hidden animate-in slide-in-from-right duration-100 ease-out ease-in">
        <div className="flex w-full pt-6 px-4 mb-3 justify-between">
          <h2 className="text-lg font-semibold">AI Agent Run History</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 absolute right-2 top-1"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-full p-4 w-full flex">
          {sortedRuns && sortedRuns.length > 0 ? (
            sortedRuns.map((run) => {
              const isFailed = run.status === 'FAILED';
              const responsePreview = run.message ?? '';
              const truncatedResponse =
                responsePreview.length > 200
                  ? responsePreview.substring(0, 200) + '...'
                  : responsePreview;
              const recordIndex = serverRecords?.findIndex(
                (record) => record.id === run.metadata?.recordId,
              );
              console.log('recordIndex', recordIndex);

              return (
                <div
                  key={run.id}
                  className={`p-3 rounded-lg mb-5  cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                    isFailed ? 'bg-red-50' : 'bg-muted'
                  }`}
                  onClick={() => setSelectedRun(run.id)}
                >
                  <div className="flex-1 min-w-0">
                    {isFailed ? (
                      <div className="flex  gap-2 mb-1 flex-col">
                        <span className="text-xs font-medium text-red-700">
                          Agent error .{' '}
                          {formatUtils.formatDate(new Date(run.created))}
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
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
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
  );
}
