import { FastifyRequest } from 'fastify'
import {
    ApId,
    CreateFlowRequest,
    Flow,
    FlowId,
    FlowOperationRequest,
    FlowTemplate,
    FlowVersionId,
    GetFlowQueryParamsRequest,
    ListFlowsRequest,
    SeekPage,
} from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { flowService } from './flow.service'
import { CountFlowsRequest } from '@activepieces/shared'
import dayjs from 'dayjs'
import { isNil } from 'lodash'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'

const DEFUALT_PAGE_SIZE = 10

export const flowController: FastifyPluginAsyncTypebox = async (fastify) => {
    fastify.addHook('preSerialization', entitiesMustBeOwnedByCurrentProject)
    fastify.post(
        '/',
        {
            schema: {
                body: CreateFlowRequest,
            },
        },
        async (request) => {
            return flowService.create({ projectId: request.principal.projectId, request: request.body })
        },
    )

    fastify.post(
        '/:flowId',
        {
            schema: {
                params: Type.Object({
                    flowId: Type.String(),
                }),
                body: FlowOperationRequest,
            },
        },
        async (request, reply) => {
            const flow = await flowService.getOne({ id: request.params.flowId, versionId: undefined, projectId: request.principal.projectId })
            if (flow === null) {
                throw new ActivepiecesError({ code: ErrorCode.FLOW_NOT_FOUND, params: { id: request.params.flowId } })
            }
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
            return flowService.update({ userId: request.principal.id, flowId: request.params.flowId, request: request.body, projectId: request.principal.projectId })
        },
    )

    fastify.get(
        '/',
        ListFlowByIdRequest,
        async (request) => {
            return flowService.list({
                projectId: request.principal.projectId,
                folderId: request.query.folderId,
                cursorRequest: request.query.cursor ?? null,
                limit: request.query.limit ?? DEFUALT_PAGE_SIZE,
            })
        },
    )

    fastify.get(
        '/count',
        async (
            request: FastifyRequest<{
                Querystring: CountFlowsRequest
            }>,
        ) => {
            return flowService.count({ folderId: request.query.folderId, projectId: request.principal.projectId })
        },
    )


    fastify.get(
        '/:flowId/template',
        {
            schema: {
                params: {
                    flowId: { type: 'string' },
                },
                response: {
                    [StatusCodes.OK]: FlowTemplate,
                },
            },
        },
        async (
            request: FastifyRequest<{
                Params: {
                    flowId: FlowId
                }
            }>,
        ) => {
            return flowService.getTemplate({
                flowId: request.params.flowId,
                projectId: request.principal.projectId,
                versionId: undefined,
            })
        },
    )

    fastify.get(
        '/:flowId',
        GetFlowByIdRequest,
        async (request) => {
            const versionId: FlowVersionId | undefined = request.query.versionId
            const flow = await flowService.getOne({ id: request.params.flowId, versionId, projectId: request.principal.projectId })
            if (!flow) {
                throw new ActivepiecesError({ code: ErrorCode.FLOW_NOT_FOUND, params: { id: request.params.flowId } })
            }
            return flow
        },
    )

    fastify.delete(
        '/:flowId',
        DeleteFlowRequest,
        async (
            request,
            reply,
        ) => {
            await flowService.delete({ projectId: request.principal.projectId, flowId: request.params.flowId })
            return reply.status(StatusCodes.NO_CONTENT).send()
        },
    )

}


const ListFlowByIdRequest = {
    schema: {
        tags: ['flows'],
        description: 'List flows',
        querystring: ListFlowsRequest,
        response: {
            [StatusCodes.OK]: SeekPage(Flow),
        },
    },
}

const GetFlowByIdRequest = {
    schema: {
        tags: ['flows'],
        description: 'Get a flow by id',
        params: Type.Object({
            flowId: ApId,
        }),
        querystring: GetFlowQueryParamsRequest,
        response: {
            [StatusCodes.OK]: Flow,
        },
    },
}

const DeleteFlowRequest = {
    schema: {
        tags: ['flows'],
        description: 'Delete a flow',
        params: Type.Object({
            flowId: ApId,
        }),
        response: {
            [StatusCodes.NO_CONTENT]: Type.Undefined(),
        },
    },
}
