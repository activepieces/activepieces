import { inspect } from 'util'
import {
    BeginExecuteFlowOperation,
    EngineOperation,
    EngineOperationType,
    EngineResponse,
    EngineResponseStatus,
    ExecuteActionResponse,
    ExecuteExtractPieceMetadataOperation,
    ExecuteFlowOperation,
    ExecutePropsOptions,
    ExecuteToolOperation,
    ExecuteTriggerOperation,
    ExecuteTriggerResponse,
    ExecuteValidateAuthOperation,
    ExecutionType,
    FlowAction,
    FlowActionType,
    FlowRunResponse,
    flowStructureUtil,
    GenericStepOutput,
    isNil,
    LoopStepOutput,
    PropertyExecutionType,
    StepOutput,
    StepOutputStatus,
    TriggerHookType,
    TriggerPayload,
} from '@activepieces/shared'
import { EngineConstants } from './handler/context/engine-constants'
import { ExecutionVerdict, FlowExecutorContext } from './handler/context/flow-execution-context'
import { testExecutionContext } from './handler/context/test-execution-context'
import { flowExecutor } from './handler/flow-executor'
import { pieceHelper } from './helper/piece-helper'
import { triggerHelper } from './helper/trigger-helper'
import { progressService } from './services/progress.service'

const executeFlow = async (input: ExecuteFlowOperation): Promise<EngineResponse<Pick<FlowRunResponse, 'status' | 'error'>>> => {
    const constants = EngineConstants.fromExecuteFlowInput(input)
    const output: FlowExecutorContext = await executieSingleStepOrFlowOperation(input)
    const newContext = output.verdict === ExecutionVerdict.RUNNING ? output.setVerdict(ExecutionVerdict.SUCCEEDED, output.verdictResponse) : output
    await progressService.sendUpdate({
        engineConstants: constants,
        flowExecutorContext: newContext,
        updateImmediate: true,
    })
    const response = await newContext.toResponse()
    return {
        status: EngineResponseStatus.OK,
        response: {
            status: response.status,
            error: response.error,
        },
    }
}

const executieSingleStepOrFlowOperation = async (input: ExecuteFlowOperation): Promise<FlowExecutorContext> => {
    const constants = EngineConstants.fromExecuteFlowInput(input)
    if (constants.testSingleStepMode) {
        const testContext = await testExecutionContext.stateFromFlowVersion({
            apiUrl: input.internalApiUrl,
            flowVersion: input.flowVersion,
            excludedStepName: input.stepNameToTest!,
            projectId: input.projectId,
            engineToken: input.engineToken,
            sampleData: input.sampleData,
        })
        const step = flowStructureUtil.getActionOrThrow(input.stepNameToTest!, input.flowVersion.trigger)
        return flowExecutor.execute({
            action: step,
            executionState: await getFlowExecutionState(input, testContext),
            constants: EngineConstants.fromExecuteFlowInput(input),
        })
    }
    return flowExecutor.executeFromTrigger({
        executionState: await getFlowExecutionState(input, FlowExecutorContext.empty().increaseTask(input.tasks)),
        constants,
        input,
    })
}


async function executeActionForTool(input: ExecuteToolOperation): Promise<ExecuteActionResponse> {
    const step: FlowAction = {
        name: input.actionName,
        displayName: input.actionName,
        type: FlowActionType.PIECE,
        settings: {
            input: input.input,
            actionName: input.actionName,
            pieceName: input.pieceName,
            pieceVersion: input.pieceVersion,
            errorHandlingOptions: {
                continueOnFailure: {
                    value: false,
                },
                retryOnFailure: {
                    value: false,
                },
            },
            propertySettings: Object.fromEntries(Object.entries(input.input).map(([key]) => [key, {
                type: PropertyExecutionType.MANUAL,
                schema: undefined,
            }])),
        },
        valid: true,
    }
    const output = await flowExecutor.getExecutorForAction(step.type).handle({
        action: step,
        executionState: FlowExecutorContext.empty(),
        constants: EngineConstants.fromExecuteActionInput(input),
    })
    return {
        success: output.verdict !== ExecutionVerdict.FAILED,
        input: output.steps[step.name].input,
        output: cleanSampleData(output.steps[step.name]),
    }
}


function cleanSampleData(stepOutput: StepOutput) {
    if (stepOutput.status === StepOutputStatus.FAILED) {
        return stepOutput.errorMessage
    }

    return stepOutput.output
}

async function runOrReturnPayload(input: BeginExecuteFlowOperation): Promise<TriggerPayload> {
    if (!input.executeTrigger) {
        return input.triggerPayload as TriggerPayload
    }
    const newPayload = await triggerHelper.executeTrigger({
        params: {
            ...input,
            hookType: TriggerHookType.RUN,
            test: false,
            webhookUrl: '',
            triggerPayload: input.triggerPayload as TriggerPayload,
        },
        constants: EngineConstants.fromExecuteFlowInput(input),
    }) as ExecuteTriggerResponse<TriggerHookType.RUN>
    return newPayload.output[0] as TriggerPayload
}

