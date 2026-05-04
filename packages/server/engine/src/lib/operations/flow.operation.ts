import {
    BeginExecuteFlowOperation,
    EngineGenericError,
    EngineResponse,
    EngineResponseStatus,
    ExecuteFlowOperation,
    ExecuteTriggerResponse,
    ExecutionState,
    ExecutionType,
    FlowActionType,
    FlowRunStatus,
    flowStructureUtil,
    GenericStepOutput,
    isNil,
    JobPayload,
    LoopStepOutput,
    ResumePayload,
    StepOutput,
    StepOutputStatus,
    TriggerHookType,
    TriggerPayload,
} from '@activepieces/shared'
import { EngineConstants, HydratedFlowInput } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { testExecutionContext } from '../handler/context/test-execution-context'
import { flowExecutor } from '../handler/flow-executor'
import { flowRunProgressReporter } from '../helper/flow-run-progress-reporter'
import { triggerHelper } from '../helper/trigger-helper'
import { workerSocket } from '../worker-socket'

export const flowOperation = {
    execute: async (operation: ExecuteFlowOperation): Promise<EngineResponse<undefined>> => {
        const input: HydratedExecuteFlowOperation = {
            ...operation,
            hydrated: await hydrateFlowOperation(operation),
        }
        const constants = EngineConstants.fromExecuteFlowInput(input)
        const output: FlowExecutorContext = (await executieSingleStepOrFlowOperation(input, constants)).finishExecution()
        await flowRunProgressReporter.sendUpdate({
            engineConstants: constants,
            flowExecutorContext: output,
        })
        await flowRunProgressReporter.backup()
        const status = output.verdict.status === FlowRunStatus.LOG_SIZE_EXCEEDED
            ? EngineResponseStatus.LOG_SIZE_EXCEEDED
            : EngineResponseStatus.OK
        return {
            status,
            response: undefined,
        }
    },
}

const executieSingleStepOrFlowOperation = async (input: HydratedExecuteFlowOperation, constants: EngineConstants): Promise<FlowExecutorContext> => {
    const testSingleStepMode = !isNil(constants.stepNameToTest)
    if (testSingleStepMode) {
        const testContext = await testExecutionContext.stateFromFlowVersion({
            apiUrl: input.internalApiUrl,
            flowVersion: input.flowVersion,
            excludedStepName: input.stepNameToTest!,
            projectId: input.projectId,
            engineToken: input.engineToken,
            sampleData: input.sampleData,
            engineConstants: constants,
        })
        const step = flowStructureUtil.getActionOrThrow(input.stepNameToTest!, input.flowVersion.trigger)
        return flowExecutor.execute({
            action: step,
            executionState: await getFlowExecutionState(input, constants, testContext),
            constants,
        })
    }
    return flowExecutor.executeFromTrigger({
        executionState: await getFlowExecutionState(input, constants, FlowExecutorContext.empty()),
        constants,
        input,
    })
}

async function getFlowExecutionState(input: HydratedExecuteFlowOperation, constants: EngineConstants, flowContext: FlowExecutorContext): Promise<FlowExecutorContext> {
    if (input.hydrated.kind === 'begin') {
        const newPayload = await runOrReturnPayload(input as BeginExecuteFlowOperation, input.hydrated.payload, constants)
        flowContext = flowContext.upsertStep(input.flowVersion.trigger.name, GenericStepOutput.create({
            type: input.flowVersion.trigger.type,
            status: StepOutputStatus.SUCCEEDED,
            input: {},
        }).setOutput(newPayload))
    }
    else {
        flowContext = flowContext.addTags(input.hydrated.executionState.tags)
    }

    for (const [step, output] of Object.entries(input.hydrated.executionState.steps)) {
        if ([StepOutputStatus.SUCCEEDED, StepOutputStatus.PAUSED].includes(output.status)) {
            const newOutput = await insertSuccessStepsOrPausedRecursively(output)
            if (!isNil(newOutput)) {
                flowContext = flowContext.upsertStep(step, newOutput)
            }
        }
    }
    return flowContext
}

async function runOrReturnPayload(input: BeginExecuteFlowOperation, triggerPayload: unknown, constants: EngineConstants): Promise<TriggerPayload> {
    if (!input.executeTrigger) {
        return triggerPayload as TriggerPayload
    }
    const newPayload = await triggerHelper.executeTrigger({
        params: {
            ...input,
            hookType: TriggerHookType.RUN,
            test: false,
            webhookUrl: '',
            triggerPayload: triggerPayload as TriggerPayload,
        },
        constants,
    }) as ExecuteTriggerResponse<TriggerHookType.RUN>
    return newPayload.output[0] as TriggerPayload
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

async function hydrateFlowOperation(input: ExecuteFlowOperation): Promise<HydratedFlowInput> {
    if (input.executionType === ExecutionType.BEGIN) {
        return {
            kind: 'begin',
            payload: await resolveJobPayload(input.triggerPayload, input.projectId),
            executionState: { steps: {}, tags: [] },
        }
    }
    const executionState = await fetchExecutionStateFromLogs(input.logsFileId, input.projectId)
    if (Object.keys(executionState.steps).length === 0) {
        throw new EngineGenericError('EmptyResumeStateError', 'RESUME operation received with empty execution state')
    }
    return {
        kind: 'resume',
        payload: await resolveJobPayload(input.resumePayload, input.projectId) as ResumePayload,
        executionState,
    }
}

async function resolveJobPayload(payload: JobPayload, projectId: string): Promise<unknown> {
    if (payload.type === 'inline') {
        return payload.value
    }
    const buffer = await workerSocket.getWorkerClient().getPayloadFile({ fileId: payload.fileId, projectId })
    return JSON.parse(buffer.toString('utf-8'))
}

async function fetchExecutionStateFromLogs(logsFileId: string | undefined, projectId: string): Promise<ExecutionState> {
    if (isNil(logsFileId)) {
        throw new EngineGenericError('ResumeLogsFileMissing', 'logsFileId is missing for RESUME operation')
    }
    const buffer = await workerSocket.getWorkerClient().getPayloadFile({ fileId: logsFileId, projectId })
    const parsed = JSON.parse(buffer.toString('utf-8'))
    if (isNil(parsed?.executionState)) {
        throw new EngineGenericError('ExecutionStateMissing', 'executionState is missing in logs file')
    }
    return parsed.executionState as ExecutionState
}

export type HydratedExecuteFlowOperation = ExecuteFlowOperation & { hydrated: HydratedFlowInput }
