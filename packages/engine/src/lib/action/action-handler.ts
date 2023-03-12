import { StepOutput, Action, ExecutionState } from '@activepieces/shared';

export type ActionHandler = BaseActionHandler<Action>;

export abstract class BaseActionHandler<A extends Action> {
  action: A;
  nextAction?: BaseActionHandler<Action> | undefined;

  protected constructor(action: A, nextAction?: BaseActionHandler<Action>) {
    this.action = action;
    this.nextAction = nextAction;
  }

  abstract execute(
    executionState: ExecutionState,
    ancestors: [string, number][]
  ): Promise<StepOutput>;
}
