import { t } from 'i18next';
import { ChevronLeft, Info } from 'lucide-react';
import React, { useMemo } from 'react';

import {
  LeftSideBarType,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { CardList } from '@/components/custom/card-list';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { LoadingSpinner } from '@/components/ui/spinner';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  ApFlagId,
  FlowRun,
  FlowRunStatus,
  isNil,
  RunEnvironment,
} from '@activepieces/shared';

import { flowRunUtils } from '../../../features/flow-runs/lib/flow-run-utils';
import { SidebarHeader } from '../sidebar-header';

import { FlowStepIO } from './flow-step-io';
import { FlowStepDetailsCardItem } from './run-step-card-item';

function getMessage(run: FlowRun | null, retentionDays: number | null) {
  if (
    !run ||
    [
      FlowRunStatus.RUNNING,
      FlowRunStatus.QUEUED,
      FlowRunStatus.SUCCEEDED,
    ].includes(run.status)
  )
    return null;
  if ([FlowRunStatus.INTERNAL_ERROR].includes(run.status)) {
    return t('There are no logs captured for this run.');
  }
  if (isNil(run.logsFileId)) {
    return t(
      'Logs are kept for {days} days after execution and then deleted.',
      { days: retentionDays },
    );
  }
  return null;
}
const FlowRunDetails = React.memo(() => {
  const { data: rententionDays } = flagsHooks.useFlag<number>(
    ApFlagId.EXECUTION_DATA_RETENTION_DAYS,
  );

  const [setLeftSidebar, run, steps, loopsIndexes, flowVersion, selectedStep] =
    useBuilderStateContext((state) => {
      const steps =
        state.run && state.run.steps ? Object.keys(state.run.steps) : [];
      return [
        state.setLeftSidebar,
        state.run,
        steps,
        state.loopsIndexes,
        state.flowVersion,
        state.selectedStep,
      ];
    });

  const selectedStepOutput = useMemo(() => {
    return run && selectedStep && run.steps
      ? flowRunUtils.extractStepOutput(
          selectedStep,
          loopsIndexes,
          run.steps,
          flowVersion.trigger,
        )
      : null;
  }, [run, selectedStep, loopsIndexes, flowVersion.trigger]);

  const message = getMessage(run, rententionDays);

  if (!isNil(message))
    return (
      <div className="flex flex-col justify-center items-center gap-4 w-full h-full">
        <Info size={36} className="text-muted-foreground" />
        <h4 className="px-6 text-sm text-center text-muted-foreground ">
          {message}
        </h4>
      </div>
    );

  return (
    <ResizablePanelGroup direction="vertical">
      <SidebarHeader onClose={() => setLeftSidebar(LeftSideBarType.NONE)}>
        <div className="flex gap-2 items-center">
          {run && run.environment !== RunEnvironment.TESTING && (
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
      <ResizablePanel className="h-full min-h-[80px]">
        <CardList className="p-0 h-full" listClassName="gap-0.5">
          {steps.length > 0 &&
            steps
              .filter((path) => !isNil(path))
              .map((path) => (
                <FlowStepDetailsCardItem
                  stepName={path}
                  depth={0}
                  key={path}
                ></FlowStepDetailsCardItem>
              ))}
          {steps.length === 0 && (
            <div className="w-full h-full flex items-center justify-center">
              <LoadingSpinner></LoadingSpinner>
            </div>
          )}
        </CardList>
      </ResizablePanel>
      {selectedStepOutput && (
        <>
          <ResizableHandle withHandle={true} />
          <ResizablePanel defaultValue={25} className="min-h-[100px]">
            <FlowStepIO stepDetails={selectedStepOutput}></FlowStepIO>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
});

FlowRunDetails.displayName = 'FlowRunDetails';
export { FlowRunDetails };