async function getFlowExecutionState(input: ExecuteFlowOperation, flowContext: FlowExecutorContext): Promise<FlowExecutorContext> {
    switch (input.executionType) {
        case ExecutionType.BEGIN: {
            const newPayload = await runOrReturnPayload(input)
            flowContext = flowContext.upsertStep(input.flowVersion.trigger.name, GenericStepOutput.create({
                type: input.flowVersion.trigger.type,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
            }).setOutput(newPayload))
            break
        }
        case ExecutionType.RESUME: {
            break
        }
    }

    for (const [step, output] of Object.entries(input.executionState.steps)) {
        if ([StepOutputStatus.SUCCEEDED, StepOutputStatus.PAUSED].includes(output.status)) {
            const newOutput = await insertSuccessStepsOrPausedRecursively(output)
            if (!isNil(newOutput)) {
                flowContext = flowContext.upsertStep(step, newOutput)
            }
        }
    }
    return flowContext
}

async function insertSuccessStepsOrPausedRecursively(stepOutput: StepOutput): Promise<StepOutput | null> {
    if (![StepOutputStatus.SUCCEEDED, StepOutputStatus.PAUSED].includes(stepOutput.status)) {
        return null
    }
    if (stepOutput.type === FlowActionType.LOOP_ON_ITEMS) {
        const loopOutput = new LoopStepOutput(stepOutput)
        const iterations = loopOutput.output?.iterations ?? []
        const newIterations: Record<string, StepOutput>[] = []
        for (const iteration of iterations) {
            const newSteps: Record<string, StepOutput> = {}
            for (const [step, output] of Object.entries(iteration)) {
                const newOutput = await insertSuccessStepsOrPausedRecursively(output)
                if (!isNil(newOutput)) {
                    newSteps[step] = newOutput
                }
            }
            newIterations.push(newSteps)
        }
        return loopOutput.setIterations(newIterations)
    }
    return stepOutput
}

export async function execute(operationType: EngineOperationType, operation: EngineOperation): Promise<EngineResponse<unknown>> {
    try {
        switch (operationType) {
            case EngineOperationType.EXTRACT_PIECE_METADATA: {
                const input = operation as ExecuteExtractPieceMetadataOperation
                const output = await pieceHelper.extractPieceMetadata({
                    params: input,
                    pieceSource: EngineConstants.PIECE_SOURCES,
                })
                return {
                    status: EngineResponseStatus.OK,
                    response: output,
                }
            }
            case EngineOperationType.EXECUTE_FLOW: {
                const input = operation as ExecuteFlowOperation

                const output = await executeFlow(input)
                return output
            }
            case EngineOperationType.EXECUTE_PROPERTY: {
                const input = operation as ExecutePropsOptions
                const output = await pieceHelper.executeProps({
                    params: input,
                    pieceSource: EngineConstants.PIECE_SOURCES,
                    executionState: await testExecutionContext.stateFromFlowVersion({
                        apiUrl: input.internalApiUrl,
                        flowVersion: input.flowVersion,
                        projectId: input.projectId,
                        engineToken: input.engineToken,
                        sampleData: input.sampleData,
                    }),
                    searchValue: input.searchValue,
                    constants: EngineConstants.fromExecutePropertyInput(input),
                })
                return {
                    status: EngineResponseStatus.OK,
                    response: output,
                }
            }
            case EngineOperationType.EXECUTE_TRIGGER_HOOK: {
                const input = operation as ExecuteTriggerOperation<TriggerHookType>
                const output = await triggerHelper.executeTrigger({
                    params: input,
                    constants: EngineConstants.fromExecuteTriggerInput(input),
                })
                return {
                    status: EngineResponseStatus.OK,
                    response: output,
                }
            }
            case EngineOperationType.EXECUTE_TOOL: {
                const input = operation as ExecuteToolOperation
                const output = await executeActionForTool(input)
                return {
                    status: EngineResponseStatus.OK,
                    response: output,
                }
            }
            case EngineOperationType.EXECUTE_VALIDATE_AUTH: {
                const input = operation as ExecuteValidateAuthOperation
                const output = await pieceHelper.executeValidateAuth({
                    params: input,
                    pieceSource: EngineConstants.PIECE_SOURCES,
                })

                return {
                    status: EngineResponseStatus.OK,
                    response: output,
                }
            }
            default: {
                return {
                    status: EngineResponseStatus.INTERNAL_ERROR,
                    response: {},
                    error: `Unsupported operation type: ${operationType}`,
                }
            }
        }
    }
    catch (e) {
        return {
            status: EngineResponseStatus.INTERNAL_ERROR,
            response: {},
            error: inspect(e),
        }
    }
}


