import { logger } from '@sentry/utils'
import { ExecutionOutput, ExecutionOutputStatus, PauseExecutionOutput, PauseType, StopExecutionOutput, apId } from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { pubSub } from '../../helper/pubsub'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'

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

const WEBHOOK_TIMEOUT_MS = (system.getNumber(SystemProp.WEBHOOK_TIMEOUT_SECONDS) ?? 30) * 1000
const HANDLER_ID = apId()
export const flowResponseWatcher = {
    getHandlerId(): string {
        return HANDLER_ID
    },
    async init(): Promise<void> {
        logger.info('[flowRunWatcher#init] Initializing flow run watcher')

        await pubSub.subscribe(`flow-run:sync:${HANDLER_ID}`, (_channel, message) => {
            const parsedMessasge: FlowResponseWithId = JSON.parse(message)
            const listener = listeners.get(parsedMessasge.flowRunId)
            if (listener) {
                listener(parsedMessasge.flowResponse)
                listeners.delete(parsedMessasge.flowRunId)
            }
            logger.info(`[flowRunWatcher#init] message=${parsedMessasge.flowRunId}`)
        })
    },
    async listen(flowRunId: string): Promise<FlowResponse> {
        logger.info(`[flowRunWatcher#listen] flowRunId=${flowRunId}`)
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                const defaultResponse: FlowResponse = {
                    status: StatusCodes.NO_CONTENT,
                    body: {},
                    headers: {},
                }
                resolve(defaultResponse)
            }, WEBHOOK_TIMEOUT_MS)

            listeners.set(flowRunId, (flowResponse) => {
                clearTimeout(timeout)
                resolve(flowResponse)
            })
        })
    },
    async publish(flowRunId: string, handlerId: string, executionOutput: ExecutionOutput): Promise<void> {
        logger.info(`[flowRunWatcher#publish] flowRunId=${flowRunId}`)
        const flowResponse = await getFlowResponse(executionOutput)
        const message: FlowResponseWithId = { flowRunId, flowResponse }
        await pubSub.publish(`flow-run:sync:${handlerId}`, JSON.stringify(message))
    },
    async shutdown(): Promise<void> {
        await pubSub.unsubscribe(`flow-run:sync:${HANDLER_ID}`)
    },
}


async function getFlowResponse(executionOutput: ExecutionOutput): Promise<FlowResponse> {

    switch (executionOutput.status) {
        case ExecutionOutputStatus.PAUSED:
            return getResponseForPausedRun(executionOutput)
        case ExecutionOutputStatus.STOPPED:
            return getResponseForStoppedRun(executionOutput)
        case ExecutionOutputStatus.INTERNAL_ERROR:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'An internal error has occurred',
                },
                headers: {},
            }
        case ExecutionOutputStatus.FAILED:
            return {
                status: StatusCodes.INTERNAL_SERVER_ERROR,
                body: {
                    message: 'The flow has failed and there is no response returned',
                },
                headers: {},
            }
        case ExecutionOutputStatus.TIMEOUT:
        case ExecutionOutputStatus.RUNNING:
            return {
                status: StatusCodes.GATEWAY_TIMEOUT,
                body: {
                    message: 'The request took too long to reply',
                },
                headers: {},
            }
        case ExecutionOutputStatus.SUCCEEDED:
        case ExecutionOutputStatus.QUOTA_EXCEEDED:
            return {
                status: StatusCodes.NO_CONTENT,
                body: {},
                headers: {},
            }
    }
    
}

async function getResponseForPausedRun(executionOutput: PauseExecutionOutput): Promise<FlowResponse> {

    if (executionOutput.pauseMetadata.type === PauseType.WEBHOOK) {
        return {
            status: StatusCodes.OK,
            body: executionOutput.pauseMetadata.metadata,
            headers: {},
        }
    }
    return {
        status: StatusCodes.NO_CONTENT,
        body: {},
        headers: {},
    }
    
}

async function getResponseForStoppedRun(executionOutput: StopExecutionOutput): Promise<FlowResponse> {
    return {
        status: executionOutput.stopResponse?.status ?? StatusCodes.OK,
        body: executionOutput.stopResponse?.body,
        headers: executionOutput.stopResponse?.headers ?? {},
    }
}
