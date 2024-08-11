import { ChevronRight } from 'lucide-react';
import React, { useMemo } from 'react';
import { useUpdateEffect } from 'react-use';

import {
  StepPathWithName,
  builderSelectors,
  stepPathToKeyString,
  useBuilderStateContext,
} from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import { CardListItem } from '@/components/ui/card-list';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { cn, formatUtils } from '@/lib/utils';
import {
  ActionType,
  LoopStepOutput,
  StepOutput,
  flowHelper,
} from '@activepieces/shared';

import { StepStatusIcon } from '../../../features/flow-runs/components/step-status-icon';

import { LoopIterationInput } from './loop-iteration-input';

type FlowStepDetailsCardProps = {
  path: StepPathWithName;
};

type FindChildrenPathsResult = {
  totalIterations: number;
  children: StepPathWithName[];
  currentIteration: number;
};

function findChildrenPaths(
  path: StepPathWithName,
  stepOutput: StepOutput | undefined,
): FindChildrenPathsResult {
  if (stepOutput?.type === ActionType.LOOP_ON_ITEMS) {
    const loopStepOutput = stepOutput as LoopStepOutput;
    const currentIteration =
      path.path.find((p) => p[0] === path.stepName)?.[1] ?? 0;
    return {
      currentIteration,
      totalIterations: loopStepOutput?.output?.iterations.length ?? 0,
      children: Object.keys(
        loopStepOutput?.output?.iterations[currentIteration] ?? {},
      ).map((key) => {
        const newPath: StepPathWithName = {
          stepName: key,
          path: [...path.path, [path.stepName, currentIteration]] as [
            string,
            number,
          ][], // Ensure the correct type
        };
        return newPath;
      }),
    };
  }
  return {
    totalIterations: 0,
    children: [],
    currentIteration: 0,
  };
}

const FlowStepDetailsCardItem = React.memo(
  ({ path }: FlowStepDetailsCardProps) => {
    const [selectStepByPath, step, selectedStep, run] = useBuilderStateContext(
      (state) => {
        const step = flowHelper.getStep(state.flowVersion, path.stepName)!;
        return [state.selectStepByPath, step, state.selectedStep, state.run];
      },
    );

    const isStepSelected = selectedStep?.stepName === path.stepName;

    const isInPath =
      selectedStep &&
      (selectedStep.path.some((p) => p[0] === path.stepName) ||
        selectedStep.stepName === step.name);

    const stepOutput = builderSelectors.getStepOutputFromExecutionPath({
      selectedPath: path,
      executionState: run ?? { steps: {} },
      stepName: path.stepName,
    });

    const { stepMetadata } = piecesHooks.useStepMetadata({
      step,
    });
    const [isOpen, setIsOpen] = React.useState(true);

    const { children, totalIterations, currentIteration } = useMemo(
      () => findChildrenPaths(path, stepOutput),
      [path, stepOutput],
    );

    const isLoopStep =
      stepOutput && stepOutput.type === ActionType.LOOP_ON_ITEMS;

    function setIterationIndex(newIterationIndex: number) {
      if (!selectedStep) return;
      const newSelectedPaths = selectedStep.path.map(
        ([stepName, iterationIndex]) =>
          (stepName === path.stepName
            ? [stepName, newIterationIndex]
            : [stepName, iterationIndex]) as [string, number],
      );
      selectStepByPath({
        path: newSelectedPaths,
        stepName: selectedStep.stepName,
      });
    }

    useUpdateEffect(() => {
      if (!isOpen && isInPath) {
        setIsOpen(true);
      }
    }, [selectedStep]);

    return (
      <Collapsible open={isOpen} className="w-full">
        <CollapsibleTrigger asChild={true}>
          <CardListItem
            onClick={() => {
              if (!isStepSelected) {
                selectStepByPath(path);
                setIsOpen(true);
              } else {
                setIsOpen(!isOpen);
              }
            }}
            className={cn('cursor-pointer select-none px-4 py-3 h-14', {
              'bg-accent text-accent-foreground': isStepSelected,
            })}
          >
            <div
              style={{
                minWidth: `${path.path.length * 25}px`,
              }}
            ></div>
            <div className="flex items-center  w-full gap-3">
              {children.length > 0 && (
                <Button
                  variant="ghost"
                  size={'icon'}
                  className="w-4 h-4"
                  onClick={(e) => {
                    setIsOpen(!isOpen);
                    e.stopPropagation();
                  }}
                >
                  <ChevronRight
                    size={16}
                    className={cn('', { 'rotate-90': isOpen })}
                  />
                </Button>
              )}
              <img className="w-6 h-6" src={stepMetadata?.logoUrl} />
              <div>{step.displayName}</div>
              <div className="w-2"></div>
              <div className="flex gap-1 justify-end  items-center flex-grow">
                {isLoopStep && isStepSelected && isInPath && (
                  <span className="text-sm font-semibold animate-fade">
                    All Iterations
                  </span>
                )}
                {isLoopStep && !isStepSelected && isInPath && (
                  <LoopIterationInput
                    totalIterations={totalIterations}
                    value={currentIteration}
                    onChange={setIterationIndex}
                  />
                )}
                {(!isLoopStep || (isLoopStep && !isInPath)) && (
                  <div className="flex gap-1 animate-fade">
                    <span className="text-muted-foreground text-xs">
                      {formatUtils.formatDuration(
                        stepOutput?.duration ?? 0,
                        true,
                      )}
                    </span>
                    {stepOutput && stepOutput.status && (
                      <StepStatusIcon
                        status={stepOutput.status}
                        size="4"
                      ></StepStatusIcon>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardListItem>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-0">
          {children.map((path) => (
            <FlowStepDetailsCardItem
              path={path}
              key={stepPathToKeyString(path)}
            ></FlowStepDetailsCardItem>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  },
);

FlowStepDetailsCardItem.displayName = 'FlowStepDetailsCard';
export { FlowStepDetailsCardItem };
