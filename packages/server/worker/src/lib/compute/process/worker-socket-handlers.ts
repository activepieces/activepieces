import { EngineHttpResponse, FlowRunResponse, FlowRunStatus, isFlowRunStateTerminal, isNil, spreadIfDefined, UpdateRunProgressRequest } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { engineResponsePublisher } from '../../utils/engine-response-publisher'
import { runsMetadataQueue } from '../flow-runs-queue'

export const workerSocketHandlers = {
    updateRunProgress: async (request: UpdateRunProgressRequest, log: FastifyBaseLogger): void => {
        const { runId, workerHandlerId, runDetails, httpRequestId, failedStepName, stepNameToTest, logsFileId } = request

        const nonSupportedStatuses = [FlowRunStatus.RUNNING, FlowRunStatus.SUCCEEDED, FlowRunStatus.PAUSED]
        if (!nonSupportedStatuses.includes(runDetails.status) && !isNil(workerHandlerId) && !isNil(httpRequestId)) {
            await engineResponsePublisher(log).publish(
                httpRequestId,
                workerHandlerId,
                await getFlowResponse(runDetails),
            )
        }

        await runsMetadataQueue(log).add({
            id: runId,
            status: runDetails.status,
            failedStepName,
            logsFileId,
            projectId,
            tags: runDetails.tags ?? [],
            ...spreadIfDefined('tasks', runDetails.tasks),
            ...spreadIfDefined('duration', runDetails.duration ? Math.floor(Number(runDetails.duration)) : undefined),
            finishTime: isFlowRunStateTerminal({
                status: runDetails.status,
                ignoreInternalError: true,
            }) ? new Date().toISOString() : undefined,
        })
    },
}


async function getFlowResponse(
    result: FlowRunResponse,
): Promise<EngineHttpResponse> {
    switch (result.status) {
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
            throw new Error(`Unexpected flow run status: ${result.status}`)
    }
}

