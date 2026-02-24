import { pubsubFactory } from '@activepieces/server-shared'
import { EngineHttpResponse, FlowRunStatus, isFlowRunStateTerminal, isNil, SendFlowResponseRequest, StepRunResponse, UpdateRunProgressRequest, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { appSocket } from '../../app-socket'
import { runsMetadataQueue } from '../../flow-worker'
import { workerRedisConnections } from '../../utils/worker-redis'

const pubsub = pubsubFactory(workerRedisConnections.create)

export const engineSocketHandlers = (log: FastifyBaseLogger) => ({
    sendFlowResponse: async (request: SendFlowResponseRequest): Promise<void> => {
        const { workerHandlerId, httpRequestId, runResponse } = request
        await publishEngineResponse(log, {
            requestId: httpRequestId,
            workerServerId: workerHandlerId,
            response: runResponse,
        })
    },
    sendUserInteractionResponse: async <T>(request: PublishEngineResponseRequest<T>): Promise<void> => {
        const { requestId, workerServerId, response } = request
        await publishEngineResponse(log, {
            requestId,
            workerServerId,
            response,
        })
    },
    updateRunProgress: async (request: UpdateRunProgressRequest): Promise<void> => {
        const { runId, projectId, workerHandlerId, status, tags, httpRequestId, stepNameToTest, logsFileId, failedStep, startTime, finishTime, stepResponse, pauseMetadata, stepsCount } = request

        const nonSupportedStatuses = [FlowRunStatus.RUNNING, FlowRunStatus.SUCCEEDED, FlowRunStatus.PAUSED]
        if (!nonSupportedStatuses.includes(status) && !isNil(workerHandlerId) && !isNil(httpRequestId)) {
            await publishEngineResponse(log, {
                requestId: httpRequestId,
                workerServerId: workerHandlerId,
                response: await getFlowResponse(status),
            })
        }

        await runsMetadataQueue.add({
            id: runId,
            status,
            failedStep,
            startTime,
            finishTime,
            logsFileId,
            projectId,
            tags,
            pauseMetadata,
            stepsCount,
        })

        if (!isNil(stepNameToTest) && !isNil(stepResponse)) {
            const isTerminalOutput = isFlowRunStateTerminal({
                status,
                ignoreInternalError: false,
            })

            const wsEvent = isTerminalOutput  ? WebsocketServerEvent.EMIT_TEST_STEP_FINISHED : WebsocketServerEvent.EMIT_TEST_STEP_PROGRESS
            await appSocket(log).emitWithAck(wsEvent, { projectId, ...stepResponse })
        }
    },
    updateStepProgress: async (request: UpdateStepProgressRequest): Promise<void> => {
        const { projectId, stepResponse } = request
        await appSocket(log).emitWithAck(WebsocketServerEvent.EMIT_TEST_STEP_PROGRESS, { projectId, ...stepResponse })

    },
})

type UpdateStepProgressRequest = {
    projectId: string
    stepResponse: StepRunResponse
}


async function publishEngineResponse<T>(log: FastifyBaseLogger, request: PublishEngineResponseRequest<T>): Promise<void> {
    const { requestId, workerServerId, response } = request
    log.info({ requestId }, '[engineResponsePublisher#publishEngineResponse]')
    const message: EngineResponseWithId<T> = { requestId, response }
    await pubsub.publish(`engine-run:sync:${workerServerId}`, JSON.stringify(message))
}


async function getFlowResponse(status: FlowRunStatus): Promise<EngineHttpResponse> {
    switch (status) {
        case FlowRunStatus.INTERNAL_ERROR:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'An internal error has occurred',
                },
                headers: {},
            }
        case FlowRunStatus.FAILED:
        case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'The flow has failed and there is no response returned',
                },
                headers: {},
            }
        case FlowRunStatus.TIMEOUT:
            return {
                status: StatusCodes.GATEWAY_TIMEOUT,
                body: {
                    message: 'The request took too long to reply',
                },
                headers: {},
            }
        case FlowRunStatus.QUOTA_EXCEEDED:
            return {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            }
        // Case that should be handled before
        default:
            throw new Error(`Unexpected flow run status: ${status}`)
    }
}


type PublishEngineResponseRequest<T> = {
    requestId: string
    workerServerId: string
    response: T
}

type EngineResponseWithId<T> = { requestId: string, response: T }
