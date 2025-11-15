import { EngineHttpResponse, FlowRunStatus, isFlowRunStateTerminal, isNil, SendFlowResponseRequest, UpdateRunProgressRequest, WebsocketServerEvent } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { appSocket } from '../../app-socket'
import { runsMetadataQueue } from '../../flow-worker'
import { engineResponsePublisher } from '../../utils/engine-response-publisher'

export const engineSocketHandlers = (log: FastifyBaseLogger) => ({
    sendFlowResponse: async (request: SendFlowResponseRequest): Promise<void> => {
        const { workerHandlerId, httpRequestId, runResponse } = request
        await engineResponsePublisher(log).publish(
            httpRequestId,
            workerHandlerId,
            runResponse,
        )
    },
    updateRunProgress: async (request: UpdateRunProgressRequest): Promise<void> => {
        const { runId, projectId, workerHandlerId, status, tags, httpRequestId, stepNameToTest, logsFileId, failedStep, startTime, finishTime, stepResponse, pauseMetadata } = request

        const nonSupportedStatuses = [FlowRunStatus.RUNNING, FlowRunStatus.SUCCEEDED, FlowRunStatus.PAUSED]
        if (!nonSupportedStatuses.includes(status) && !isNil(workerHandlerId) && !isNil(httpRequestId)) {
            await engineResponsePublisher(log).publish(
                httpRequestId,
                workerHandlerId,
                await getFlowResponse(status),
            )
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
})


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
