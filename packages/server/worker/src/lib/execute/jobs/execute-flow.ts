import { inspect } from 'node:util'
import { onCallService } from '@activepieces/server-utils'
import {
    ActivepiecesError,
    BeginExecuteFlowOperation,
    EngineOperationType,
    EngineResponseStatus,
    ErrorCode,
    ExecuteFlowJobData,
    ExecutionState,
    ExecutionType,
    FlowRunStatus,
    FlowVersion,
    isNil,
    ResumeExecuteFlowOperation,
    ResumePayload,
    tryCatch,
    WorkerJobType,
    WorkerToApiContract,
} from '@activepieces/shared'
import { flowCache } from '../../cache/flow/flow-cache'
import { system, WorkerSystemProp } from '../../config/configs'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'
import { provisionFlowPieces } from '../utils/flow-helpers'
import { resolvePayload } from '../utils/resolve-payload'

export const executeFlowJob: JobHandler<ExecuteFlowJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_FLOW,
    async execute(ctx: JobContext, data: ExecuteFlowJobData): Promise<FireAndForgetJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().FLOW_TIMEOUT_SECONDS

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionId })
        if (isNil(flowVersion)) {
            ctx.log.info({ flowVersionId: data.flowVersionId }, 'Flow version not found, skipping')
            await reportFlowStatus(ctx, data, FlowRunStatus.FAILED)
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.INTERNAL_ERROR }
        }

        const { data: provisioned, error: provisionError } = await tryCatch(() => provisionFlowPieces({ flowVersion, platformId: data.platformId, flowId: data.flowId, projectId: data.projectId, log: ctx.log, apiClient: ctx.apiClient }))
        if (provisionError) {
            await reportFlowStatus(ctx, data, FlowRunStatus.INTERNAL_ERROR)
            throw provisionError
        }
        if (!provisioned) {
            await reportFlowStatus(ctx, data, FlowRunStatus.FAILED)
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.INTERNAL_ERROR }
        }

        const sandbox = ctx.sandboxManager.acquire({ log: ctx.log, apiClient: ctx.apiClient })
        try {
            await sandbox.start({
                flowVersionId: flowVersion.id,
                platformId: data.platformId,
                mounts: [],
            })

            const resolvedPayload = await resolvePayload(data.payload, data.projectId, ctx.apiClient)
            const operation = await buildFlowOperation(ctx, data, resolvedPayload, flowVersion, timeoutInSeconds)
            const result = await sandbox.execute(
                EngineOperationType.EXECUTE_FLOW,
                operation,
                { timeoutInSeconds },
            )

            if (result.status === EngineResponseStatus.LOG_SIZE_EXCEEDED) {
                await reportFlowStatus(ctx, data, FlowRunStatus.LOG_SIZE_EXCEEDED)
                return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.LOG_SIZE_EXCEEDED, logs: result.logs }
            }

            if (result.status === EngineResponseStatus.INTERNAL_ERROR) {
                await reportFlowStatus(ctx, data, FlowRunStatus.INTERNAL_ERROR)
                return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.INTERNAL_ERROR, logs: result.logs }
            }

            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK, logs: result.logs }
        }
        catch (e) {
            await ctx.sandboxManager.invalidate(ctx.log)
            if (e instanceof ActivepiecesError) {
                if (e.error.code === ErrorCode.SANDBOX_EXECUTION_TIMEOUT) {
                    await reportFlowStatus(ctx, data, FlowRunStatus.TIMEOUT)
                    return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.TIMEOUT }
                }
                if (e.error.code === ErrorCode.SANDBOX_MEMORY_ISSUE) {
                    await reportFlowStatus(ctx, data, FlowRunStatus.MEMORY_LIMIT_EXCEEDED)
                    return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.MEMORY_ISSUE }
                }
                if (e.error.code === ErrorCode.SANDBOX_LOG_SIZE_EXCEEDED) {
                    await reportFlowStatus(ctx, data, FlowRunStatus.LOG_SIZE_EXCEEDED)
                    return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.LOG_SIZE_EXCEEDED }
                }
            }
            await reportFlowStatus(ctx, data, FlowRunStatus.INTERNAL_ERROR)
            throw e
        }
        finally {
            await ctx.sandboxManager.release(ctx.log)
        }
    },
}

