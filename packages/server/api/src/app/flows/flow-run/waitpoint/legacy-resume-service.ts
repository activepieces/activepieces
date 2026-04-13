import {
    apId,
    EngineHttpResponse,
    ExecutionType,
    FlowRun,
    FlowRunStatus,
    RunEnvironment,
    StreamStepProgress,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { projectService } from '../../../project/project-service'
import { engineResponseWatcher } from '../../../workers/engine-response-watcher'
import { addToQueue, findFlowRunOrThrow, WEBHOOK_TIMEOUT_MS } from '../flow-run-service'
import { flowRunSideEffects } from '../flow-run-side-effects'
import { WaitpointResumePayload } from './waitpoint-types'

/**
 * @deprecated Deprecated since 2026-04-12. Use the waitpoint API instead.
 *
 * requestId is not validated — the flowRunId is an unguessable apId which provides
 * sufficient access control. The new waitpoint path uses waitpointId for the same
 * purpose.
 *
 * In-flight requests expecting a synchronous response will not work correctly on this
 * deprecated path because workerHandlerId/httpRequestId from the original pause are no
 * longer read from pauseMetadata. Callers should migrate to the waitpoint API.
 */
export const legacyResumeService = (log: FastifyBaseLogger): LegacyResumeService => ({
    async resumeAsync({ flowRunId, resumePayload }: LegacyResumeParams): Promise<LegacyResumeResult> {
        const flowRun = await findFlowRunOrThrow(flowRunId)
        if (flowRun.status !== FlowRunStatus.PAUSED) {
            return { stale: true }
        }
        await enqueueLegacyResume({ flowRun, resumePayload }, log)
        return { stale: false }
    },

    async resumeSync({ flowRunId, resumePayload, correlationId }: LegacyResumeSyncParams): Promise<EngineHttpResponse> {
        const flowRun = await findFlowRunOrThrow(flowRunId)
        if (flowRun.status !== FlowRunStatus.PAUSED) {
            return {
                status: StatusCodes.CONFLICT,
                body: { message: 'Flow run is not paused', flowRunStatus: flowRun.status },
                headers: {},
            }
        }
        const syncServerId = engineResponseWatcher(log).getServerId()
        await enqueueLegacyResume({ flowRun, resumePayload, workerHandlerIdOverride: syncServerId }, log)
        return engineResponseWatcher(log).oneTimeListener<EngineHttpResponse>(correlationId, true, WEBHOOK_TIMEOUT_MS, {
            status: StatusCodes.NO_CONTENT,
            body: {},
            headers: {},
        })
    },
})

async function enqueueLegacyResume(params: EnqueueLegacyResumeParams, log: FastifyBaseLogger): Promise<void> {
    const { flowRun, resumePayload, workerHandlerIdOverride } = params
    const platformId = await projectService(log).getPlatformId(flowRun.projectId)
    await flowRunSideEffects(log).onResume(flowRun)
    await addToQueue({
        payload: resumePayload,
        flowRun,
        platformId,
        workerHandlerId: workerHandlerIdOverride,
        httpRequestId: apId(),
        streamStepProgress: flowRun.environment === RunEnvironment.TESTING
            ? StreamStepProgress.WEBSOCKET
            : StreamStepProgress.NONE,
        executeTrigger: false,
        executionType: ExecutionType.RESUME,
    }, log)
}

type LegacyResumeService = {
    resumeAsync(params: LegacyResumeParams): Promise<LegacyResumeResult>
    resumeSync(params: LegacyResumeSyncParams): Promise<EngineHttpResponse>
}

type LegacyResumeParams = {
    flowRunId: string
    resumePayload: WaitpointResumePayload
}

type LegacyResumeSyncParams = LegacyResumeParams & {
    correlationId: string
}

type LegacyResumeResult = {
    stale: boolean
}

type EnqueueLegacyResumeParams = {
    flowRun: FlowRun
    resumePayload: WaitpointResumePayload
    workerHandlerIdOverride?: string
}
