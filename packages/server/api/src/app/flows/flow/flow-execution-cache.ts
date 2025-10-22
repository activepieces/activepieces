import { apDayjsDuration } from '@activepieces/server-shared'
import {  FlowExecutionState, flowExecutionStateKey, FlowId, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { distributedStore } from '../../helper/key-value'
import { projectService } from '../../project/project-service'
import { triggerSourceService } from '../../trigger/trigger-source/trigger-source-service'
import { handshakeHandler } from '../../webhooks/handshake-handler'
import { flowService } from './flow.service'

export const flowExecutionCache = (log: FastifyBaseLogger) => ({
    get: async (params: GetParams): Promise<FlowExecutionState> => {
        const { simulate } = params
        if (simulate) {
            return getFlowExecutionCache(params, log)
        }
        const cachedValue = await distributedStore.get<FlowExecutionState>(flowExecutionStateKey(params.flowId))
        if (isNil(cachedValue)) {
            const flowExecutionCache = await getFlowExecutionCache(params, log)
            await distributedStore.put(flowExecutionStateKey(params.flowId), flowExecutionCache, apDayjsDuration(30, 'day').asSeconds())
            return flowExecutionCache
        }
        return cachedValue
    },
    delete: async (flowId: FlowId): Promise<void> => {
        await distributedStore.delete(flowExecutionStateKey(flowId))
    },
})


async function getFlowExecutionCache(params: GetParams, log: FastifyBaseLogger): Promise<FlowExecutionState> {
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
