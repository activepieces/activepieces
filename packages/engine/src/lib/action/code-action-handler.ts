import { VariableService } from '../services/variable-service';
import {
  Action,
  ActionType,
  CodeAction,
  ExecutionState,
  StepOutput,
  StepOutputStatus
} from '@activepieces/shared';
import { BaseActionHandler, InitStepOutputParams } from './action-handler';
import { codeExecutor } from '../executors/code-executer';
import { isNil } from '@activepieces/shared'

type CtorParams = {
  currentAction: CodeAction
  nextAction?: Action
}

export class CodeActionHandler extends BaseActionHandler<CodeAction> {
  variableService: VariableService;

  constructor({ currentAction, nextAction }: CtorParams) {
    super({
      currentAction,
      nextAction,
    })

    this.variableService = new VariableService()
  }

  /**
   * initializes an empty code step output
   */
  protected override async initStepOutput({ executionState }: InitStepOutputParams): Promise<StepOutput<ActionType.CODE>> {
    const censoredInput = await this.variableService.resolve({
      unresolvedInput: this.currentAction.settings.input,
      executionState,
      censorConnections: true,
    })

    return {
      type: ActionType.CODE,
      status: StepOutputStatus.RUNNING,
      input: censoredInput,
    }
  }

  override async execute(executionState: ExecutionState, ancestors: [string, number][]): Promise<StepOutput> {
    const stepOutput = await this.loadStepOutput({
      executionState,
      ancestors,
    })

    const resolvedInput = await this.variableService.resolve({
      unresolvedInput: this.currentAction.settings.input,
      executionState,
      censorConnections: false,
    })

    const artifactPackagedId = this.currentAction.settings.artifactPackagedId

    if (isNil(artifactPackagedId)) {
      throw new Error("Artifact packaged id is not defined");
    }

    try {
      stepOutput.output = await codeExecutor.executeCode(
        artifactPackagedId,
        resolvedInput
      )

      stepOutput.status = StepOutputStatus.SUCCEEDED
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
