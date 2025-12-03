import { exceptionHandler, pinoLogging } from '@activepieces/server-shared'
import { ActivepiecesError, BeginExecuteFlowOperation, ConsumeJobResponse, ConsumeJobResponseStatus, EngineResponseStatus, ErrorCode, ExecuteFlowJobData, ExecutionType, FlowExecutionState, flowExecutionStateKey, FlowRunStatus, FlowStatus, FlowVersion, isNil, ResumeExecuteFlowOperation, ResumePayload, RunEnvironment } from '@activepieces/shared'
import { trace } from '@opentelemetry/api'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { flowRunLogs } from '../../api/server-api.service'
import { flowWorkerCache } from '../../cache/flow-worker-cache'
import { engineRunner } from '../../compute'
import { engineSocketHandlers } from '../../compute/process/engine-socket-handlers'
import { runsMetadataQueue } from '../../flow-worker'
import { workerRedisConnections } from '../../utils/worker-redis'

const tracer = trace.getTracer('flow-job-executor')

type EngineConstants = 'internalApiUrl' | 'publicApiUrl' | 'engineToken'

async function prepareInput(
    flowVersion: FlowVersion,
    jobData: ExecuteFlowJobData,
    attempsStarted: number,
    timeoutInSeconds: number,
): Promise<
    | Omit<BeginExecuteFlowOperation, EngineConstants>
    | Omit<ResumeExecuteFlowOperation, EngineConstants>
    > {
    const previousExecutionFile = (jobData.executionType === ExecutionType.RESUME || attempsStarted > 1) ? await flowRunLogs.get(jobData.logsUploadUrl) : null
    const steps = !isNil(previousExecutionFile) ? previousExecutionFile?.executionState?.steps : {}

    switch (jobData.executionType) {
        case ExecutionType.BEGIN: {
            return {
                platformId: jobData.platformId,
                flowVersion,
                flowRunId: jobData.runId,
                projectId: jobData.projectId,
                serverHandlerId: jobData.synchronousHandlerId ?? null,
                triggerPayload: jobData.payload,
                executionType: ExecutionType.BEGIN,
                executionState: {
                    steps,
                },
                sampleData: jobData.sampleData,
                executeTrigger: jobData.executeTrigger ?? false,
                runEnvironment: jobData.environment,
                httpRequestId: jobData.httpRequestId ?? null,
                progressUpdateType: jobData.progressUpdateType,
                stepNameToTest: jobData.stepNameToTest ?? null,
                logsUploadUrl: jobData.logsUploadUrl,
                logsFileId: jobData.logsFileId,
                timeoutInSeconds,
            }
        }
        case ExecutionType.RESUME: {

            return {
                platformId: jobData.platformId,
                flowVersion,
                flowRunId: jobData.runId,
                projectId: jobData.projectId,
                serverHandlerId: jobData.synchronousHandlerId ?? null,
                executionType: ExecutionType.RESUME,
                executionState: {
                    steps,
                },
                runEnvironment: jobData.environment,
                httpRequestId: jobData.httpRequestId ?? null,
                resumePayload: jobData.payload as ResumePayload,
                progressUpdateType: jobData.progressUpdateType,
                stepNameToTest: jobData.stepNameToTest ?? null,
                logsUploadUrl: jobData.logsUploadUrl,
                logsFileId: jobData.logsFileId,
                timeoutInSeconds,
            }
        }
    }
}

async function handleMemoryIssueError(
    jobData: ExecuteFlowJobData,
    log: FastifyBaseLogger,
): Promise<void> {
    await engineSocketHandlers(log).updateRunProgress({
        finishTime: dayjs().toISOString(),
        status: FlowRunStatus.MEMORY_LIMIT_EXCEEDED,
        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
        projectId: jobData.projectId,
    })
}

async function handleTimeoutError(
    jobData: ExecuteFlowJobData,
    log: FastifyBaseLogger,
): Promise<void> {
    await engineSocketHandlers(log).updateRunProgress({
        finishTime: dayjs().toISOString(),
        status: FlowRunStatus.TIMEOUT,
        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
        projectId: jobData.projectId,
    })
}

async function handleInternalError(
    jobData: ExecuteFlowJobData,
    log: FastifyBaseLogger,
): Promise<void> {
    await engineSocketHandlers(log).updateRunProgress({
        finishTime: dayjs().toISOString(),
        status: FlowRunStatus.INTERNAL_ERROR,
        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
        projectId: jobData.projectId,
    })
}

