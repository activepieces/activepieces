import { StepOutput, Action, ActionType, ExecutionState } from 'shared';

export type ActionHandler = BaseActionHandler<any>;

export abstract class BaseActionHandler<A extends Action> {
  action: A;
  nextAction?: BaseActionHandler<any> | undefined;

  protected constructor(action: A, nextAction?: BaseActionHandler<any>) {
    this.action = action;
    this.nextAction = nextAction;
  }

  abstract execute(
    executionState: ExecutionState,
    ancestors: [string, number][]
  ): Promise<StepOutput>;
}
