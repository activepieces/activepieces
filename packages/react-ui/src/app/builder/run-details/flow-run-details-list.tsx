import { Timer } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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

import { FlowStepDetailsCard } from './flow-step-details-card';

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
        Run Details
      </SidebarHeader>
      <ResizablePanel>
        <CardList className="p-0">
          {run &&
            run.steps &&
            stepDetails.map(({ step, stepOutput }: StepDetails) => (
              <FlowStepDetailsCard
                stepOutput={stepOutput}
                step={step}
                key={step.name}
              />
            ))}
        </CardList>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultValue={25} className="p-4 flex flex-col gap-2">
        <div>Send Message Webhook</div>
        <div className="flex items-center gap-2 justify-start">
          <Timer></Timer>
          <span>Duration: 590 milliseconds</span>
        </div>
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
