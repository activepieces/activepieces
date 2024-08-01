import { ChevronRight } from 'lucide-react';
import React from 'react';

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
import { Input } from '@/components/ui/input';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { cn, formatUtils } from '@/lib/utils';
import {
  ActionType,
  LoopStepOutput,
  StepOutput,
  flowHelper,
} from '@activepieces/shared';

import { StepStatusIcon } from '../../../features/flow-runs/components/step-status-icon';

type FlowStepDetailsCardProps = {
  path: StepPathWithName;
};

function findChildrenPaths(
  path: StepPathWithName,
  stepOutput: StepOutput,
): StepPathWithName[] {
  if (stepOutput.type === ActionType.LOOP_ON_ITEMS) {
    const childrenPaths: StepPathWithName[] = [];
    const loopStepOutput = stepOutput as LoopStepOutput;
    Object.keys(loopStepOutput?.output?.iterations[0] ?? {}).forEach((key) => {
      const newPath: StepPathWithName = {
        stepName: key,
        path: [...path.path, [path.stepName, 0]],
      };
      childrenPaths.push(newPath);
    });
    return childrenPaths;
  }
  return [];
}

const FlowStepDetailsCardItem = React.memo(
  ({ path }: FlowStepDetailsCardProps) => {
    const [selectStep, isStepSelected, isInPath, step, stepOutput] =
      useBuilderStateContext((state) => {
        const step = flowHelper.getStep(state.flowVersion, path.stepName)!;
        const isStepSelected = state.selectedStep?.stepName === path.stepName;

        const { selectedStep } = state;
        const isInPath =
          selectedStep &&
          (selectedStep.path.some((p) => p[0] === path.stepName) ||
            selectedStep.stepName === step.name);

        const stepOutput = builderSelectors.getStepOutputFromExecutionPath({
          path,
          executionState: state.run ?? { steps: {} },
        })!;

        return [state.selectStep, isStepSelected, isInPath, step, stepOutput];
      });
    const { data: pieceMetadata } = piecesHooks.useStepMetadata({
      step,
    });
    const [isOpen, setIsOpen] = React.useState(false);
    const childrenPaths: StepPathWithName[] = findChildrenPaths(
      path,
      stepOutput,
    );
    const marginLeft = `ml-[${path.path.length * 35}px]`;
    const isLoopStep = stepOutput.type === ActionType.LOOP_ON_ITEMS;

    // TODO finish the iteration input logic
    return (
      <Collapsible open={isOpen} className="w-full">
        <CollapsibleTrigger asChild={true}>
          <CardListItem
            onClick={() => {
              if (!isStepSelected) {
                selectStep(path);
                setIsOpen(true);
              } else {
                setIsOpen(!isOpen);
              }
            }}
            className={cn('cursor-pointer select-none', {
              'bg-accent text-accent-foreground': isStepSelected,
            })}
          >
            <div
              className={`flex items-center justify-between w-full gap-3 ${marginLeft}`}
            >
              {childrenPaths.length > 0 && (
                <Button variant="ghost" size={'icon'} className="w-4 h-4">
                  <ChevronRight
                    size={16}
                    className={cn('', { 'rotate-90': isOpen })}
                  />
                </Button>
              )}
              <img className="w-6 h-6" src={pieceMetadata?.logoUrl} />
              <div>{step.displayName}</div>
              <div className="flex-grow"></div>
              <div className="flex gap-2 justfy-center items-center">
                {isLoopStep && isStepSelected && isInPath && (
                  <span className="text-sm">All Iterations</span>
                )}
                {isLoopStep && !isStepSelected && isInPath && (
                  <div className="flex gap-1 items-center">
                    <span className="text-sm">Iteration:</span>
                    <Input
                      key={path.stepName}
                      className="w-16"
                      value={1}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    />
                  </div>
                )}
                {(!isLoopStep || (isLoopStep && !isInPath)) && (
                  <>
                    <span className="text-muted-foreground text-xs">
                      {formatUtils.formatDuration(
                        stepOutput?.duration ?? 0,
                        true,
                      )}
                    </span>
                    <StepStatusIcon
                      status={stepOutput.status}
                      size="4"
                    ></StepStatusIcon>
                  </>
                )}
              </div>
            </div>
          </CardListItem>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-0">
          {childrenPaths.map((path) => (
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
