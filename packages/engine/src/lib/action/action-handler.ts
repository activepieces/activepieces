import { StepOutput, Action, ExecutionState, ResumeStepMetadata } from '@activepieces/shared';

export type ActionHandler = BaseActionHandler

type CtorParams<CA extends Action> = {
  currentAction: CA
  nextAction?: Action
  resumeStepMetadata?: ResumeStepMetadata
}

export abstract class BaseActionHandler<CA extends Action = Action> {
  currentAction: CA
  nextAction?: Action
  resumeStepMetadata?: ResumeStepMetadata

  protected constructor({ currentAction, nextAction, resumeStepMetadata }: CtorParams<CA>) {
    this.currentAction = currentAction;
    this.nextAction = nextAction;
    this.resumeStepMetadata = resumeStepMetadata;
  }

  abstract execute(
    executionState: ExecutionState,
    ancestors: [string, number][]
  ): Promise<StepOutput>;
}
