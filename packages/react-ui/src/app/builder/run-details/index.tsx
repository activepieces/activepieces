import { t } from 'i18next';
import { ChevronLeft, Info } from 'lucide-react';
import React from 'react';

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
import { LoadingSpinner } from '@/components/ui/spinner';
import { isNil, RunEnvironment } from '@activepieces/shared';

import { SidebarHeader } from '../sidebar-header';

import { FlowStepDetailsCardItem } from './flow-step-details-card-item';
import { FlowStepInputOutput } from './flow-step-input-output';

const FlowRunDetails = React.memo(() => {
  const [setLeftSidebar, run, steps, stepDetails] = useBuilderStateContext(
    (state) => {
      const paths: StepPathWithName[] = state.run?.steps
        ? Object.keys(state.run.steps).map((stepName: string) => ({
            stepName,
            path: [],
          }))
        : [];
      const stepDetails =
        !isNil(state.selectedStep) && !isNil(state.run)
          ? builderSelectors.getStepOutputFromExecutionPath({
              selectedPath: state.selectedStep,
              executionState: state.run,
              stepName: state.selectedStep.stepName,
            })
          : null;
      return [state.setLeftSidebar, state.run, paths, stepDetails];
    },
  );

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
          {run.environment !== RunEnvironment.TESTING && (
            <Button
              variant="ghost"
              size={'sm'}
              onClick={() => setLeftSidebar(LeftSideBarType.RUNS)}
            >
              <ChevronLeft size={16} />
            </Button>
          )}
          <span>{t('Run Details')}</span>
        </div>
      </SidebarHeader>
      <ResizablePanel className="h-full">
        <CardList className="p-0 h-full">
          {steps.length > 0 &&
            steps
              .filter((path) => !isNil(path))
              .map((path) => (
                <FlowStepDetailsCardItem
                  path={path}
                  key={stepPathToKeyString(path)}
                ></FlowStepDetailsCardItem>
              ))}
          {steps.length === 0 && (
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSpinner></LoadingSpinner>
            </div>
          )}
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
