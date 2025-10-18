import { apDayjsDuration } from '@activepieces/server-shared'
import { Flow, FlowId, isNil, WebhookHandshakeConfiguration } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../helper/key-value'
import { projectService } from '../../project/project-service'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { handshakeHandler } from '../../webhooks/handshake-handler'
import { flowService } from './flow.service'

const key = (flowId: FlowId) => `flow-execution-cache:${flowId}`

export const flowExecutionCache = (log: FastifyBaseLogger) => ({
    get: async (params: GetParams): Promise<FlowExecutionCache> => {
        const { simulate } = params
        if (simulate) {
            return getFlowExecutionCache(params, log)
        }
        const cachedValue = await distributedStore.get<FlowExecutionCache>(key(params.flowId))
        if (isNil(cachedValue)) {
            const flowExecutionCache = await getFlowExecutionCache(params, log)
            await distributedStore.put(key(params.flowId), flowExecutionCache, apDayjsDuration(30, 'day').asSeconds())
            return flowExecutionCache
        }
        return cachedValue
    },
    delete: async (flowId: FlowId): Promise<void> => {
        await distributedStore.delete(key(flowId))
    },
})


async function getFlowExecutionCache(params: GetParams, log: FastifyBaseLogger): Promise<FlowExecutionCache> {
    const flow = await flowService(log).getOneById(params.flowId)
    if (isNil(flow)) {
        return {
            exists: false,
        }
    }
    const triggerSource = await triggerSourceService(log).getByFlowId({
        flowId: flow.id,
        projectId: flow.projectId,
        simulate: params.simulate,
    })
    return {
        exists: true,
        handshakeConfiguration: await handshakeHandler(log).getWebhookHandshakeConfiguration(triggerSource) ?? undefined,
        flow,
        platformId: await projectService.getPlatformId(flow.projectId),
    }
}

type GetParams = {
    flowId: FlowId
    simulate: boolean
}

type FlowExecutionCache = {
    exists: false
} | {
    exists: true
    handshakeConfiguration: WebhookHandshakeConfiguration | undefined
    flow: Flow
    platformId: string
}