export const flowJobExecutor = (log: FastifyBaseLogger) => ({
    async executeFlow({
        jobData,
        attemptsStarted,
        engineToken,
        timeoutInSeconds,
    }: ExecuteFlowOptions): Promise<ConsumeJobResponse> {
        return tracer.startActiveSpan('flowJobExecutor.executeFlow', {
            attributes: {
                'flow.runId': jobData.runId,
                'flow.flowVersionId': jobData.flowVersionId,
                'flow.projectId': jobData.projectId,
                'flow.executionType': jobData.executionType,
            },
        }, async (span) => {
            try {
                const shouldSkip = await shouldSkipDisabledFlow(jobData)
                if (shouldSkip) {
                    log.info({
                        message: '[flowJobExecutor] Skipping flow because it is disabled',
                        flowId: jobData.flowId,
                        projectId: jobData.projectId,
                    })
                    return {
                        status: ConsumeJobResponseStatus.OK,
                    }
                }

                const flowVersion = await flowWorkerCache(log).getVersion({
                    engineToken,
                    flowVersionId: jobData.flowVersionId,
                })
                if (isNil(flowVersion)) {
                    return {
                        status: ConsumeJobResponseStatus.OK,
                    }
                }
                await runsMetadataQueue.add({
                    id: jobData.runId,
                    projectId: jobData.projectId,
                    startTime: jobData.executionType === ExecutionType.BEGIN ? dayjs().toISOString() : undefined,
                    status: FlowRunStatus.RUNNING,
                })

                const runLog = pinoLogging.createRunContextLog({
                    log,
                    runId: jobData.runId,
                    webhookId: jobData.httpRequestId,
                    flowId: flowVersion.flowId,
                    flowVersionId: flowVersion.id,
                })

                const input = await prepareInput(
                    flowVersion,
                    jobData,
                    attemptsStarted,
                    timeoutInSeconds,
                )
                const { result, status, delayInSeconds } = await engineRunner(runLog).executeFlow(
                    engineToken,
                    input,
                )
                if (status === EngineResponseStatus.INTERNAL_ERROR) {
                    span.recordException(new Error(`Engine internal error: ${JSON.stringify(result)}`))
                    throw new ActivepiecesError({
                        code: ErrorCode.ENGINE_OPERATION_FAILURE,
                        params: {
                            message: JSON.stringify(result),
                        },
                    })
                }
                if (!isNil(delayInSeconds) && delayInSeconds > 0) {
                    span.setAttribute('flow.delayInSeconds', delayInSeconds)
                    return {
                        status: ConsumeJobResponseStatus.OK,
                        delayInSeconds,
                    }
                }
                return { status: ConsumeJobResponseStatus.OK }
            }
            catch (e) {
                const isTimeoutError =
                    e instanceof ActivepiecesError &&
                    e.error.code === ErrorCode.EXECUTION_TIMEOUT
                const isMemoryIssueError =
                    e instanceof ActivepiecesError &&
                    e.error.code === ErrorCode.MEMORY_ISSUE

                if (isTimeoutError) {
                    span.setAttribute('error.type', 'timeout')
                    await handleTimeoutError(jobData, log)
                    return {
                        status: ConsumeJobResponseStatus.OK,
                    }
                }
                else if (isMemoryIssueError) {
                    span.setAttribute('error.type', 'memory')
                    await handleMemoryIssueError(jobData, log)
                    return {
                        status: ConsumeJobResponseStatus.OK,
                    }
                }
                else {
                    span.recordException(e as Error)
                    await handleInternalError(jobData, log)
                    exceptionHandler.handle(e, log)
                    throw e
                }
            }
            finally {
                span.end()
            }
        })
    },
})


async function shouldSkipDisabledFlow(jobData: ExecuteFlowJobData): Promise<boolean> {
    if (jobData.environment === RunEnvironment.TESTING) {
        return false
    }
    const redisConnection = await workerRedisConnections.useExisting()
    const flowExecutionStateString = await redisConnection.get(flowExecutionStateKey(jobData.flowId))
    if (isNil(flowExecutionStateString)) {
        return false
    }
    const flowExecutionState = JSON.parse(flowExecutionStateString) as FlowExecutionState
    if (!flowExecutionState.exists || flowExecutionState.flow.status === FlowStatus.DISABLED) {
        return true
    }
    return false
}

type ExecuteFlowOptions = {
    jobData: ExecuteFlowJobData
    attemptsStarted: number
    engineToken: string
    timeoutInSeconds: number
}
