import { FlowVersionMetadata, ListFlowVersionRequest, SeekPage } from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { flowVersionService } from '../flow-version/flow-version.service'
import { flowService } from './flow.service'

const DEFAULT_PAGE_SIZE = 10

export const flowVersionController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/:flowId/versions', ListVersionParams, async (request) => {
        const flow = await flowService(request.log).getOneOrThrow({
            id: request.params.flowId,
            projectId: request.principal.projectId,
        })
        return flowVersionService(request.log).list({
            flowId: flow.id,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
            cursorRequest: request.query.cursor ?? null,
        })
    },
    )
}

const ListVersionParams = {
    schema: {
        params: Type.Object({
            flowId: Type.String(),
        }),
        querystring: ListFlowVersionRequest,
        response: {
            [StatusCodes.OK]: SeekPage(FlowVersionMetadata),
        },
    },
}
