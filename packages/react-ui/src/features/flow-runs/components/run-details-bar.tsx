import { FlowRun } from '@activepieces/shared';
import React from 'react';

import { flowRunUtils } from '../lib/flow-run-utils';

import { Button } from '@/components/ui/button';

type RunDetailsBarProps = {
  run: FlowRun;
  onExitRun?: () => void;
};

const RunDetailsBar = React.memo(({ run, onExitRun }: RunDetailsBarProps) => {
  const { Icon } = flowRunUtils.getStatusIcon(run.status);

  return (
    <div
      className="fixed bottom-4 p-4 left-1/2 transform -translate-x-1/2 w-[400px] bg-secondary border border-solid h-16 flex items-center justify-start 
       rounded-lg z-[9999]"
    >
      <Icon className="w-6 h-6 mr-3 text-success" />
      <div className="flex-col flex flex-grow text-secondary-foreground gap-0">
        <div className="text-md">Run Succeeded</div>
        <div className="text-sm text-muted-foreground">{run.id}</div>
      </div>
      <Button variant={'outline'} onClick={onExitRun}>
        Exit Run
      </Button>
    </div>
  );
});

RunDetailsBar.displayName = 'RunDetailsBar';
export { RunDetailsBar };
