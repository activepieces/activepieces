import {
    EngineHttpResponse,
    ExecutionType,
    FlowRun,
    FlowRunStatus,
    isNil,
    PauseType,
    RunEnvironment,
    StreamStepProgress,
} from '@activepieces/shared'
import { WaitpointResumePayload } from './waitpoint-types'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { projectService } from '../../../project/project-service'
import { engineResponseWatcher } from '../../../workers/engine-response-watcher'
import { addToQueue, findFlowRunOrThrow, WEBHOOK_TIMEOUT_MS } from '../flow-run-service'
import { flowRunSideEffects } from '../flow-run-side-effects'

export const legacyResumeService = (log: FastifyBaseLogger) => ({
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
    const pauseMetadata = flowRun.pauseMetadata
    const platformId = await projectService(log).getPlatformId(flowRun.projectId)
    await flowRunSideEffects(log).onResume(flowRun)
    await addToQueue({
        payload: resumePayload,
        flowRun,
        platformId,
        workerHandlerId: workerHandlerIdOverride ?? (isNil(pauseMetadata) ? undefined : pauseMetadata.handlerId),
        httpRequestId: isNil(pauseMetadata) ? undefined : (pauseMetadata.type === PauseType.WEBHOOK ? pauseMetadata.requestId : undefined),
        streamStepProgress: flowRun.environment === RunEnvironment.TESTING
            ? StreamStepProgress.WEBSOCKET
            : StreamStepProgress.NONE,
        executeTrigger: false,
        executionType: ExecutionType.RESUME,
    }, log)
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
