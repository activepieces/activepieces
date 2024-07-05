import { exceptionHandler, OneTimeJobData } from '@activepieces/server-shared'
import { ActivepiecesError, BeginExecuteFlowOperation, ErrorCode, ExecutionType, FlowRunStatus, FlowVersion, GetFlowVersionForWorkerRequestType, isNil, ResumeExecuteFlowOperation, ResumePayload } from '@activepieces/shared'
import { engineApiService } from '../api/server-api.service'
import { engineRunner } from '../engine'

type EngineConstants = 'internalApiUrl' | 'publicUrl' | 'engineToken'

async function prepareInput(flowVersion: FlowVersion, jobData: OneTimeJobData, engineToken: string): Promise<Omit<BeginExecuteFlowOperation, EngineConstants> | Omit<ResumeExecuteFlowOperation, EngineConstants>> {
    switch (jobData.executionType) {
        case ExecutionType.BEGIN:
            return {
                flowVersion,
                flowRunId: jobData.runId,
                projectId: jobData.projectId,
                serverHandlerId: jobData.synchronousHandlerId,
                triggerPayload: jobData.payload,
                executionType: ExecutionType.BEGIN,
                runEnvironment: jobData.environment,
                httpRequestId: jobData.httpRequestId ?? null,
                progressUpdateType: jobData.progressUpdateType,
            }
        case ExecutionType.RESUME: {
            const flowRun = await engineApiService(engineToken).getRun({
                runId: jobData.runId,
            })
            return {
                flowVersion,
                flowRunId: jobData.runId,
                projectId: jobData.projectId,
                serverHandlerId: jobData.synchronousHandlerId,
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
async function executeFlow(jobData: OneTimeJobData, engineToken: string): Promise<void> {
    try {
        const flow = await engineApiService(engineToken).getFlowWithExactPieces({
            versionId: jobData.flowVersionId,
            type: GetFlowVersionForWorkerRequestType.EXACT,
        })
        if (isNil(flow)) {
            return
        }
        await engineApiService(engineToken).checkTaskLimit()

        const input = await prepareInput(flow.version, jobData, engineToken)
        const { result } = await engineRunner.executeFlow(
            engineToken,
            input,
        )

        if (result.status === FlowRunStatus.INTERNAL_ERROR) {
            await handleInternalError(jobData, engineToken, new ActivepiecesError({
                code: ErrorCode.ENGINE_OPERATION_FAILURE,
                params: {
                    message: result.error?.message ?? 'internal error',
                },
            }))
        }

    }
    catch (e) {
        const isQuotaExceededError = e instanceof ActivepiecesError && e.error.code === ErrorCode.QUOTA_EXCEEDED
        const isTimeoutError = e instanceof ActivepiecesError && e.error.code === ErrorCode.EXECUTION_TIMEOUT
        if (isQuotaExceededError) {
            await handleQuotaExceededError(jobData, engineToken)
        }
        else if (isTimeoutError) {
            await handleTimeoutError(jobData, engineToken)
        }
        else {
            await handleInternalError(jobData, engineToken, e as Error)
        }
    }

}


async function handleQuotaExceededError(jobData: OneTimeJobData, engineToken: string): Promise<void> {
    await engineApiService(engineToken).updateRunStatus({
        runDetails: {
            steps: {},
            duration: 0,
            status: FlowRunStatus.QUOTA_EXCEEDED,
            tasks: 0,
            tags: [],
        },
        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
    })
}
async function handleTimeoutError(jobData: OneTimeJobData, engineToken: string): Promise<void> {
    await engineApiService(engineToken).updateRunStatus({
        runDetails: {
            steps: {},
            duration: 0,
            status: FlowRunStatus.TIMEOUT,
            tasks: 0,
            tags: [],
        },

        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
    })
}

async function handleInternalError(jobData: OneTimeJobData, engineToken: string, e: Error): Promise<void> {
    await engineApiService(engineToken).updateRunStatus({
        runDetails: {
            steps: {},
            duration: 0,
            status: FlowRunStatus.INTERNAL_ERROR,
            tasks: 0,
            tags: [],
        },
        httpRequestId: jobData.httpRequestId,
        progressUpdateType: jobData.progressUpdateType,
        workerHandlerId: jobData.synchronousHandlerId,
        runId: jobData.runId,
    })
    throwErrorToRetry(e as Error)
}

function throwErrorToRetry(error: Error): void {
    exceptionHandler.handle(error)
    throw error
}


export const flowJobExecutor = {
    executeFlow,
}