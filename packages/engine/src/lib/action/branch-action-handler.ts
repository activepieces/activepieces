import { FlowExecutor } from '../executors/flow-executor';
import { VariableService } from '../services/variable-service';
import { ExecutionState, BranchAction, Action, BranchStepOutput, BranchCondition, BranchOperator } from '@activepieces/shared';
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
      const condition = evaluateConditions(resolvedInput.conditions);
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
function evaluateConditions(conditionGroups: BranchCondition[][]): boolean {
  let orOperator = false;
  for (const conditionGroup of conditionGroups) {
    let andGroup = true;
    for (const condition of conditionGroup) {
      const castedCondition = condition as {
        firstValue: any;
        secondValue: any;
        operator: BranchOperator;
      };
      switch (castedCondition.operator) {
        case BranchOperator.TEXT_CONTAINS:
          andGroup = andGroup && castedCondition.firstValue.includes(castedCondition.secondValue);
          break;
        case BranchOperator.TEXT_DOES_NOT_CONTAIN:
          andGroup = andGroup && !castedCondition.firstValue.includes(castedCondition.secondValue);
          break;
        case BranchOperator.TEXT_EXACTLY_MATCHES:
          andGroup = andGroup && castedCondition.firstValue === castedCondition.secondValue;
          break;
        case BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCHES:
          andGroup = andGroup && castedCondition.firstValue !== castedCondition.secondValue;
          break;
        case BranchOperator.TEXT_START_WITH:
          andGroup = andGroup && castedCondition.firstValue.startsWith(castedCondition.secondValue);
          break;
        case BranchOperator.TEXT_END_WITH:
          andGroup = andGroup && castedCondition.firstValue.endsWith(castedCondition.secondValue);
          break;
        case BranchOperator.TEXT_DOES_NOT_START_WITH:
          andGroup = andGroup && !castedCondition.firstValue.startsWith(castedCondition.secondValue);
          break;
        case BranchOperator.TEXT_DOES_NOT_END_WITH:
          andGroup = andGroup && !castedCondition.firstValue.endsWith(castedCondition.secondValue);
          break;
        case BranchOperator.NUMBER_IS_GREATER_THAN: {
          const firstValue = parseStringToNumber(castedCondition.firstValue);
          const secondValue = parseStringToNumber(castedCondition.secondValue);
          andGroup = andGroup && firstValue > secondValue;
          break;
        }
        case BranchOperator.NUMBER_IS_LESS_THAN: {
          const firstValue = parseStringToNumber(castedCondition.firstValue);
          const secondValue = parseStringToNumber(castedCondition.secondValue);
          andGroup = andGroup && firstValue < secondValue;
          break;
        }
        case BranchOperator.BOOLEAN_IS_TRUE:
          andGroup = andGroup && castedCondition.firstValue;
          break;
        case BranchOperator.BOOLEAN_IS_FALSE:
          andGroup = andGroup && !castedCondition.firstValue;
          break;
        case BranchOperator.EXISTS:
          andGroup = andGroup && castedCondition.firstValue !== undefined && castedCondition.firstValue !== null;
          break;
        case BranchOperator.DOES_NOT_EXIST:
          andGroup = andGroup && castedCondition.firstValue === undefined && castedCondition.firstValue === null;
          break;
        default:
          throw new Error(`Unknown operator ${castedCondition.operator}`);
      }
      orOperator = orOperator || andGroup;
    }
  }
  return orOperator;
}

function parseStringToNumber(str: string): number | string {
  const num = Number(str);
  return isNaN(num) ? str : num;
}

