import { VariableService } from '../services/variable-service'
import {
    Action,
    ActionType,
    CodeAction,
    ExecutionOutputStatus,
    ExecutionState,
    StepOutput,
    StepOutputStatus,
} from '@activepieces/shared'
import { BaseActionHandler, ExecuteActionOutput, ExecuteContext, InitStepOutputParams } from './action-handler'
import { codeExecutor } from '../executors/code-executer'
import { isNil } from '@activepieces/shared'

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

    override async execute(context: ExecuteContext, executionState: ExecutionState, ancestors: [string, number][]): Promise<ExecuteActionOutput> {
        const stepOutput = await this.loadStepOutput({
            executionState,
            ancestors,
        })

        const resolvedInput = await this.variableService.resolve({
            unresolvedInput: this.currentAction.settings.input,
            executionState,
            logs: false,
        })

        const artifactSourceId = this.currentAction.settings.artifactSourceId

        if (isNil(artifactSourceId)) {
            throw new Error('Artifact packaged id is not defined')
        }

        try {
            stepOutput.output = await codeExecutor.executeCode(
                artifactSourceId,
                resolvedInput,
            )

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
