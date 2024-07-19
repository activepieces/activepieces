import { ChevronLeft } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { CardList } from '@/components/ui/card-list';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { LeftSideBarType, useBuilderStateContext } from '@/hooks/builder-hooks';
import {
  Action,
  FlowVersion,
  StepOutput,
  Trigger,
  assertNotNullOrUndefined,
  flowHelper,
} from '@activepieces/shared';

import { SidebarHeader } from '../sidebar-header';

import { FlowStepDetailsCardItem } from './flow-step-details-card-item';
import { FlowStepInputOutput } from './flow-step-input-output';

type StepDetails = {
  step: Action | Trigger;
  stepOutput: StepOutput;
};

const FlowRunDetails = React.memo(() => {
  const { setLeftSidebar, run, flowVersion } = useBuilderStateContext(
    (state) => state,
  );
  const [stepDetails, setStepDetails] = useState<StepDetails[]>([]);

  useEffect(() => {
    const stepDetails = run?.steps
      ? Object.keys(run.steps).map((stepName: string) =>
          getStepDetails(run.steps[stepName], stepName, flowVersion),
        )
      : [];
    setStepDetails(stepDetails);
  }, [run, flowVersion]);

  return (
    <ResizablePanelGroup direction="vertical">
      <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
        <div className="flex gap-2 justify-center items-center">
          <Button
            variant="ghost"
            size={'sm'}
            onClick={() => setLeftSidebar(LeftSideBarType.RUNS)}
          >
            <ChevronLeft size={16} />
          </Button>
          <span>Run Details</span>
        </div>
      </SidebarHeader>
      <ResizablePanel>
        <CardList className="p-0">
          {run &&
            run.steps &&
            stepDetails.map(({ step, stepOutput }: StepDetails) => (
              <FlowStepDetailsCardItem
                stepOutput={stepOutput}
                step={step}
                key={step.name}
              />
            ))}
        </CardList>
      </ResizablePanel>
      <ResizableHandle withHandle={true} />
      <ResizablePanel defaultValue={25}>
        <FlowStepInputOutput></FlowStepInputOutput>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
});

FlowRunDetails.displayName = 'FlowRunDetails';
export { FlowRunDetails };

function getStepDetails(
  stepOutput: StepOutput,
  key: string,
  version: FlowVersion,
) {
  const step = flowHelper.getStep(version, key);
  assertNotNullOrUndefined(step, 'step');
  return { step, stepOutput };
}
