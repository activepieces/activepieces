import { FlowExecutor } from '../executors/flow-executor';
import { VariableService } from '../services/variable-service';
import { ExecutionState, BranchAction, Action, BranchStepOutput, BranchCondition, BranchOperator, BranchResumeStepMetadata, ActionType, BranchActionSettings } from '@activepieces/shared';
import { BaseActionHandler, InitStepOutputParams } from './action-handler';
import { StepOutputStatus, StepOutput } from '@activepieces/shared';

type CtorParams = {
  currentAction: BranchAction
  onSuccessAction?: Action,
  onFailureAction?: Action,
  nextAction?: Action
  resumeStepMetadata?: BranchResumeStepMetadata
}

export class BranchActionHandler extends BaseActionHandler<BranchAction, BranchResumeStepMetadata> {
  onSuccessAction?: Action;
  onFailureAction?: Action;
  variableService: VariableService;

  constructor({ currentAction, onSuccessAction, onFailureAction, nextAction, resumeStepMetadata }: CtorParams) {
    super({
      currentAction,
      nextAction,
      resumeStepMetadata,
    })

    this.variableService = new VariableService();
    this.onSuccessAction = onSuccessAction;
    this.onFailureAction = onFailureAction;
  }

  /**
   * initializes an empty branch step output
   */
  protected override async initStepOutput({ executionState }: InitStepOutputParams): Promise<BranchStepOutput> {
    const censoredInput = await this.variableService.resolve({
      unresolvedInput: this.currentAction.settings,
      executionState,
      censorConnections: true,
    })

    const newStepOutput: BranchStepOutput = {
      type: ActionType.BRANCH,
      status: StepOutputStatus.RUNNING,
      input: censoredInput,
    }

    return newStepOutput
  }

  async execute(
    executionState: ExecutionState,
    ancestors: [string, number][]
  ): Promise<StepOutput> {
    const resolvedInput: BranchActionSettings = await this.variableService.resolve({
      unresolvedInput: this.currentAction.settings,
      executionState,
      censorConnections: false,
    })

    const stepOutput = await this.loadStepOutput({
      executionState,
      ancestors,
    })

    executionState.insertStep(stepOutput, this.currentAction.name, ancestors)

    try {
      stepOutput.output = {
        condition: stepOutput.output?.condition ?? evaluateConditions(resolvedInput.conditions)
      }

      const firstStep = stepOutput.output.condition
        ? this.onSuccessAction
        : this.onFailureAction

      if (firstStep) {
        const executor = new FlowExecutor({
          executionState,
          firstStep,
          resumeStepMetadata: this.resumeStepMetadata?.childResumeStepMetadata,
        })

        const executionOutput = await executor.execute({
          ancestors,
        })

        this.handleFlowExecutorOutput({
          executionOutput,
          stepOutput,
        })

        if (stepOutput.status !== StepOutputStatus.RUNNING) {
          executionState.insertStep(stepOutput, this.currentAction.name, ancestors)
          return stepOutput
        }
      }

      stepOutput.status = StepOutputStatus.SUCCEEDED
      executionState.insertStep(stepOutput, this.currentAction.name, ancestors)

      return stepOutput
    }
    catch (e) {
      console.error(e)

      stepOutput.status = StepOutputStatus.FAILED
      stepOutput.errorMessage = (e as Error).message

      return stepOutput
    }
  }
}

function evaluateConditions(conditionGroups: BranchCondition[][]): boolean {
  let orOperator = false;
  for (const conditionGroup of conditionGroups) {
    let andGroup = true;
    for (const condition of conditionGroup) {
      const castedCondition = condition;
      switch (castedCondition.operator) {
        case BranchOperator.TEXT_CONTAINS: {
          const firstValueContains = toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive).includes(
            toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive)
          );
          andGroup = andGroup && firstValueContains;
          break;
        }
        case BranchOperator.TEXT_DOES_NOT_CONTAIN: {
          const firstValueDoesNotContain = !toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive).includes(
            toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive)
          );
          andGroup = andGroup && firstValueDoesNotContain;
          break;
        }
        case BranchOperator.TEXT_EXACTLY_MATCHES: {
          const firstValueExactlyMatches = toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive) ===
            toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive);
          andGroup = andGroup && firstValueExactlyMatches;
          break;
        }
        case BranchOperator.TEXT_DOES_NOT_EXACTLY_MATCH: {
          const firstValueDoesNotExactlyMatch = toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive) !==
            toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive);
          andGroup = andGroup && firstValueDoesNotExactlyMatch;
          break;
        }
        case BranchOperator.TEXT_STARTS_WITH: {
          const firstValueStartsWith = toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive).startsWith(
            toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive)
          );
          andGroup = andGroup && firstValueStartsWith;
          break;
        }
        case BranchOperator.TEXT_ENDS_WITH: {
          const firstValueEndsWith = toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive).endsWith(
            toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive)
          );
          andGroup = andGroup && firstValueEndsWith;
          break;
        }
        case BranchOperator.TEXT_DOES_NOT_START_WITH: {
          const firstValueDoesNotStartWith = !toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive).startsWith(
            toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive)
          );
          andGroup = andGroup && firstValueDoesNotStartWith;
          break;
        }
        case BranchOperator.TEXT_DOES_NOT_END_WITH: {
          const firstValueDoesNotEndWith = !toLowercaseIfCaseInsensitive(castedCondition.firstValue, castedCondition.caseSensitive).endsWith(
            toLowercaseIfCaseInsensitive(castedCondition.secondValue, castedCondition.caseSensitive)
          );
          andGroup = andGroup && firstValueDoesNotEndWith;
          break;
        }        
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
          andGroup = andGroup && !!castedCondition.firstValue;
          break;
        case BranchOperator.BOOLEAN_IS_FALSE:
          andGroup = andGroup && !castedCondition.firstValue;
          break;
        case BranchOperator.EXISTS:
          andGroup = andGroup && castedCondition.firstValue !== undefined && castedCondition.firstValue !== null && castedCondition.firstValue !== "";
          break;
        case BranchOperator.DOES_NOT_EXIST:
          andGroup = andGroup && (castedCondition.firstValue === undefined || castedCondition.firstValue === null || castedCondition.firstValue === "");
          break;
        default:
          throw new Error(`Unknown operator ${castedCondition.operator}`);
      }
    }
    orOperator = orOperator || andGroup;
  }
  return Boolean(orOperator);
}

function toLowercaseIfCaseInsensitive(text: unknown, caseSensitive: boolean | undefined): string {
  if (typeof text === 'string') {
    return caseSensitive ? text : text.toLowerCase();
  } else {
    return caseSensitive ? JSON.stringify(text) : JSON.stringify(text).toLowerCase();
  }
}

function parseStringToNumber(str: string): number | string {
  const num = Number(str);
  return isNaN(num) ? str : num;
}
