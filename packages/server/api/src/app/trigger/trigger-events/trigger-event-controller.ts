
import { projectAccess, ProjectResourceType } from '@activepieces/server-shared'
import {
    ListTriggerEventsRequest,
    PrincipalType,
    SaveTriggerEventRequest,
} from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { flowService } from '../../flows/flow/flow.service'
import { triggerEventService } from './trigger-event.service'

const DEFAULT_PAGE_SIZE = 10

export const triggerEventController: FastifyPluginAsyncTypebox = async (fastify) => {


    fastify.post('/', SaveTriggerEventRequestParams, async (request) => {
        return triggerEventService(request.log).saveEvent({
            projectId: request.principal.projectId,
            flowId: request.body.flowId,
            payload: request.body.mockData,
        })
    })

    fastify.get('/', ListTriggerEventsRequestParams, async (request) => {
        const flow = await flowService(request.log).getOnePopulatedOrThrow({
            id: request.query.flowId,
            projectId: request.principal.projectId,
        })

        return triggerEventService(request.log).list({
            projectId: request.principal.projectId,
            flow,
            cursor: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
        })
    },
    )
}


const ListTriggerEventsRequestParams = {
    schema: {
        querystring: ListTriggerEventsRequest,
    },
    config: {
        security: projectAccess([PrincipalType.USER], undefined, {
            type: ProjectResourceType.QUERY,
        }),
    },
}

const SaveTriggerEventRequestParams = {
    schema: {
        body: SaveTriggerEventRequest,
    },
    config: {
        security: projectAccess([PrincipalType.USER], undefined, {
            type: ProjectResourceType.BODY,
        }),
    },
}