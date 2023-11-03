import { argv } from 'node:process'
import {
    EngineOperationType,
    ExecutePropsOptions,
    ExecuteFlowOperation,
    ExecuteTriggerOperation,
    ExecutionState,
    ExecuteActionOperation,
    EngineResponseStatus,
    TriggerHookType,
    ExecuteCodeOperation,
    ExecuteExtractPieceMetadata,
    ExecuteValidateAuthOperation,
    FinishExecutionOutput,
    ExecutionOutputStatus,
    StepOutputStatus,
    ExecutionType,
    EngineTestOperation,
    ExecutionOutput,
    ExecuteActionResponse,
    EngineResponse,
} from '@activepieces/shared'
import { pieceHelper } from './lib/helper/piece-helper'
import { triggerHelper } from './lib/helper/trigger-helper'
import { utils } from './lib/utils'
import { flowExecutorNew } from './lib/handler/flow-executor'
import { ExecutionVerdict, FlowExecutorContext } from './lib/handler/context/flow-execution-context'
import { codeExecutor } from './lib/handler/code-executor'
import { BASE_CODE_DIRECTORY, INPUT_FILE, OUTPUT_FILE } from './lib/constants'
import { testExecution } from './lib/helper/test-execution-context'
import { pieceExecutor } from './lib/handler/piece-executor'


const executeFlow = async (input: ExecuteFlowOperation, context: FlowExecutorContext): Promise<EngineResponse<ExecutionOutput>> => {
    const output = await flowExecutorNew.execute({
        action: input.flowVersion.trigger.nextAction,
        executionState: context,
        constants: {
            flowId: input.flowVersion.flowId,
            flowRunId: input.flowRunId,
            executionType: input.executionType,
            serverUrl: input.serverUrl,
            apiUrl: input.serverUrl,
            projectId: input.projectId,
            workerToken: input.workerToken,
            resumePayload: input.executionType === ExecutionType.RESUME ? input.resumePayload : undefined,
            baseCodeDirectory: BASE_CODE_DIRECTORY,
        },
    })
    const state = new ExecutionState(undefined)
    for (const [name, step] of Object.entries(output.steps)) {
        state.insertStep(step, name, [])
    }
    const executionOut: FinishExecutionOutput = {
        tags: [],
        status: ExecutionOutputStatus.SUCCEEDED,
        tasks: 0,
        executionState: state,
        duration: 1000,
    }
    return {
        status: EngineResponseStatus.OK,
        response: executionOut,
    }
}


async function executeCode(input: ExecuteCodeOperation): Promise<ExecuteActionResponse> {
    const output = await codeExecutor.handle({
        action: input.step,
        executionState: await testExecution.stateFromFlowVersion({
            flowVersion: input.flowVersion,
            excludedStepName: input.step.name,
            projectId: input.projectId,
            workerToken: input.workerToken,
        }),
        constants: {
            flowId: input.flowVersion.flowId,
            flowRunId: 'test-run',
            projectId: input.projectId,
            executionType: ExecutionType.BEGIN,
            serverUrl: input.serverUrl,
            apiUrl: input.serverUrl,
            workerToken: input.workerToken,
            baseCodeDirectory: BASE_CODE_DIRECTORY,
        },
    })
    return {
        success: output.verdict !== ExecutionVerdict.FAILED,
        output: output.steps[input.step.name].output,
    }
}

async function executeAction(input: ExecuteActionOperation): Promise<ExecuteActionResponse> {
    const output = await pieceExecutor.handle({
        action: input.action,
        executionState: await testExecution.stateFromFlowVersion({
            flowVersion: input.flowVersion,
            excludedStepName: input.action.name,
            workerToken: input.workerToken,
            projectId: input.projectId,
        }),
        constants: {
            flowId: input.flowVersion.flowId,
            flowRunId: 'test-run',
            projectId: input.projectId,
            executionType: ExecutionType.BEGIN,
            serverUrl: input.serverUrl,
            apiUrl: input.serverUrl,
            workerToken: input.workerToken,
            baseCodeDirectory: BASE_CODE_DIRECTORY,
        },
    })
    return {
        success: output.verdict !== ExecutionVerdict.FAILED,
        output: output.steps[input.action.name].output,
    }
}

const execute = async (): Promise<void> => {
    try {
        const operationType = argv[2]

        switch (operationType) {
            case EngineOperationType.EXTRACT_PIECE_METADATA: {
                const input: ExecuteExtractPieceMetadata = await utils.parseJsonFile(INPUT_FILE)
                const output = await pieceHelper.extractPieceMetadata(input)
                await writeOutput({
                    status: EngineResponseStatus.OK,
                    response: output,
                })
                break
            }
            case EngineOperationType.EXECUTE_FLOW: {
                const input: ExecuteFlowOperation = await utils.parseJsonFile(INPUT_FILE)
                const flowExecutorContext = FlowExecutorContext.upsertStep(input.flowVersion.trigger.name, {
                    output: input.triggerPayload,
                    type: input.flowVersion.trigger.type,
                    status: StepOutputStatus.SUCCEEDED,
                    input: {},
                })
                const output = await executeFlow(input, flowExecutorContext)
                await writeOutput(output)
                break
            }
            case EngineOperationType.EXECUTE_PROPERTY: {
                const input: ExecutePropsOptions = await utils.parseJsonFile(INPUT_FILE)
                const output = await pieceHelper.executeProps(input)
                await writeOutput({
                    status: EngineResponseStatus.OK,
                    response: output,
                })
                break
            }
            case EngineOperationType.EXECUTE_TRIGGER_HOOK: {
                const input: ExecuteTriggerOperation<TriggerHookType> = await utils.parseJsonFile(INPUT_FILE)

                const output = await triggerHelper.executeTrigger(input)
                await writeOutput({
                    status: EngineResponseStatus.OK,
                    response: output,
                })
                break
            }
            case EngineOperationType.EXECUTE_ACTION: {
                const input: ExecuteActionOperation = await utils.parseJsonFile(INPUT_FILE)
                const output = await executeAction(input)
                await writeOutput({
                    status: EngineResponseStatus.OK,
                    response: output,
                })
                break
            }
            case EngineOperationType.EXECUTE_CODE: {
                const input: ExecuteCodeOperation = await utils.parseJsonFile(INPUT_FILE)
                const output = await executeCode(input)
                await writeOutput({
                    status: EngineResponseStatus.OK,
                    response: output,
                })
                break
            }
            case EngineOperationType.EXECUTE_VALIDATE_AUTH: {
                const input: ExecuteValidateAuthOperation = await utils.parseJsonFile(INPUT_FILE)
                const output = await pieceHelper.executeValidateAuth(input)

                await writeOutput({
                    status: EngineResponseStatus.OK,
                    response: output,
                })
                break
            }
            case EngineOperationType.EXECUTE_TEST_FLOW: {
                const input: EngineTestOperation = await utils.parseJsonFile(INPUT_FILE)
                const testExecutionState = await testExecution.stateFromFlowVersion({
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
    await utils.writeToJsonFile(OUTPUT_FILE, result)
}