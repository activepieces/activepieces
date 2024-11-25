import {
    ListTriggerEventsRequest,
    TestPollingTriggerRequest,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowService } from '../flow/flow.service'
import { triggerEventService } from './trigger-event.service'

const DEFAULT_PAGE_SIZE = 10

export const triggerEventModule: FastifyPluginAsyncTypebox = async (app) => {
    await app.register(triggerEventController, { prefix: '/v1/trigger-events' })
}

const triggerEventController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.get('/poll', TestPollingTriggerRequestParams, async (request) => {
        const flow = await flowService.getOnePopulatedOrThrow({
            projectId: request.principal.projectId,
            id: request.query.flowId,
        })

        return triggerEventService.test({
            projectId: request.principal.projectId,
            flow,
            platformId: request.principal.platform.id,
        })
    })

    fastify.post('/', PollRequestParams, async (request) => {
        return triggerEventService.saveEvent({
            projectId: request.principal.projectId,
            flowId: request.query.flowId,
            payload: request.body,
        })
    })

    fastify.get('/', ListTriggerEventsRequestParams, async (request) => {
        const flow = await flowService.getOnePopulatedOrThrow({
            id: request.query.flowId,
            projectId: request.principal.projectId,
        })

        return triggerEventService.list({
            projectId: request.principal.projectId,
            flow,
            cursor: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
        })
    },
    )
}



const TestPollingTriggerRequestParams = {
    schema: {
        querystring: TestPollingTriggerRequest,
    },
}

const ListTriggerEventsRequestParams = {
    schema: {
        querystring: ListTriggerEventsRequest,
    },
}

const PollRequestParams = {
    schema: {
        querystring: TestPollingTriggerRequest,
    },
}