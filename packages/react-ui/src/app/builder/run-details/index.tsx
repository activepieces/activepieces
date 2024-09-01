import { t } from 'i18next';
import { ChevronLeft, Info } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import {
  LeftSideBarType,
  StepPathWithName,
  builderSelectors,
  stepPathToKeyString,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { CardList } from '@/components/ui/card-list';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { isNil } from '@activepieces/shared';

import { SidebarHeader } from '../sidebar-header';

import { FlowStepDetailsCardItem } from './flow-step-details-card-item';
import { FlowStepInputOutput } from './flow-step-input-output';

const FlowRunDetails = React.memo(() => {
  const [setLeftSidebar, run] = useBuilderStateContext((state) => [
    state.setLeftSidebar,
    state.run,
  ]);
  const stepDetails = useBuilderStateContext((state) => {
    const { selectedStep, run } = state;
    if (!selectedStep || !run) {
      return undefined;
    }
    return builderSelectors.getStepOutputFromExecutionPath({
      selectedPath: selectedStep,
      executionState: run,
      stepName: selectedStep.stepName,
    });
  });

  const [stepPaths, setStepPaths] = useState<StepPathWithName[]>([]);

  useEffect(() => {
    const paths: StepPathWithName[] = run?.steps
      ? Object.keys(run.steps).map((stepName: string) => ({
          stepName,
          path: [],
        }))
      : [];
    setStepPaths(paths);
  }, [run]);
  if (isNil(run))
    return (
      <div className="flex flex-col justify-center items-center gap-4 w-full h-full">
        <Info size={36} className="text-muted-foreground" />
        <h4 className="px-6 text-sm text-center text-muted-foreground ">
          Logs are kept for 14 days after execution and then deleted.
        </h4>
      </div>
    );

  return (
    <ResizablePanelGroup direction="vertical">
      <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size={'sm'}
            onClick={() => setLeftSidebar(LeftSideBarType.RUNS)}
          >
            <ChevronLeft size={16} />
          </Button>
          <span>{t('Run Details')}</span>
        </div>
      </SidebarHeader>
      <ResizablePanel>
        <CardList className="p-0">
          {stepPaths &&
            stepPaths
              .filter((path) => !isNil(path))
              .map((path) => (
                <FlowStepDetailsCardItem
                  path={path}
                  key={stepPathToKeyString(path)}
                ></FlowStepDetailsCardItem>
              ))}
        </CardList>
      </ResizablePanel>
      {stepDetails && (
        <>
          <ResizableHandle withHandle={true} />
          <ResizablePanel defaultValue={25}>
            <FlowStepInputOutput
              stepDetails={stepDetails}
            ></FlowStepInputOutput>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
});

FlowRunDetails.displayName = 'FlowRunDetails';
export { FlowRunDetails };
