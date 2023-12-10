import {
    ApId,
    CreateFlowRequest,
    FlowOperationRequest,
    FlowStatus,
    FlowTemplate,
    GetFlowRequest,
    ListFlowsRequest,
} from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { flowService } from './flow.service'
import { CountFlowsRequest } from '@activepieces/shared'
import dayjs from 'dayjs'
import { isNil } from 'lodash'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'

const DEFAULT_PAGE_SIZE = 10

export const flowController: FastifyPluginAsyncTypebox = async (app) => {
    app.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)

    app.post('/', CreateFlowRequestOptions, async (request, reply) => {
        const newFlow = await flowService.create({
            projectId: request.principal.projectId,
            request: request.body,
        })

        return reply.status(StatusCodes.CREATED).send(newFlow)
    })

    app.post('/:id', UpdateFlowRequestOptions, async (request, reply) => {
        const flow = await flowService.getOnePopulatedOrThrow({
            id: request.params.id,
            projectId: request.principal.projectId,
            removeSecrets: false,
        })

        // BEGIN EE
        const currentTime = dayjs()
        if (!isNil(flow.version.updatedBy) &&
              flow.version.updatedBy !== request.principal.id &&
              currentTime.diff(dayjs(flow.version.updated), 'minute') <= 1
        ) {
            await reply.status(StatusCodes.CONFLICT).send()
            return
        }
        // END EE

        return flowService.update({
            id: request.params.id,
            userId: request.principal.id,
            projectId: request.principal.projectId,
            operation: request.body,
        })
    })

    app.post('/:id/status', UpdateFlowStatusRequestOptions, async (request) => {
        return flowService.updateStatus({
            id: request.params.id,
            projectId: request.principal.projectId,
            newStatus: request.body.status,
        })
    })

    app.post('/:id/published-version-id', UpdateFlowPublishedVersionIdRequestOptions, async (request) => {
        return flowService.updatedPublishedVersionId({
            id: request.params.id,
            userId: request.principal.id,
            projectId: request.principal.projectId,
        })
    })

    app.get('/', ListFlowsRequestOptions, async (request) => {
        return flowService.list({
            projectId: request.principal.projectId,
            folderId: request.query.folderId,
            cursorRequest: request.query.cursor ?? null,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
        })
    })

    app.get('/count', CountFlowsRequestOptions, async (request) => {
        return flowService.count({
            folderId: request.query.folderId,
            projectId: request.principal.projectId,
        })
    })

    app.get('/:id/template', GetFlowTemplateRequestOptions, async (request) => {
        return flowService.getTemplate({
            flowId: request.params.id,
            projectId: request.principal.projectId,
            versionId: undefined,
        })
    })

    app.get('/:id', GetFlowRequestOptions, async (request) => {
        return flowService.getOnePopulatedOrThrow({
            id: request.params.id,
            projectId: request.principal.projectId,
            versionId: request.query.versionId,
            removeSecrets: false,
        })
    })

    app.delete('/:id', DeleteFlowRequestOptions, async (request, reply) => {
        await flowService.delete({
            id: request.params.id,
            projectId: request.principal.projectId,
        })

        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const CreateFlowRequestOptions = {
    schema: {
        body: CreateFlowRequest,
    },
}

const UpdateFlowRequestOptions = {
    schema: {
        body: FlowOperationRequest,
        params: Type.Object({
            id: ApId,
        }),
    },
}

const UpdateFlowStatusRequestOptions = {
    schema: {
        body: Type.Object({
            status: Type.Enum(FlowStatus),
        }),
        params: Type.Object({
            id: ApId,
        }),
    },
}

const UpdateFlowPublishedVersionIdRequestOptions = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}

const ListFlowsRequestOptions = {
    schema: {
        querystring: ListFlowsRequest,
    },
}

const CountFlowsRequestOptions = {
    schema: {
        querystring: CountFlowsRequest,
    },
}

const GetFlowTemplateRequestOptions = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        response: {
            [StatusCodes.OK]: FlowTemplate,
        },
    },
}

const GetFlowRequestOptions = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
        querystring: GetFlowRequest,
    },
}

const DeleteFlowRequestOptions = {
    schema: {
        params: Type.Object({
            id: ApId,
        }),
    },
}
