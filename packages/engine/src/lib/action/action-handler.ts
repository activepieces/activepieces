import { StepOutput, Action, ExecutionState, ResumeStepMetadata } from '@activepieces/shared';

export type ActionHandler = BaseActionHandler

type CtorParams<CA extends Action, RSM extends ResumeStepMetadata = ResumeStepMetadata> = {
  currentAction: CA
  nextAction?: Action
  resumeStepMetadata?: RSM
}

export abstract class BaseActionHandler<CA extends Action = Action, RSM extends ResumeStepMetadata = ResumeStepMetadata> {
  currentAction: CA
  nextAction?: Action
  resumeStepMetadata?: RSM

  protected constructor({ currentAction, nextAction, resumeStepMetadata }: CtorParams<CA, RSM>) {
    this.currentAction = currentAction
    this.nextAction = nextAction
    this.resumeStepMetadata = resumeStepMetadata
  }

  abstract execute(
    executionState: ExecutionState,
    ancestors: [string, number][]
  ): Promise<StepOutput>;
}
