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
    WorkerJobType,
    WorkerToApiContract,
} from '@activepieces/shared'
import { flowCache } from '../../cache/flow/flow-cache'
import { provisioner } from '../../cache/provisioner'
import { workerSettings } from '../../config/worker-settings'
import { sandboxManager } from '../sandbox-manager'
import { JobContext, JobHandler, JobResult } from '../types'
import { extractCodeArtifacts, extractPiecePackages } from '../utils/flow-helpers'
import { resolvePayload } from '../utils/resolve-payload'

export const executeFlowJob: JobHandler<ExecuteFlowJobData> = {
    jobType: WorkerJobType.EXECUTE_FLOW,
    async execute(ctx: JobContext, data: ExecuteFlowJobData): Promise<JobResult> {
        const settings = workerSettings.getSettings()
        const timeoutInSeconds = settings.FLOW_TIMEOUT_SECONDS

        const flowVersion = await flowCache(ctx.log, ctx.apiClient).getVersion({ flowVersionId: data.flowVersionId })
        if (isNil(flowVersion)) {
            ctx.log.info({ flowVersionId: data.flowVersionId }, 'Flow version not found, skipping')
            return {}
        }

        const pieces = await extractPiecePackages(flowVersion, data.platformId, ctx.log, ctx.apiClient)
        const codeSteps = extractCodeArtifacts(flowVersion)
        await provisioner(ctx.log, ctx.apiClient).provision({ pieces, codeSteps })

        const sandbox = sandboxManager.acquire({ log: ctx.log, apiClient: ctx.apiClient })
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

            if (result.engine.status === EngineResponseStatus.INTERNAL_ERROR) {
                await reportFlowStatus(ctx, data, FlowRunStatus.INTERNAL_ERROR)
                return {}
            }

            const delayInSeconds = result.engine.delayInSeconds
            if (delayInSeconds && delayInSeconds > 0) {
                return { delayInSeconds }
            }

            return {}
        }
        catch (e) {
            await sandboxManager.invalidate(ctx.log)
            if (e instanceof ActivepiecesError) {
                if (e.error.code === ErrorCode.SANDBOX_EXECUTION_TIMEOUT) {
                    await reportFlowStatus(ctx, data, FlowRunStatus.TIMEOUT)
                    return {}
                }
                if (e.error.code === ErrorCode.SANDBOX_MEMORY_ISSUE) {
                    await reportFlowStatus(ctx, data, FlowRunStatus.MEMORY_LIMIT_EXCEEDED)
                    return {}
                }
                if (e.error.code === ErrorCode.SANDBOX_LOG_SIZE_EXCEEDED) {
                    await reportFlowStatus(ctx, data, FlowRunStatus.INTERNAL_ERROR)
                    return {}
                }
            }
            await reportFlowStatus(ctx, data, FlowRunStatus.INTERNAL_ERROR)
            throw e
        }
        finally {
            await sandboxManager.release(ctx.log)
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
        serverHandlerId: data.synchronousHandlerId ?? null,
        runEnvironment: data.environment,
        httpRequestId: data.httpRequestId ?? null,
        progressUpdateType: data.progressUpdateType,
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
        const executionState = await fetchExecutionState(ctx.apiClient, data)
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

async function fetchExecutionState(apiClient: WorkerToApiContract, data: ExecuteFlowJobData): Promise<ExecutionState> {
    if (isNil(data.logsFileId)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                message: 'logsFileId is missing for RESUME operation',
                entityType: 'logs_file',
                entityId: data.runId,
            },
        })
    }
    const buffer = await apiClient.getPayloadFile({ fileId: data.logsFileId, projectId: data.projectId })
    const parsed = JSON.parse(buffer.toString('utf-8'))
    if (isNil(parsed.executionState)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                message: 'executionState is missing in logs file',
                entityType: 'execution_state',
                entityId: data.logsFileId,
            },
        })
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
        progressUpdateType: data.progressUpdateType,
        workerHandlerId: data.synchronousHandlerId ?? null,
        httpRequestId: data.httpRequestId ?? null,
        finishTime: new Date().toISOString(),
    })
}
