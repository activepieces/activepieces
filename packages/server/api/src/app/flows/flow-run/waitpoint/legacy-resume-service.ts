import {
    EngineHttpResponse,
    ExecutionType,
    FlowRun,
    FlowRunStatus,
    isNil,
    PauseMetadata,
    PauseType,
    RunEnvironment,
    StreamStepProgress,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { repoFactory } from '../../../core/db/repo-factory'
import { projectService } from '../../../project/project-service'
import { engineResponseWatcher } from '../../../workers/engine-response-watcher'
import { FlowRunEntity } from '../flow-run-entity'
import { addToQueue, findFlowRunOrThrow, WEBHOOK_TIMEOUT_MS } from '../flow-run-service'
import { flowRunSideEffects } from '../flow-run-side-effects'
import { WaitpointResumePayload } from './waitpoint-types'

const flowRunRepo = repoFactory(FlowRunEntity)

export const legacyResumeService = (log: FastifyBaseLogger): LegacyResumeService => ({
    async resumeAsync({ flowRunId, resumePayload }: LegacyResumeParams): Promise<LegacyResumeResult> {
        const flowRun = await findFlowRunOrThrow(flowRunId)
        if (flowRun.status !== FlowRunStatus.PAUSED) {
            return { stale: true }
        }
        const pauseMetadata = await findPauseMetadata(flowRunId)
        await enqueueLegacyResume({ flowRun, pauseMetadata, resumePayload }, log)
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
        const pauseMetadata = await findPauseMetadata(flowRunId)
        const syncServerId = engineResponseWatcher(log).getServerId()
        await enqueueLegacyResume({ flowRun, pauseMetadata, resumePayload, workerHandlerIdOverride: syncServerId }, log)
        return engineResponseWatcher(log).oneTimeListener<EngineHttpResponse>(correlationId, true, WEBHOOK_TIMEOUT_MS, {
            status: StatusCodes.NO_CONTENT,
            body: {},
            headers: {},
        })
    },
})

async function findPauseMetadata(flowRunId: string): Promise<PauseMetadata | null> {
    const row = await flowRunRepo()
        .createQueryBuilder('flow_run')
        .select('flow_run.pauseMetadata', 'pauseMetadata')
        .where({ id: flowRunId })
        .getRawOne()
    if (isNil(row?.pauseMetadata)) {
        return null
    }
    const parsed = PauseMetadata.safeParse(row.pauseMetadata)
    return parsed.success ? parsed.data : null
}

async function enqueueLegacyResume(params: EnqueueLegacyResumeParams, log: FastifyBaseLogger): Promise<void> {
    const { flowRun, pauseMetadata, resumePayload, workerHandlerIdOverride } = params
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
    pauseMetadata: PauseMetadata | null
    resumePayload: WaitpointResumePayload
    workerHandlerIdOverride?: string
}
