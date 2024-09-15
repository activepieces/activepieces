import {
  Check,
  CircleCheck,
  CircleX,
  PauseCircleIcon,
  PauseIcon,
  Timer,
  X,
} from 'lucide-react';

import {
  Action,
  ActionType,
  flowHelper,
  FlowRun,
  FlowRunStatus,
  FlowVersion,
  isNil,
  LoopStepOutput,
  LoopStepResult,
  StepOutput,
  StepOutputStatus,
  Trigger,
} from '@activepieces/shared';

export const flowRunUtils = {
  findFailedStep,
  findLoopsState,
  extractStepOutput,
  hasRunFinished,
  getStatusIconForStep(stepOutput: StepOutputStatus): {
    variant: 'default' | 'success' | 'error';
    Icon:
      | typeof Timer
      | typeof CircleCheck
      | typeof PauseCircleIcon
      | typeof CircleX;
  } {
    switch (stepOutput) {
      case StepOutputStatus.RUNNING:
        return {
          variant: 'default',
          Icon: Timer,
        };
      case StepOutputStatus.PAUSED:
        return {
          variant: 'default',
          Icon: PauseCircleIcon,
        };
      case StepOutputStatus.STOPPED:
      case StepOutputStatus.SUCCEEDED:
        return {
          variant: 'success',
          Icon: CircleCheck,
        };
      case StepOutputStatus.FAILED:
        return {
          variant: 'error',
          Icon: CircleX,
        };
    }
  },
  getStatusIcon(status: FlowRunStatus): {
    variant: 'default' | 'success' | 'error';
    Icon: typeof Timer | typeof Check | typeof PauseIcon | typeof X;
  } {
    switch (status) {
      case FlowRunStatus.RUNNING:
        return {
          variant: 'default',
          Icon: Timer,
        };
      case FlowRunStatus.SUCCEEDED:
        return {
          variant: 'success',
          Icon: Check,
        };
      case FlowRunStatus.STOPPED:
        return {
          variant: 'success',
          Icon: Check,
        };
      case FlowRunStatus.FAILED:
        return {
          variant: 'error',
          Icon: X,
        };
      case FlowRunStatus.PAUSED:
        return {
          variant: 'default',
          Icon: PauseIcon,
        };
      case FlowRunStatus.QUOTA_EXCEEDED:
        return {
          variant: 'error',
          Icon: X,
        };
      case FlowRunStatus.INTERNAL_ERROR:
        return {
          variant: 'error',
          Icon: X,
        };
      case FlowRunStatus.TIMEOUT:
        return {
          variant: 'error',
          Icon: X,
        };
    }
  },
};

const findFailedStepInLoop: (
  loopStepResult: LoopStepResult,
) => string | null = (loopStepResult) => {
  return loopStepResult.iterations.reduce((res, iteration) => {
    const failedStepWithinLoop = Object.entries(iteration).reduce(
      (res, [stepName, step]) => {
        if (step.status === StepOutputStatus.FAILED) {
          return stepName;
        }
        if (
          step.type === ActionType.LOOP_ON_ITEMS &&
          step.output &&
          isNil(res)
        ) {
          return findFailedStepInLoop(step.output);
        }
        return res;
      },
      null as null | string,
    );
    return res ?? failedStepWithinLoop;
  }, null as null | string);
};

function findLoopsState(flowVersion:FlowVersion,run: FlowRun, currentLoopsState: Record<string, number>) {
  const loops = flowHelper.getAllSteps(flowVersion.trigger).filter(s=> s.type === ActionType.LOOP_ON_ITEMS);
  const failedStep = run.steps? findFailedStep(run) : null;
  const res= loops.reduce((res, step) => {
      const isFailedStepParent = failedStep && flowHelper.isChildOf(step, failedStep);
      return {
        ...res,
        [step.name]: isFailedStepParent? Number.MAX_SAFE_INTEGER : currentLoopsState[step.name] ?? 0,
      };
  }, currentLoopsState);

return res;

}


function findFailedStep(run: FlowRun) {
  return Object.entries(run.steps).reduce((res, [stepName, step]) => {
    if (step.status === StepOutputStatus.FAILED) {
      return stepName;
    }
    if (step.type === ActionType.LOOP_ON_ITEMS && step.output && isNil(res)) {
      return findFailedStepInLoop(step.output);
    }
    return res;
  }, null as null | string);
}

function hasRunFinished(runStatus: FlowRunStatus): boolean {
  return (
    runStatus !== FlowRunStatus.RUNNING && runStatus !== FlowRunStatus.PAUSED
  );
}

function findStepParents(
  stepName: string,
  step: Action | Trigger,
): Action[] | undefined {
  if (step.name === stepName) {
    return [];
  }
  if (step.nextAction) {
    const pathFromNextAction = findStepParents(stepName, step.nextAction);
    if (pathFromNextAction) {
      return pathFromNextAction;
    }
  }
  if (step.type === ActionType.BRANCH) {
    const pathFromTrueBranch = step.onSuccessAction
      ? findStepParents(stepName, step.onSuccessAction)
      : undefined;
    if (pathFromTrueBranch) {
      return [step, ...pathFromTrueBranch];
    }
    const pathFromFalseBranch = step.onFailureAction
      ? findStepParents(stepName, step.onFailureAction)
      : undefined;
    if (pathFromFalseBranch) {
      return [step, ...pathFromFalseBranch];
    }
  }
  if (step.type === ActionType.LOOP_ON_ITEMS) {
    const pathFromLoop = step.firstLoopAction
      ? findStepParents(stepName, step.firstLoopAction)
      : undefined;
    if (pathFromLoop) {
      return [step, ...pathFromLoop];
    }
  }
  return undefined;
}
function getLoopChildStepOutput(
  parents: Action[],
  loopIndexes: Record<string, number>,
  childName: string,
  output: Record<string, StepOutput>,
): StepOutput | undefined {
  const parentStepsThatAreLoops = parents.filter(
    (p) => p.type === ActionType.LOOP_ON_ITEMS,
  );
  if (parentStepsThatAreLoops.length === 0) return undefined;
  let iterator: LoopStepOutput | undefined = output[
    parentStepsThatAreLoops[0].name
  ] as LoopStepOutput | undefined;
  let index = 0;
  while (index < parentStepsThatAreLoops.length - 1) {
    if(iterator?.output && iterator?.output?.iterations[
      loopIndexes[parentStepsThatAreLoops[index].name]
    ])
    {
      iterator = iterator?.output?.iterations[
        loopIndexes[parentStepsThatAreLoops[index].name]
      ][parentStepsThatAreLoops[index + 1].name] as LoopStepOutput | undefined;
    }
    
    index++;
  }
  if (iterator) {
    const directParentOutput =
      iterator.output?.iterations[
        loopIndexes[
          parentStepsThatAreLoops[parentStepsThatAreLoops.length - 1].name
        ]
      ];
    //Could be accessing out of bounds iteration
    if (directParentOutput) {
      return directParentOutput[childName];
    }
  }
  return undefined;
}
function extractStepOutput(
  stepName: string,
  loopIndexes: Record<string, number>,
  output: Record<string, StepOutput>,
  trigger: Trigger,
): StepOutput | undefined {
  const stepOutput = output[stepName];
  if (stepOutput) {
    return stepOutput;
  }
  const parents = findStepParents(stepName, trigger);
  if (parents) {
    return getLoopChildStepOutput(parents, loopIndexes, stepName, output);
  }
  return undefined;
}
