import { argv } from 'node:process'
import { FlowExecutor } from './lib/executors/flow-executor'
import { globals } from './lib/globals'
import {
    EngineOperationType,
    ExecutePropsOptions,
    ExecuteFlowOperation,
    ExecuteTriggerOperation,
    ExecutionState,
    ExecuteActionOperation,
    EngineResponse,
    EngineResponseStatus,
    TriggerHookType,
    ExecutionType,
    StepOutput,
    ExecuteCodeOperation,
    ExecuteExtractPieceMetadata,
    ExecuteValidateAuthOperation,
    flowHelper,
    EngineTestOperation,
} from '@activepieces/shared'
import { pieceHelper } from './lib/helper/piece-helper'
import { triggerHelper } from './lib/helper/trigger-helper'
import { VariableService } from './lib/services/variable-service'
import { testExecution } from './lib/helper/test-execution-context'
import { loggingUtils } from './lib/helper/logging-utils'
import { utils } from './lib/utils'

const initFlowExecutor = (input: ExecuteFlowOperation): FlowExecutor => {
    const { flowVersion } = input
    const firstStep = flowVersion.trigger.nextAction

    if (input.executionType === ExecutionType.RESUME) {
        const { resumeStepMetadata } = input
        const executionState = new ExecutionState(input.executionState)

        return new FlowExecutor({
            flowVersion,
            executionState,
            firstStep,
            resumeStepMetadata,
        })
    }

    const executionState = new ExecutionState(input.executionState)
    const variableService = new VariableService()

    const steps = flowHelper.getAllSteps(flowVersion.trigger)
    steps.forEach(step => {
        executionState.addConnectionTags(variableService.extractConnectionNames(step))
    })

    executionState.insertStep(input.triggerPayload as StepOutput, 'trigger', [])

    return new FlowExecutor({
        flowVersion,
        executionState,
        firstStep,
    })
}

const extractPieceMetadata = async (): Promise<void> => {
    try {
        const input: ExecuteExtractPieceMetadata = await utils.parseJsonFile(globals.inputFile)
        const output = await pieceHelper.extractPieceMetadata(input)

        await writeOutput({
            status: EngineResponseStatus.OK,
            response: output,
        })
    }
    catch (e) {
        console.error(e)
        await writeOutput({
            status: EngineResponseStatus.ERROR,
            response: (e as Error).message,
        })
    }
}

const executeFlow = async (input?: ExecuteFlowOperation): Promise<void> => {
    try {
        input = input ?? await utils.parseJsonFile<ExecuteFlowOperation>(globals.inputFile)

        globals.workerToken = input.workerToken!
        globals.projectId = input.projectId
        globals.serverUrl = input.serverUrl!
        globals.flowRunId = input.flowRunId

        if (input.executionType === ExecutionType.RESUME) {
            globals.resumePayload = input.resumePayload
        }

        const executor = initFlowExecutor(input)
        const output = await executor.safeExecute()

        await writeOutput({
            status: EngineResponseStatus.OK,
            response: await loggingUtils.trimExecution(output),
        })
    }
    catch (e) {
        console.error(e)
        await writeOutput({
            status: EngineResponseStatus.ERROR,
            response: (e as Error).message,
        })
    }
}

const executeProps = async (): Promise<void> => {
    try {
        const input: ExecutePropsOptions = await utils.parseJsonFile(globals.inputFile)

        globals.workerToken = input.workerToken!
        globals.projectId = input.projectId
        globals.serverUrl = input.serverUrl

        const output = await pieceHelper.executeProps(input)

        await writeOutput({
            status: EngineResponseStatus.OK,
            response: output,
        })
    }
    catch (e) {
        console.error(e)
        await writeOutput({
            status: EngineResponseStatus.ERROR,
            response: (e as Error).message,
        })
    }
}

