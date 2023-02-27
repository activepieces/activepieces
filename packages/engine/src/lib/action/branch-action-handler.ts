import { FlowExecutor } from '../executors/flow-executor';
import { VariableService } from '../services/variable-service';
import { ExecutionState, BranchAction, Action, BranchStepOutput } from '@activepieces/shared';
import { BaseActionHandler } from './action-handler';
import { StepOutputStatus, StepOutput } from '@activepieces/shared';

export class BranchActionHandler extends BaseActionHandler<BranchAction> {
  onSuccessAction?: BaseActionHandler<Action>;
  onFailureAction?: BaseActionHandler<Action>;
  override action: BranchAction;
  variableService: VariableService;

  constructor(
    action: BranchAction,
    onSuccessAction: BaseActionHandler<Action> | undefined,
    onFailureAction: BaseActionHandler<Action> | undefined,
    nextAction: BaseActionHandler<Action> | undefined
  ) {
    super(action, nextAction);
    this.action = action;
    this.variableService = new VariableService();
    this.onSuccessAction = onSuccessAction;
    this.onFailureAction = onFailureAction;
  }

  async execute(
    executionState: ExecutionState,
    ancestors: [string, number][]
  ): Promise<StepOutput> {
    const resolvedInput = await this.variableService.resolve(
      this.action.settings,
      executionState
    );

    const stepOutput = new BranchStepOutput();
    stepOutput.input = resolvedInput;

    try {
      // TODO - implement the condition
      const condition = true;
      stepOutput.output = {
        condition: condition,
      };
      executionState.insertStep(stepOutput, this.action.name, ancestors);
      const executor = new FlowExecutor(executionState);
      if (condition) {
        if (this.onSuccessAction) {
          await executor.iterateFlow(
            this.onSuccessAction,
            ancestors
          );
        }
      } else {
        if (this.onFailureAction) {
          await executor.iterateFlow(
            this.onFailureAction,
            ancestors
          );
        }
      }
      stepOutput.status = StepOutputStatus.SUCCEEDED;
      executionState.insertStep(stepOutput, this.action.name, ancestors);

      return Promise.resolve(stepOutput);
    } catch (e) {
      console.error(e);
      stepOutput.errorMessage = (e as Error).message;
      stepOutput.status = StepOutputStatus.FAILED;
      return Promise.resolve(stepOutput);
    }
  }

}
