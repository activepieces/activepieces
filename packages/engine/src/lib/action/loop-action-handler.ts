import { FlowExecutor } from '../executors/flow-executor'
import { VariableService } from '../services/variable-service'
import { Action, ActionType, ExecutionState, LoopOnItemsAction, LoopOnItemsActionSettings, LoopResumeStepMetadata } from '@activepieces/shared'
import { BaseActionHandler, ExecuteActionOutput, ExecuteContext, InitStepOutputParams } from './action-handler'
import { LoopOnItemsStepOutput, StepOutputStatus } from '@activepieces/shared'

type CtorParams = {
    currentAction: LoopOnItemsAction
    firstLoopAction?: Action
    nextAction?: Action
    resumeStepMetadata?: LoopResumeStepMetadata
}

export class LoopOnItemActionHandler extends BaseActionHandler<LoopOnItemsAction, LoopResumeStepMetadata> {
    firstLoopAction?: Action
    variableService: VariableService

    constructor({ currentAction, firstLoopAction, nextAction, resumeStepMetadata }: CtorParams) {
        super({
            currentAction,
            nextAction,
            resumeStepMetadata,
        })

        this.firstLoopAction = firstLoopAction
        this.variableService = new VariableService()
    }

    private iterationIsResuming(i: number): boolean {
        return this.resumeStepMetadata?.iteration === i + 1
    }

    private iterationIsNotResuming(i: number): boolean {
        return !this.iterationIsResuming(i)
    }

    /**
   * initializes an empty loop step output
   */
    protected override async initStepOutput({ executionState }: InitStepOutputParams): Promise<LoopOnItemsStepOutput> {
        const censoredInput = await this.variableService.resolve({
            unresolvedInput: this.currentAction.settings,
            executionState,
            logs: true,
        })

        const newStepOutput: LoopOnItemsStepOutput = {
            type: ActionType.LOOP_ON_ITEMS,
            status: StepOutputStatus.RUNNING,
            input: censoredInput,
            output: {
                index: 1,
                item: undefined,
                iterations: [],
            },
        }

        return newStepOutput
    }

    async execute(
        context: ExecuteContext,
        executionState: ExecutionState,
        ancestors: [string, number][],
    ): Promise<ExecuteActionOutput> {
        const resolvedInput: LoopOnItemsActionSettings = await this.variableService.resolve({
            unresolvedInput: this.currentAction.settings,
            executionState,
            logs: false,
        })

        const stepOutput = await this.loadStepOutput({
            executionState,
            ancestors,
        })

        executionState.insertStep(stepOutput, this.currentAction.name, ancestors)
        const loopOutput = stepOutput.output!
        try {
            for (let i = loopOutput.index - 1; i < resolvedInput.items.length; ++i) {
                ancestors.push([this.currentAction.name, i])

                if (this.iterationIsNotResuming(i)) {
                    loopOutput.iterations.push({})
                }

                loopOutput.index = i + 1
                loopOutput.item = resolvedInput.items[i]
                this.updateExecutionStateWithLoopDetails(executionState, loopOutput)

                if (this.firstLoopAction === undefined) {
                    ancestors.pop()
                    continue
                }

                const executor = new FlowExecutor({
                    flowVersion: context.flowVersion,
                    executionState,
                    firstStep: this.firstLoopAction,
                    resumeStepMetadata: this.iterationIsResuming(i)
                        ? this.resumeStepMetadata?.childResumeStepMetadata
                        : undefined,
                })

                const executionOutput = await executor.execute({ ancestors })

                ancestors.pop()

                this.handleFlowExecutorOutput({
                    executionOutput,
                    stepOutput,
                })

                if (stepOutput.status !== StepOutputStatus.RUNNING) {
                    executionState.insertStep(stepOutput, this.currentAction.name, ancestors)
                    return {
                        stepOutput,
                        pauseMetadata: this.convertToPauseMetadata(executionOutput),
                        stopResponse: this.convertToStopResponse(executionOutput),
                        executionOutputStatus: executionOutput.status,
                    }
                }
            }

            stepOutput.status = StepOutputStatus.SUCCEEDED
            executionState.insertStep(stepOutput, this.currentAction.name, ancestors)

            return {
                stepOutput,
                executionOutputStatus: this.convertExecutionStatusToStepStatus(stepOutput.status),
                pauseMetadata: undefined,
                stopResponse: undefined,
            }
        }
        catch (e) {
            console.error(e)

            stepOutput.errorMessage = (e as Error).message
            stepOutput.status = StepOutputStatus.FAILED

            return {
                stepOutput: await Promise.resolve(stepOutput),
                executionOutputStatus: this.convertExecutionStatusToStepStatus(stepOutput.status),
                pauseMetadata: undefined,
                stopResponse: undefined,
            }
        }
    }


    /**
   * We should remove iterations during the inner calls, to avoid huge overhead for logs.
   * Example if there are two nested loop contains code that reference to the first loop.
   * The iteration object will always contain all previous iterations.
   */
    updateExecutionStateWithLoopDetails(
        executionState: ExecutionState,
        loopOutput: LoopOnItemsStepOutput['output'],
    ): void {
        executionState.updateLastStep(
            {
                ...loopOutput,
                iterations: undefined,
            },
            this.currentAction.name,
        )
    }
}
