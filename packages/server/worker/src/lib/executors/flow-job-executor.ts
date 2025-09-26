import { exceptionHandler, pinoLogging } from '@activepieces/server-shared'
import { ActivepiecesError, BeginExecuteFlowOperation, ErrorCode, ExecuteFlowJobData, ExecutionType, FlowRunStatus, FlowVersion, isNil, ResumeExecuteFlowOperation, ResumePayload, UpdateLogsBehavior } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { engineApiService } from '../api/server-api.service'
import { flowWorkerCache } from '../cache/flow-worker-cache'
import { engineRunner } from '../runner'
import { workerMachine } from '../utils/machine'

type EngineConstants = 'internalApiUrl' | 'publicApiUrl' | 'engineToken'


async function prepareInput(flowVersion: FlowVersion, jobData: ExecuteFlowJobData, attempsStarted: number, engineToken: string, timeoutInSeconds: number): Promise<Omit<BeginExecuteFlowOperation, EngineConstants> | Omit<ResumeExecuteFlowOperation, EngineConstants>> {
    switch (jobData.executionType) {
        case ExecutionType.BEGIN: {
            const flowRun = (jobData.executionType === ExecutionType.BEGIN && attempsStarted > 1) ? await engineApiService(engineToken).getRun({
                runId: jobData.runId,
            }) : undefined
            return {
                flowVersion,
                flowRunId: jobData.runId,
                projectId: jobData.projectId,
                serverHandlerId: jobData.synchronousHandlerId ?? null,
                triggerPayload: jobData.payload,
                executionType: ExecutionType.BEGIN,
                executionState: {
                    steps: !isNil(flowRun) ? flowRun.steps : {},
                },
                sampleData: jobData.sampleData,
                tasks: flowRun?.tasks ?? 0,
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

            const flowRun = await engineApiService(engineToken).getRun({
                runId: jobData.runId,
            })
            return {
                flowVersion,
                flowRunId: jobData.runId,
                projectId: jobData.projectId,
                serverHandlerId: jobData.synchronousHandlerId ?? null,
                tasks: flowRun?.tasks ?? 0,
                executionType: ExecutionType.RESUME,
                executionState: {
                    steps: flowRun?.steps ?? {},
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


async function handleMemoryIssueError(jobData: ExecuteFlowJobData, engineToken: string): Promise<void> {
    await engineApiService(engineToken).updateRunStatus({
        runDetails: {
            duration: 0,
            status: FlowRunStatus.MEMORY_LIMIT_EXCEEDED,
            tasks: 0,
            tags: [],
        },
        updateLogsBehavior: UpdateLogsBehavior.NONE,
        executionStateContentLength: null,
        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
    })
}



async function handleTimeoutError(jobData: ExecuteFlowJobData, engineToken: string): Promise<void> {
    const timeoutFlowInSeconds = workerMachine.getSettings().FLOW_TIMEOUT_SECONDS * 1000
    await engineApiService(engineToken).updateRunStatus({
        runDetails: {
            duration: timeoutFlowInSeconds,
            status: FlowRunStatus.TIMEOUT,
        },
        executionStateContentLength: null,
        updateLogsBehavior: UpdateLogsBehavior.NONE,
        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
    })
}

async function handleInternalError(jobData: ExecuteFlowJobData, engineToken: string, e: Error, log: FastifyBaseLogger): Promise<void> {
    await engineApiService(engineToken).updateRunStatus({
        runDetails: {
            duration: 0,
            status: FlowRunStatus.INTERNAL_ERROR,
            tasks: 0,
            tags: [],
        },
        executionStateContentLength: null,
        updateLogsBehavior: UpdateLogsBehavior.NONE,
        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
    })
    exceptionHandler.handle(e, log)
    throw e
}

export const flowJobExecutor = (log: FastifyBaseLogger) => ({
    async executeFlow({ jobData, attempsStarted, engineToken, timeoutInSeconds }: ExecuteFlowOptions): Promise<void> {
        try {

            const flow = await flowWorkerCache.getFlow({
                engineToken,
                flowVersionId: jobData.flowVersionId,
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


            const input = await prepareInput(flow.version, jobData, attempsStarted, engineToken, timeoutInSeconds)
            const { result } = await engineRunner(runLog).executeFlow(engineToken, input)

            if (result.status === FlowRunStatus.INTERNAL_ERROR) {
                throw new ActivepiecesError({
                    code: ErrorCode.ENGINE_OPERATION_FAILURE,
                    params: {
                        message: result.error?.message ?? 'internal error',
                    },
                })
            }

        }
        catch (e) {
            const isTimeoutError = e instanceof ActivepiecesError && e.error.code === ErrorCode.EXECUTION_TIMEOUT
            const isMemoryIssueError = e instanceof ActivepiecesError && e.error.code === ErrorCode.MEMORY_ISSUE

            if (isTimeoutError) {
                await handleTimeoutError(jobData, engineToken)
            }
            else if (isMemoryIssueError) {
                await handleMemoryIssueError(jobData, engineToken)
            }
            else {
                await handleInternalError(jobData, engineToken, e as Error, log)
            }
        }
    },
})

type ExecuteFlowOptions = {
    jobData: ExecuteFlowJobData
    attempsStarted: number
    engineToken: string
    timeoutInSeconds: number
}