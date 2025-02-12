import { exceptionHandler, OneTimeJobData, pinoLogging } from '@activepieces/server-shared'
import { ActivepiecesError, apId, BeginExecuteFlowOperation, ErrorCode, ExecutionType, FileCompression, FileType, FlowRunStatus, FlowVersion, GetFlowVersionForWorkerRequestType, isNil, ResumeExecuteFlowOperation, ResumePayload } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { fileService } from '../../../../../server/api/src/app/file/file.service'
import { flowRunRepo } from '../../../../../server/api/src/app/flows/flow-run/flow-run-service'
import { engineApiService } from '../api/server-api.service'
import { engineRunner } from '../engine'
import { workerMachine } from '../utils/machine'
type EngineConstants = 'internalApiUrl' | 'publicApiUrl' | 'engineToken'


async function prepareInput(flowVersion: FlowVersion, jobData: OneTimeJobData, engineToken: string, log: FastifyBaseLogger): Promise<Omit<BeginExecuteFlowOperation, EngineConstants> | Omit<ResumeExecuteFlowOperation, EngineConstants>> {
    switch (jobData.executionType) {
        case ExecutionType.BEGIN:
            return {
                flowVersion,
                flowRunId: jobData.runId,
                projectId: jobData.projectId,
                serverHandlerId: jobData.synchronousHandlerId ?? null,
                triggerPayload: jobData.payload,
                executionType: ExecutionType.BEGIN,
                runEnvironment: jobData.environment,
                httpRequestId: jobData.httpRequestId ?? null,
                progressUpdateType: jobData.progressUpdateType,
            }
        case ExecutionType.RESUME: {
            const flowRun = await engineApiService(engineToken, log).getRun({
                runId: jobData.runId,
            })
            return {
                flowVersion,
                flowRunId: jobData.runId,
                projectId: jobData.projectId,
                serverHandlerId: jobData.synchronousHandlerId ?? null,
                tasks: flowRun.tasks ?? 0,
                executionType: ExecutionType.RESUME,
                steps: flowRun.steps,
                runEnvironment: jobData.environment,
                httpRequestId: jobData.httpRequestId ?? null,
                resumePayload: jobData.payload as ResumePayload,
                progressUpdateType: jobData.progressUpdateType,
            }
        }
    }
}

async function handleMemoryIssueError(jobData: OneTimeJobData, engineToken: string, log: FastifyBaseLogger): Promise<void> {
    await saveTriggerPayload(jobData, engineToken, log)

    await engineApiService(engineToken, log).updateRunStatus({
        runDetails: {
            duration: 0,
            status: FlowRunStatus.MEMORY_LIMIT_EXCEEDED,
            tasks: 0,
            tags: [],
        },
        executionStateContentLength: null,
        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
    })
}


async function handleQuotaExceededError(jobData: OneTimeJobData, engineToken: string, log: FastifyBaseLogger): Promise<void> {
    await saveTriggerPayload(jobData, engineToken, log)

    await engineApiService(engineToken, log).updateRunStatus({
        runDetails: {
            duration: 0,
            status: FlowRunStatus.QUOTA_EXCEEDED,
            tasks: 0,
            tags: [],
        },
        executionStateContentLength: null,
        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
    })
}
async function handleTimeoutError(jobData: OneTimeJobData, engineToken: string, log: FastifyBaseLogger): Promise<void> {
    await saveTriggerPayload(jobData, engineToken, log)

    const timeoutFlowInSeconds = workerMachine.getSettings().FLOW_TIMEOUT_SECONDS * 1000
    await engineApiService(engineToken, log).updateRunStatus({
        runDetails: {
            duration: timeoutFlowInSeconds,
            status: FlowRunStatus.TIMEOUT,
        },
        executionStateContentLength: null,
        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
    })
}

async function handleInternalError(jobData: OneTimeJobData, engineToken: string, e: Error, log: FastifyBaseLogger): Promise<void> {
    await saveTriggerPayload(jobData, engineToken, log)

    await engineApiService(engineToken, log).updateRunStatus({
        runDetails: {
            duration: 0,
            status: FlowRunStatus.INTERNAL_ERROR,
            tasks: 0,
            tags: [],
        },
        executionStateContentLength: null,
        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
    })
    exceptionHandler.handle(e, log)
}

async function saveTriggerPayload(jobData: OneTimeJobData, engineToken: string, log: FastifyBaseLogger): Promise<void> {
    const flowRun = await engineApiService(engineToken, log).getRun({
        runId: jobData.runId,
    })
    const logsFileId = flowRun.logsFileId || apId()
    const payload = JSON.stringify(jobData.payload)

    await fileService(log).save({
        fileId: logsFileId,
        projectId: jobData.projectId,
        data: Buffer.from(payload),
        size: payload.length,
        type: FileType.FLOW_RUN_LOG,
        compression: FileCompression.NONE,
        metadata: {
            flowRunId: jobData.runId,
            projectId: jobData.projectId,
        },
    })

    if (isNil(flowRun.logsFileId)) {
        await flowRunRepo().update(jobData.runId, {
            logsFileId,
        })
    }
}

export const flowJobExecutor = (log: FastifyBaseLogger) => ({
    async executeFlow(jobData: OneTimeJobData, engineToken: string): Promise<void> {
        try {

            const flow = await engineApiService(engineToken, log).getFlowWithExactPieces({
                versionId: jobData.flowVersionId,
                type: GetFlowVersionForWorkerRequestType.EXACT,
            })
            if (isNil(flow)) {
                return
            }
            const runLog = pinoLogging.createRunContextLog({
                log,
                runId: jobData.runId,
                webhookId: jobData.httpRequestId,
                flowId: flow.id,
                flowVersionId: flow.version.id,
            })
            await engineApiService(engineToken, log).checkTaskLimit()

            const input = await prepareInput(flow.version, jobData, engineToken, log)
            const { result } = await engineRunner(runLog).executeFlow(
                engineToken,
                input,
            )

            if (result.status === FlowRunStatus.INTERNAL_ERROR) {
                await handleInternalError(jobData, engineToken, new ActivepiecesError({
                    code: ErrorCode.ENGINE_OPERATION_FAILURE,
                    params: {
                        message: result.error?.message ?? 'internal error',
                    },
                }), log)
            }

        }
        catch (e) {
            const isQuotaExceededError = e instanceof ActivepiecesError && e.error.code === ErrorCode.QUOTA_EXCEEDED
            const isTimeoutError = e instanceof ActivepiecesError && e.error.code === ErrorCode.EXECUTION_TIMEOUT
            const isMemoryIssueError = e instanceof ActivepiecesError && e.error.code === ErrorCode.MEMORY_ISSUE
            if (isQuotaExceededError) {
                await handleQuotaExceededError(jobData, engineToken, log)
            }
            else if (isTimeoutError) {
                await handleTimeoutError(jobData, engineToken, log)
            }
            else if (isMemoryIssueError) {
                await handleMemoryIssueError(jobData, engineToken, log)
            }
            else {
                await handleInternalError(jobData, engineToken, e as Error, log)
            }
        }
    },
})