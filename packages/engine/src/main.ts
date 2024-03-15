import { argv } from 'node:process'
import {
    EngineOperationType,
    ExecutePropsOptions,
    ExecuteFlowOperation,
    ExecuteTriggerOperation,
    EngineResponseStatus,
    TriggerHookType,
    ExecuteExtractPieceMetadata,
    ExecuteValidateAuthOperation,
    StepOutputStatus,
    ExecutionType,
    EngineTestOperation,
    ExecuteActionResponse,
    EngineResponse,
    GenericStepOutput,
    ExecuteStepOperation,
    flowHelper,
    Action,
    ActionType,
    isNil,
    FlowRunResponse,
} from '@activepieces/shared'
import { pieceHelper } from './lib/helper/piece-helper'
import { triggerHelper } from './lib/helper/trigger-helper'
import { utils } from './lib/utils'
import { flowExecutor } from './lib/handler/flow-executor'
import { ExecutionVerdict, FlowExecutorContext } from './lib/handler/context/flow-execution-context'
import { EngineConstants } from './lib/handler/context/engine-constants'
import { testExecutionContext } from './lib/handler/context/test-execution-context'

const executeFlow = async (input: ExecuteFlowOperation, context: FlowExecutorContext): Promise<EngineResponse<FlowRunResponse>> => {
    const output = await flowExecutor.execute({
        action: input.flowVersion.trigger.nextAction,
        executionState: context,
        constants: EngineConstants.fromExecuteFlowInput(input),
    })
    return {
        status: EngineResponseStatus.OK,
        response: await output.toResponse(),
    }
}


async function executeStep(input: ExecuteStepOperation): Promise<ExecuteActionResponse> {
    const step = flowHelper.getStep(input.flowVersion, input.stepName) as Action | undefined
    if (isNil(step) || !Object.values(ActionType).includes(step.type)) {
        throw new Error('Step not found or not supported')
    }
    const output = await flowExecutor.getExecutorForAction(step.type).handle({
        action: step,
        executionState: await testExecutionContext.stateFromFlowVersion({
            flowVersion: input.flowVersion,
            excludedStepName: step.name,
            projectId: input.projectId,
            workerToken: input.workerToken,
        }),
        constants: EngineConstants.fromExecuteStepInput(input),
    })
    return {
        success: output.verdict !== ExecutionVerdict.FAILED,
        output: output.steps[step.name].output ?? output.steps[step.name].errorMessage,
    }
}

function getFlowExecutionState(input: ExecuteFlowOperation): FlowExecutorContext {
    switch (input.executionType) {
        case ExecutionType.BEGIN:
            return FlowExecutorContext.empty().upsertStep(input.flowVersion.trigger.name, GenericStepOutput.create({
                type: input.flowVersion.trigger.type,
                status: StepOutputStatus.SUCCEEDED,
                input: {},
            }).setOutput(input.triggerPayload))
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

const execute = async (): Promise<void> => {
    try {
        const operationType = argv[2]

        switch (operationType) {
            case EngineOperationType.EXTRACT_PIECE_METADATA: {
                const input: ExecuteExtractPieceMetadata = await utils.parseJsonFile(EngineConstants.INPUT_FILE)
                const output = await pieceHelper.extractPieceMetadata({
                    params: input,
                    piecesSource: EngineConstants.PIECE_SOURCES,
                })
                await writeOutput({
                    status: EngineResponseStatus.OK,
                    response: output,
                })
                break
            }
            case EngineOperationType.EXECUTE_FLOW: {
                const input: ExecuteFlowOperation = await utils.parseJsonFile(EngineConstants.INPUT_FILE)
                const flowExecutorContext = getFlowExecutionState(input)
                const output = await executeFlow(input, flowExecutorContext)
                await writeOutput(output)
                break
            }
            case EngineOperationType.EXECUTE_PROPERTY: {
                const input: ExecutePropsOptions = await utils.parseJsonFile(EngineConstants.INPUT_FILE)
                const output = await pieceHelper.executeProps({
                    params: input,
                    piecesSource: EngineConstants.PIECE_SOURCES,
                    executionState: await testExecutionContext.stateFromFlowVersion({
                        flowVersion: input.flowVersion,
                        projectId: input.projectId,
                        workerToken: input.workerToken,
                    }),
                    searchValue: input.searchValue,
                    constants: EngineConstants.fromExecutePropertyInput(input),
                })
                await writeOutput({
                    status: EngineResponseStatus.OK,
                    response: output,
                })
                break
            }
            case EngineOperationType.EXECUTE_TRIGGER_HOOK: {
                const input: ExecuteTriggerOperation<TriggerHookType> = await utils.parseJsonFile(EngineConstants.INPUT_FILE)

                const output = await triggerHelper.executeTrigger({
                    params: input,
                    constants: EngineConstants.fromExecuteTriggerInput(input),
                })
                await writeOutput({
                    status: EngineResponseStatus.OK,
                    response: output,
                })
                break
            }
            case EngineOperationType.EXECUTE_STEP: {
                const input: ExecuteStepOperation = await utils.parseJsonFile(EngineConstants.INPUT_FILE)
                const output = await executeStep(input)
                await writeOutput({
                    status: EngineResponseStatus.OK,
                    response: output,
                })
                break
            }
            case EngineOperationType.EXECUTE_VALIDATE_AUTH: {
                const input: ExecuteValidateAuthOperation = await utils.parseJsonFile(EngineConstants.INPUT_FILE)
                const output = await pieceHelper.executeValidateAuth({
                    params: input,
                    piecesSource: EngineConstants.PIECE_SOURCES,
                })

                await writeOutput({
                    status: EngineResponseStatus.OK,
                    response: output,
                })
                break
            }
            case EngineOperationType.EXECUTE_TEST_FLOW: {
                const input: EngineTestOperation = await utils.parseJsonFile(EngineConstants.INPUT_FILE)
                const testExecutionState = await testExecutionContext.stateFromFlowVersion({
                    flowVersion: input.sourceFlowVersion,
                    projectId: input.projectId,
                    workerToken: input.workerToken,
                })
                const output = await executeFlow(input, testExecutionState)
                await writeOutput(output)
                break
            }
            default:
                console.error('unknown operation')
                break
        }
    }
    catch (e) {
        console.error(e)
        await writeOutput({
            status: EngineResponseStatus.ERROR,
            response: utils.tryParseJson((e as Error).message),
        })
    }
}

execute()
    .catch(e => console.error(e))

async function writeOutput(result: EngineResponse<unknown>): Promise<void> {
    await utils.writeToJsonFile(EngineConstants.OUTPUT_FILE, result)
}
