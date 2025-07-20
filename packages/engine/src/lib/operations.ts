import {
    Action,
    ActionType,
    BeginExecuteFlowOperation,
    EngineOperation,
    EngineOperationType,
    EngineResponse,
    EngineResponseStatus,
    ExecuteActionResponse,
    ExecuteExtractPieceMetadata,
    ExecuteFlowOperation,
    ExecutePropsOptions,
    ExecuteStepOperation,
    ExecuteToolOperation,
    ExecuteTriggerOperation,
    ExecuteTriggerResponse,
    ExecuteValidateAuthOperation,
    ExecutionType,
    FlowRunResponse,
    flowStructureUtil,
    GenericStepOutput,
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
import { utils } from './utils'

const executeFlow = async (input: ExecuteFlowOperation, context: FlowExecutorContext): Promise<EngineResponse<Pick<FlowRunResponse, 'status' | 'error'>>> => {
    const constants = EngineConstants.fromExecuteFlowInput(input)
    const output = await flowExecutor.executeFromTrigger({
        executionState: context,
        constants,
        input,
    })
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


async function executeActionForTool(input: ExecuteToolOperation): Promise<ExecuteActionResponse> {
    const step: Action = {
        name: input.actionName,
        displayName: input.actionName,
        type: ActionType.PIECE,
        settings: {
            input: input.input,
            actionName: input.actionName,
            pieceName: input.pieceName,
            pieceVersion: input.pieceVersion,
            pieceType: input.pieceType,
            packageType: input.packageType,
            inputUiInfo: {},
            errorHandlingOptions: {
                continueOnFailure: {
                    value: false,
                },
                retryOnFailure: {
                    value: false,
                },
            },
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

async function executeStep(input: ExecuteStepOperation): Promise<ExecuteActionResponse> {
    const step = flowStructureUtil.getActionOrThrow(input.stepName, input.flowVersion.trigger)
    const output = await flowExecutor.getExecutorForAction(step.type).handle({
        action: step,
        executionState: await testExecutionContext.stateFromFlowVersion({
            apiUrl: input.internalApiUrl,
            flowVersion: input.flowVersion,
            excludedStepName: step.name,
            projectId: input.projectId,
            engineToken: input.engineToken,
            sampleData: input.sampleData,
        }),
        constants: EngineConstants.fromExecuteStepInput(input),
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
    if (!input.formatPayload) {
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

async function getFlowExecutionState(input: ExecuteFlowOperation): Promise<FlowExecutorContext> {
    switch (input.executionType) {
        case ExecutionType.BEGIN: {
            const newPayload = await runOrReturnPayload(input)
            return FlowExecutorContext.empty().upsertStep(input.flowVersion.trigger.name, GenericStepOutput.create({
                type: input.flowVersion.trigger.type,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
            }).setOutput(newPayload))
        }
        case ExecutionType.RESUME: {
            let flowContext = FlowExecutorContext.empty().increaseTask(input.tasks)
            for (const [step, output] of Object.entries(input.steps)) {
                if ([StepOutputStatus.SUCCEEDED, StepOutputStatus.PAUSED].includes(output.status)) {
                    flowContext = flowContext.upsertStep(step, output)
                }
            }
            return flowContext
        }
    }
}

export async function execute(operationType: EngineOperationType, operation: EngineOperation): Promise<EngineResponse<unknown>> {
    try {

        switch (operationType) {
            case EngineOperationType.EXTRACT_PIECE_METADATA: {
                const input = operation as ExecuteExtractPieceMetadata
                const output = await pieceHelper.extractPieceMetadata({
                    params: input,
                    piecesSource: EngineConstants.PIECE_SOURCES,
                })
                return {
                    status: EngineResponseStatus.OK,
                    response: output,
                }
            }
            case EngineOperationType.EXECUTE_FLOW: {
                const input = operation as ExecuteFlowOperation
                const flowExecutorContext = await getFlowExecutionState(input)
                const output = await executeFlow(input, flowExecutorContext)
                return output
            }
            case EngineOperationType.EXECUTE_PROPERTY: {
                const input = operation as ExecutePropsOptions
                const output = await pieceHelper.executeProps({
                    params: input,
                    piecesSource: EngineConstants.PIECE_SOURCES,
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
            case EngineOperationType.EXECUTE_STEP: {
                const input = operation as ExecuteStepOperation
                const output = await executeStep(input)
                return {
                    status: EngineResponseStatus.OK,
                    response: output,
                }
            }
            case EngineOperationType.EXECUTE_VALIDATE_AUTH: {
                const input = operation as ExecuteValidateAuthOperation
                const output = await pieceHelper.executeValidateAuth({
                    params: input,
                    piecesSource: EngineConstants.PIECE_SOURCES,
                })

                return {
                    status: EngineResponseStatus.OK,
                    response: output,
                }
            }
        }
    }
    catch (e) {
        console.error(e)
        return {
            status: EngineResponseStatus.ERROR,
            response: utils.tryParseJson((e as Error).message),
        }
    }
}


