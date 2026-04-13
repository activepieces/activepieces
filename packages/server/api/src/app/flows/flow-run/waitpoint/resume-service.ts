import {
    apId,
    EngineHttpResponse,
    ExecutionType,
    FlowRun,
    FlowRunId,
    FlowRunStatus,
    isFlowRunStateTerminal,
    RunEnvironment,
    StreamStepProgress,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { projectService } from '../../../project/project-service'
import { engineResponseWatcher } from '../../../workers/engine-response-watcher'
import { addToQueue, findFlowRunOrThrow, flowRunService, WEBHOOK_TIMEOUT_MS } from '../flow-run-service'
import { flowRunSideEffects } from '../flow-run-side-effects'
import { waitpointService } from './waitpoint-service'
import { Waitpoint, WaitpointResumePayload } from './waitpoint-types'

export const resumeService = (log: FastifyBaseLogger) => ({
    async resumeFromWaitpoint({ flowRunId, waitpointId, resumePayload, workerHandlerId }: ResumeFromWaitpointParams): Promise<ResumeFromWaitpointResult> {
        const flowRun = await findFlowRunOrThrow(flowRunId)

        if (!waitpointId) {
            if (flowRun.status !== FlowRunStatus.PAUSED) {
                return { flowRun, stale: true }
            }
            await enqueueResume({ flowRun, resumePayload, workerHandlerIdOverride: workerHandlerId }, log)
            return { flowRun, stale: false }
        }

        const processed = await waitpointService(log).handleResumeSignal({
            flowRunId,
            waitpointId,
            flowRunStatus: flowRun.status,
            projectId: flowRun.projectId,
            resumePayload: resumePayload ?? null,
            workerHandlerId,
            onReady: async (waitpoint) => {
                await enqueueResume({
                    flowRun,
                    waitpoint,
                    resumePayload,
                    workerHandlerIdOverride: workerHandlerId,
                }, log)
            },
        })
        return { flowRun, stale: !processed }
    },

    async handleSyncResumeFlow({ runId, waitpointId, payload, correlationId }: HandleSyncResumeFlowParams): Promise<EngineHttpResponse> {
        const flowRun = await flowRunService(log).getOnePopulatedOrThrow({
            id: runId,
            projectId: undefined,
        })

        if (isFlowRunStateTerminal({ status: flowRun.status, ignoreInternalError: false })) {
            return {
                status: StatusCodes.CONFLICT,
                body: { message: 'Flow run is not paused', flowRunStatus: flowRun.status },
                headers: {},
            }
        }

        if (!waitpointId) {
            if (flowRun.status !== FlowRunStatus.PAUSED) {
                return {
                    status: StatusCodes.CONFLICT,
                    body: { message: 'Flow run is not paused', flowRunStatus: flowRun.status },
                    headers: {},
                }
            }
            const syncServerId = engineResponseWatcher(log).getServerId()
            const httpRequestId = apId()
            await enqueueResume({ flowRun, resumePayload: payload, workerHandlerIdOverride: syncServerId, httpRequestIdOverride: httpRequestId }, log)
            return engineResponseWatcher(log).oneTimeListener<EngineHttpResponse>(httpRequestId, true, WEBHOOK_TIMEOUT_MS, {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            })
        }

        const syncServerId = engineResponseWatcher(log).getServerId()
        const { stale } = await this.resumeFromWaitpoint({
            flowRunId: runId,
            waitpointId,
            resumePayload: payload,
            workerHandlerId: syncServerId,
        })

        if (stale) {
            return {
                status: StatusCodes.GONE,
                body: { message: 'This link has expired. The action may have already been processed.' },
                headers: {},
            }
        }

        return engineResponseWatcher(log).oneTimeListener<EngineHttpResponse>(correlationId!, true, WEBHOOK_TIMEOUT_MS, {
            status: StatusCodes.NO_CONTENT,
            body: {},
            headers: {},
        })
    },
})

async function enqueueResume(params: EnqueueResumeParams, log: FastifyBaseLogger): Promise<void> {
    const { flowRun, waitpoint, resumePayload, workerHandlerIdOverride, httpRequestIdOverride } = params
    const platformId = await projectService(log).getPlatformId(flowRun.projectId)
    await flowRunSideEffects(log).onResume(flowRun)
    await addToQueue({
        payload: resumePayload,
        flowRun,
        platformId,
        workerHandlerId: workerHandlerIdOverride ?? waitpoint?.workerHandlerId ?? undefined,
        httpRequestId: httpRequestIdOverride ?? waitpoint?.httpRequestId ?? apId(),
        streamStepProgress: flowRun.environment === RunEnvironment.TESTING
            ? StreamStepProgress.WEBSOCKET
            : StreamStepProgress.NONE,
        executeTrigger: false,
        executionType: ExecutionType.RESUME,
    }, log)
}

type SyncResumePayload = {
    body?: unknown
    headers?: Record<string, string>
    queryParams?: Record<string, string>
}

type HandleSyncResumeFlowParams = {
    runId: string
    waitpointId?: string
    payload: SyncResumePayload
    correlationId?: string
}

type ResumeFromWaitpointParams = {
    flowRunId: FlowRunId
    waitpointId?: string
    resumePayload: WaitpointResumePayload
    workerHandlerId?: string
}

type ResumeFromWaitpointResult = {
    flowRun: FlowRun
    stale: boolean
}

type EnqueueResumeParams = {
    flowRun: FlowRun
    waitpoint?: Waitpoint
    resumePayload: WaitpointResumePayload
    workerHandlerIdOverride?: string
    httpRequestIdOverride?: string
}
