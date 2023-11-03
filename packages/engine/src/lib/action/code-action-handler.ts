import { VariableService } from '../services/variable-service'
import {
    Action,
    ActionType,
    CodeAction,
    ExecutionState,
    StepOutput,
    StepOutputStatus,
} from '@activepieces/shared'
import { BaseActionHandler, ExecuteActionOutput, ExecuteContext, InitStepOutputParams } from './action-handler'
import { codeExecutor } from '../executors/code-executer'

type CtorParams = {
    currentAction: CodeAction
    nextAction?: Action
}

export class CodeActionHandler extends BaseActionHandler<CodeAction> {
    variableService: VariableService

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
            logs: true,
        })

        return {
            type: ActionType.CODE,
            status: StepOutputStatus.RUNNING,
            input: censoredInput,
        }
    }

    override async execute(_context: ExecuteContext, executionState: ExecutionState, ancestors: [string, number][]): Promise<ExecuteActionOutput> {
        const stepOutput = await this.loadStepOutput({
            executionState,
            ancestors,
        })

        const resolvedInput = await this.variableService.resolve({
            unresolvedInput: this.currentAction.settings.input,
            executionState,
            logs: false,
        })

        try {
            stepOutput.output = await codeExecutor.executeCode(
                {
                    stepName: this.currentAction.name,
                    params: resolvedInput,
                })

            stepOutput.status = StepOutputStatus.SUCCEEDED
            return {
                stepOutput,
                executionOutputStatus: this.convertExecutionStatusToStepStatus(stepOutput.status),
                pauseMetadata: undefined,
                stopResponse: undefined,
            }
        }
        catch (e) {
            console.error(e)

            stepOutput.status = StepOutputStatus.FAILED
            stepOutput.errorMessage = (e as Error).message

            return {
                stepOutput,
                executionOutputStatus: this.convertExecutionStatusToStepStatus(stepOutput.status),
                stopResponse: undefined,
                pauseMetadata: undefined,
            }
        }
    }
}
