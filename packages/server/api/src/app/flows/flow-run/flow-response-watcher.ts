import { logger } from '@sentry/utils'
import {
    FlowRunResponse,
    FlowRunStatus,
    PauseType,
    apId,
} from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { pubSub } from '../../helper/pubsub'
import { SystemProp, system } from 'server-shared'

const listeners = new Map<string, (flowResponse: FlowResponse) => void>()

type FlowResponse = {
    status: number
    body: unknown
    headers: Record<string, string>
}

type FlowResponseWithId = {
    flowRunId: string
    flowResponse: FlowResponse
}

const WEBHOOK_TIMEOUT_MS =
    (system.getNumber(SystemProp.WEBHOOK_TIMEOUT_SECONDS) ?? 30) * 1000
const HANDLER_ID = apId()
export const flowResponseWatcher = {
    getHandlerId(): string {
        return HANDLER_ID
    },
    async init(): Promise<void> {
        logger.info('[flowRunWatcher#init] Initializing flow run watcher')

        await pubSub.subscribe(
            `flow-run:sync:${HANDLER_ID}`,
            (_channel, message) => {
                const parsedMessasge: FlowResponseWithId = JSON.parse(message)
                const listener = listeners.get(parsedMessasge.flowRunId)
                if (listener) {
                    listener(parsedMessasge.flowResponse)
                    listeners.delete(parsedMessasge.flowRunId)
                }
                logger.info(
                    `[flowRunWatcher#init] message=${parsedMessasge.flowRunId}`,
                )
            },
        )
    },
    async listen(flowRunId: string, timeoutRequest: boolean): Promise<FlowResponse> {
        logger.info(`[flowRunWatcher#listen] flowRunId=${flowRunId}`)
        return new Promise((resolve) => {
            const defaultResponse: FlowResponse = {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            }
            const responseHandler = (flowResponse: FlowResponse) => {
                clearTimeout(timeout)
                resolve(flowResponse)
            }
            let timeout: NodeJS.Timeout
            if (!timeoutRequest) {
                listeners.set(flowRunId, resolve)
            }
            else {
                timeout = setTimeout(() => {
                    resolve(defaultResponse)
                }, WEBHOOK_TIMEOUT_MS)
                listeners.set(flowRunId, responseHandler)
            }
        })
    },    
    async publish(
        flowRunId: string,
        handlerId: string,
        result: FlowRunResponse,
    ): Promise<void> {
        logger.info(`[flowRunWatcher#publish] flowRunId=${flowRunId}`)
        const flowResponse = await getFlowResponse(result)
        const message: FlowResponseWithId = { flowRunId, flowResponse }
        await pubSub.publish(`flow-run:sync:${handlerId}`, JSON.stringify(message))
    },
    async shutdown(): Promise<void> {
        await pubSub.unsubscribe(`flow-run:sync:${HANDLER_ID}`)
    },
}

async function getFlowResponse(
    result: FlowRunResponse,
): Promise<FlowResponse> {
    switch (result.status) {
        case FlowRunStatus.PAUSED:
            if (result.pauseMetadata && result.pauseMetadata.type === PauseType.WEBHOOK) {
                return {
                    status: StatusCodes.OK,
                    body: result.pauseMetadata.response,
                    headers: {},
                }
            }
            return {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            }
        case FlowRunStatus.STOPPED:
            return {
                status: result.stopResponse?.status ?? StatusCodes.OK,
                body: result.stopResponse?.body,
                headers: result.stopResponse?.headers ?? {},
            }
        case FlowRunStatus.INTERNAL_ERROR:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'An internal error has occurred',
                },
                headers: {},
            }
        case FlowRunStatus.FAILED:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'The flow has failed and there is no response returned',
                },
                headers: {},
            }
        case FlowRunStatus.TIMEOUT:
        case FlowRunStatus.RUNNING:
            return {
                status: StatusCodes.GATEWAY_TIMEOUT,
                body: {
                    message: 'The request took too long to reply',
                },
                headers: {},
            }
        case FlowRunStatus.SUCCEEDED:
        case FlowRunStatus.QUOTA_EXCEEDED:
            return {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            }
    }
}
