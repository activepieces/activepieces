import { FastifyRequest } from 'fastify'
import {
    CreateFlowRequest,
    FlowId,
    FlowOperationRequest,
    FlowTemplate,
    FlowVersionId,
    GetFlowRequest,
    ListFlowsRequest,
} from '@activepieces/shared'
import { StatusCodes } from 'http-status-codes'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { flowService } from './flow.service'
import { CountFlowsRequest } from '@activepieces/shared'
import dayjs from 'dayjs'
import { isNil } from 'lodash'
import { entitiesMustBeOwnedByCurrentProject } from '../../authentication/authorization'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'

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
            return await flowService.create({ projectId: request.principal.projectId, request: request.body })
        },
    )

    fastify.post(
        '/:flowId',
        {
            schema: {
                body: FlowOperationRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Params: {
                    flowId: FlowId
                }
                Body: FlowOperationRequest
            }>,
            reply,
        ) => {
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
            return await flowService.update({ userId: request.principal.id, flowId: request.params.flowId, request: request.body, projectId: request.principal.projectId })
        },
    )

    fastify.get(
        '/',
        {
            schema: {
                querystring: ListFlowsRequest,
            },
        },
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
            return flowService.count({ ...request.query, projectId: request.principal.projectId })
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
        {
            schema: {
                querystring: GetFlowRequest,
            },
        },
        async (
            request: FastifyRequest<{
                Params: {
                    flowId: FlowId
                }
                Querystring: GetFlowRequest
            }>,
        ) => {
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
        async (
            request: FastifyRequest<{
                Params: {
                    flowId: FlowId
                }
            }>,
            reply,
        ) => {
            await flowService.delete({ projectId: request.principal.projectId, flowId: request.params.flowId })
            return reply.status(StatusCodes.OK).send()
        },
    )

}