async function buildFlowOperation(
    ctx: JobContext,
    data: ExecuteFlowJobData,
    resolvedPayload: unknown,
    flowVersion: FlowVersion,
    timeoutInSeconds: number,
): Promise<BeginExecuteFlowOperation | ResumeExecuteFlowOperation> {
    const base = {
        flowVersion,
        flowRunId: data.runId,
        projectId: data.projectId,
        workerHandlerId: data.workerHandlerId ?? null,
        runEnvironment: data.environment,
        httpRequestId: data.httpRequestId ?? null,
        streamStepProgress: data.streamStepProgress,
        stepNameToTest: data.stepNameToTest ?? null,
        logsUploadUrl: data.logsUploadUrl,
        logsFileId: data.logsFileId,
        timeoutInSeconds,
        platformId: data.platformId,
        engineToken: ctx.engineToken,
        internalApiUrl: ctx.internalApiUrl,
        publicApiUrl: ctx.publicApiUrl,
    }

    if (data.executionType === ExecutionType.RESUME) {
        const executionState = await fetchExecutionState({ apiClient: ctx.apiClient, data })
        if (Object.keys(executionState.steps).length === 0) {
            ctx.log.error({ runId: data.runId, executionType: data.executionType }, 'RESUME operation has empty execution state — this is a bug that would cause an infinite loop')
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'RESUME operation received with empty execution state',
                },
            })
        }
        return {
            ...base,
            executionType: ExecutionType.RESUME,
            executionState,
            resumePayload: resolvedPayload as ResumePayload,
        }
    }

    return {
        ...base,
        executionType: ExecutionType.BEGIN,
        executionState: { steps: {}, tags: [] },
        triggerPayload: resolvedPayload,
        executeTrigger: data.executeTrigger ?? false,
        sampleData: data.sampleData,
    }
}

async function fetchExecutionState({ apiClient, data }: { apiClient: WorkerToApiContract, data: ExecuteFlowJobData }): Promise<ExecutionState> {
    if (isNil(data.logsFileId)) {
        throw new ActivepiecesError({
            code: ErrorCode.RESUME_LOGS_FILE_MISSING,
            params: { runId: data.runId },
        }, 'logsFileId is missing for RESUME operation')
    }
    const buffer = await apiClient.getPayloadFile({ fileId: data.logsFileId, projectId: data.projectId })
    const parsed = JSON.parse(buffer.toString('utf-8'))
    if (isNil(parsed.executionState)) {
        throw new ActivepiecesError({
            code: ErrorCode.EXECUTION_STATE_MISSING,
            params: { logsFileId: data.logsFileId },
        }, 'executionState is missing in logs file')
    }
    return parsed.executionState
}

async function reportFlowStatus(
    ctx: JobContext,
    data: ExecuteFlowJobData,
    status: FlowRunStatus,
): Promise<void> {
    await ctx.apiClient.uploadRunLog({
        runId: data.runId,
        status,
        projectId: data.projectId,
        streamStepProgress: data.streamStepProgress,
        finishTime: new Date().toISOString(),
    })

    if (status === FlowRunStatus.INTERNAL_ERROR && isDedicatedWorker()) {
        onCallService(ctx.log, workerSettings.getSettings().PAGE_ONCALL_WEBHOOK).page({
            code: ErrorCode.ENGINE_OPERATION_FAILURE,
            message: `Flow run ${data.runId} ended with INTERNAL_ERROR`,
            params: { runId: data.runId, flowId: data.flowId, projectId: data.projectId },
        }).catch((e) => ctx.log.error({ runId: data.runId, error: inspect(e) }, 'Failed to send on-call page for INTERNAL_ERROR'))
    }
}

function isDedicatedWorker(): boolean {
    return !isNil(system.get(WorkerSystemProp.WORKER_GROUP_ID))
}