const executeTrigger = async (): Promise<void> => {
    try {
        const input: ExecuteTriggerOperation<TriggerHookType> = await utils.parseJsonFile(globals.inputFile)

        globals.workerToken = input.workerToken!
        globals.projectId = input.projectId
        globals.serverUrl = input.serverUrl

        const output = await triggerHelper.executeTrigger(input)
        await writeOutput({
            status: EngineResponseStatus.OK,
            response: output,
        })
    }
    catch (e) {
        console.error(e)
        await writeOutput({
            status: EngineResponseStatus.ERROR,
            response: (e as Error).message,
        })
    }
}

const executeCode = async (): Promise<void> => {
    try {
        const operationInput: ExecuteCodeOperation = await utils.parseJsonFile(globals.inputFile)

        globals.projectId = operationInput.projectId
        globals.serverUrl = operationInput.serverUrl
        const output = await pieceHelper.executeCode(operationInput)
        await writeOutput({
            status: EngineResponseStatus.OK,
            response: output,
        })
    }
    catch (e) {
        console.error(e)
        await writeOutput({
            status: EngineResponseStatus.ERROR,
            response: utils.tryParseJson((e as Error).message),
        })
    }
}

const executeAction = async (): Promise<void> => {
    try {
        const input: ExecuteActionOperation = await utils.parseJsonFile(globals.inputFile)

        globals.workerToken = input.workerToken!
        globals.projectId = input.projectId
        globals.serverUrl = input.serverUrl

        const output = await pieceHelper.executeAction(input)
        await writeOutput({
            status: EngineResponseStatus.OK,
            response: output,
        })
    }
    catch (e) {
        console.error(e)
        await writeOutput({
            status: EngineResponseStatus.ERROR,
            response: utils.tryParseJson((e as Error).message),
        })
    }
}

const executeValidateAuth = async (): Promise<void> => {
    try {
        const input: ExecuteValidateAuthOperation = await utils.parseJsonFile(globals.inputFile)

        globals.workerToken = input.workerToken!
        globals.projectId = input.projectId
        globals.serverUrl = input.serverUrl

        const output = await pieceHelper.executeValidateAuth(input)

        await writeOutput({
            status: EngineResponseStatus.OK,
            response: output,
        })
    }
    catch (e) {
        console.error(e)
        await writeOutput({
            status: EngineResponseStatus.ERROR,
            response: utils.tryParseJson((e as Error).message),
        })
    }
}

const executeTest = async (): Promise<void> => {
    try {
        const input: EngineTestOperation = await utils.parseJsonFile(globals.inputFile)

        globals.workerToken = input.workerToken!
        globals.projectId = input.projectId
        globals.serverUrl = input.serverUrl

        const testExecutionState = await testExecution.stateFromFlowVersion({
            flowVersion: input.sourceFlowVersion,
        })

        await executeFlow({
            ...input,
            executionState: testExecutionState,
        })
    }
    catch (e) {
        console.error(e)
        await writeOutput({
            status: EngineResponseStatus.ERROR,
            response: utils.tryParseJson((e as Error).message),
        })
    }
}

async function writeOutput(result: EngineResponse<unknown>): Promise<void> {
    await utils.writeToJsonFile(globals.outputFile, result)
}

const execute = async (): Promise<void> => {
    const operationType = argv[2]

    switch (operationType) {
        case EngineOperationType.EXTRACT_PIECE_METADATA:
            await extractPieceMetadata()
            break
        case EngineOperationType.EXECUTE_FLOW:
            await executeFlow()
            break
        case EngineOperationType.EXECUTE_PROPERTY:
            await executeProps()
            break
        case EngineOperationType.EXECUTE_TRIGGER_HOOK:
            await executeTrigger()
            break
        case EngineOperationType.EXECUTE_ACTION:
            await executeAction()
            break
        case EngineOperationType.EXECUTE_CODE:
            await executeCode()
            break
        case EngineOperationType.EXECUTE_VALIDATE_AUTH:
            await executeValidateAuth()
            break
        case EngineOperationType.EXECUTE_TEST:
            await executeTest()
            break
        default:
            console.error('unknown operation')
            break
    }
}

execute()
    .catch(e => console.error(e))
