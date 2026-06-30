import { inspect } from 'node:util'
import { ActivepiecesError, ErrorCode, isNil, tryCatch } from '@activepieces/core-utils'
import { onCallService } from '@activepieces/server-utils'
import { BeginExecuteFlowOperation, EngineOperationType, EngineResponseStatus, ExecuteFlowJobData, ExecutionType, FlowRunStatus, FlowVersion, ResumeExecuteFlowOperation, RunInternalError, RunInternalErrorSource, WorkerJobType } from '@activepieces/shared'
import { system, WorkerSystemProp } from '../../config/configs'
import { workerSettings } from '../../config/worker-settings'
import { FireAndForgetJobResult, JobContext, JobHandler, JobResultKind } from '../types'

export const executeFlowJob: JobHandler<ExecuteFlowJobData, FireAndForgetJobResult> = {
    jobType: WorkerJobType.EXECUTE_FLOW,
    async execute(ctx: JobContext, data: ExecuteFlowJobData): Promise<FireAndForgetJobResult> {
        const timeoutInSeconds = workerSettings.getSettings().FLOW_TIMEOUT_SECONDS

        const { data: resolved, error: provisionError } = await tryCatch(() =>
            ctx.resolver.resolve({ platformId: data.platformId, publicApiUrl: ctx.publicApiUrl, engineToken: ctx.engineToken, flow: { id: data.flowId, versionId: data.flowVersionId, projectId: data.projectId } }),
        )
        if (provisionError) {
            await reportFlowStatus(ctx, data, FlowRunStatus.INTERNAL_ERROR, toInternalError(RunInternalErrorSource.WORKER, provisionError))
            throw provisionError
        }

        if (resolved.kind === 'flow-not-found') {
            ctx.log.info({ flowVersion: { id: data.flowVersionId } }, 'Flow version not found, skipping')
            await reportFlowStatus(ctx, data, FlowRunStatus.FAILED)
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.INTERNAL_ERROR }
        }

        if (resolved.kind === 'disabled') {
            await reportFlowStatus(ctx, data, FlowRunStatus.FAILED)
            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.INTERNAL_ERROR }
        }

        // resolved.kind === 'ready' — flowVersion is guaranteed present when flow: is passed to resolve
        if (isNil(resolved.flowVersion)) {
            const error = new ActivepiecesError({ code: ErrorCode.VALIDATION, params: { message: 'flowVersion missing after resolve' } })
            await reportFlowStatus(ctx, data, FlowRunStatus.INTERNAL_ERROR, toInternalError(RunInternalErrorSource.WORKER, error))
            throw error
        }
        const flowVersion: FlowVersion = resolved.flowVersion

        if (data.executionType === ExecutionType.RESUME && isNil(data.logsFileId)) {
            const error = new ActivepiecesError({
                code: ErrorCode.RESUME_LOGS_FILE_MISSING,
                params: { runId: data.runId },
            }, 'logsFileId is missing for RESUME operation')
            await reportFlowStatus(ctx, data, FlowRunStatus.INTERNAL_ERROR, toInternalError(RunInternalErrorSource.WORKER, error))
            throw error
        }

        try {
            const operation = buildFlowOperation(ctx, data, flowVersion, timeoutInSeconds)
            const result = await ctx.runtime.execute({
                workerIndex: ctx.workerIndex,
                log: ctx.log,
                operationType: EngineOperationType.EXECUTE_FLOW,
                operation,
                timeoutInSeconds,
                provision: resolved.provision,
            })

            if (result.status === EngineResponseStatus.LOG_SIZE_EXCEEDED) {
                await reportFlowStatus(ctx, data, FlowRunStatus.LOG_SIZE_EXCEEDED)
                return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.LOG_SIZE_EXCEEDED, logs: result.logs }
            }

            if (result.status === EngineResponseStatus.INTERNAL_ERROR) {
                await reportFlowStatus(ctx, data, FlowRunStatus.INTERNAL_ERROR, {
                    source: RunInternalErrorSource.ENGINE,
                    message: result.error ?? 'Engine reported an internal error without details',
                    occurredAt: new Date().toISOString(),
                })
                return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.INTERNAL_ERROR, logs: result.logs }
            }

            return { kind: JobResultKind.FIRE_AND_FORGET, status: EngineResponseStatus.OK, logs: result.logs }
        }
        catch (e) {
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
            await reportFlowStatus(ctx, data, FlowRunStatus.INTERNAL_ERROR, toInternalError(RunInternalErrorSource.WORKER, e))
            throw e
        }
    },
}

function buildFlowOperation(
    ctx: JobContext,
    data: ExecuteFlowJobData,
    flowVersion: FlowVersion,
    timeoutInSeconds: number,
): BeginExecuteFlowOperation | ResumeExecuteFlowOperation {
    const base = {
        flowVersion,
        flowRunId: data.runId,
        projectId: data.projectId,
        workerHandlerId: data.workerHandlerId ?? null,
        runEnvironment: data.environment,
        httpRequestId: data.httpRequestId ?? null,
        streamStepProgress: data.streamStepProgress,
        stepNameToTest: data.stepNameToTest ?? null,
        logsFileId: data.logsFileId,
        timeoutInSeconds,
        platformId: data.platformId,
        engineToken: ctx.engineToken,
        internalApiUrl: ctx.internalApiUrl,
        publicApiUrl: ctx.publicApiUrl,
    }

    if (data.executionType === ExecutionType.RESUME) {
        return {
            ...base,
            executionType: ExecutionType.RESUME,
            resumePayload: data.payload,
            resumeReason: data.resumeReason,
        }
    }

    return {
        ...base,
        executionType: ExecutionType.BEGIN,
        triggerPayload: data.payload,
        executeTrigger: data.executeTrigger ?? false,
        sampleData: data.sampleData,
    }
}

function toInternalError(source: RunInternalErrorSource, error: unknown): RunInternalError {
    const isApError = error instanceof ActivepiecesError
    const base = error instanceof Error
        ? [error.name, error.message, error.stack].filter(Boolean).join('\n')
        : inspect(error, { depth: 1 })
    return {
        source,
        message: base,
        code: isApError ? error.error.code : undefined,
        occurredAt: new Date().toISOString(),
    }
}

async function reportFlowStatus(
    ctx: JobContext,
    data: ExecuteFlowJobData,
    status: FlowRunStatus,
    internalError?: RunInternalError,
): Promise<void> {
    // A status report has no log file of its own; carry logsFileId only for an internalError the server may
    // persist into one (see uploadRunLog). Sending it on a plain status report would dangle flow_run.logsFileId.
    await ctx.apiClient.uploadRunLog({
        runId: data.runId,
        status,
        projectId: data.projectId,
        streamStepProgress: data.streamStepProgress,
        finishTime: new Date().toISOString(),
        ...(isNil(internalError) ? {} : { logsFileId: data.logsFileId }),
        internalError,
    })

    if (status === FlowRunStatus.INTERNAL_ERROR && isDedicatedWorker()) {
        onCallService(ctx.log, workerSettings.getSettings().PAGE_ONCALL_WEBHOOK).page({
            code: ErrorCode.ENGINE_OPERATION_FAILURE,
            message: `Flow run ${data.runId} ended with INTERNAL_ERROR`,
            params: { runId: data.runId, flowId: data.flowId, projectId: data.projectId },
        }).catch((e) => ctx.log.error({ flowRun: { id: data.runId }, error: inspect(e) }, 'Failed to send on-call page for INTERNAL_ERROR'))
    }
}

function isDedicatedWorker(): boolean {
    return !isNil(system.get(WorkerSystemProp.WORKER_GROUP_ID))
}
