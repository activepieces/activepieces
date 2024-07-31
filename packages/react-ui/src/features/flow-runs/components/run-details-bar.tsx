import { QuestionMarkIcon } from '@radix-ui/react-icons';
import React from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { FlowRun } from '@activepieces/shared';

import { flowRunUtils } from '../lib/flow-run-utils';

type RunDetailsBarProps = {
  run?: FlowRun;
  exitRun: () => void;
};
const RunDetailsBar = React.memo(({ run, exitRun }: RunDetailsBarProps) => {
  const { Icon } = run
    ? flowRunUtils.getStatusIcon(run.status)
    : { Icon: QuestionMarkIcon };

  if (!run) {
    return <></>;
  }
  return (
    <div
      className="fixed bottom-4 p-4 left-1/2 transform -translate-x-1/2 w-[400px] bg-secondary border border-solid h-16 flex items-center justify-start 
       rounded-lg z-[9999]"
    >
      <Icon className="w-6 h-6 mr-3 text-success" />
      <div className="flex-col flex flex-grow text-secondary-foreground gap-0">
        <div className="text-md">Run Succeeded</div>
        <div className="text-sm text-muted-foreground">{run?.id}</div>
      </div>
      <Button variant={'outline'} onClick={exitRun}>
        Exit Run
      </Button>
    </div>
  );
});

RunDetailsBar.displayName = 'RunDetailsBar';
export { RunDetailsBar };
