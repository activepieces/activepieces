import { FlowVersionMetadata, ListFlowVersionRequest, PrincipalType, SeekPage } from '@activepieces/shared'
import {
    FastifyPluginAsyncTypebox,
    Type,
} from '@fastify/type-provider-typebox'
import { StatusCodes } from 'http-status-codes'
import { flowVersionService } from '../flow-version/flow-version.service'
import { flowService } from './flow.service'
import { projectAccess, ProjectResourceType } from '@activepieces/server-shared'
import { FlowEntity } from './flow.entity'

const DEFAULT_PAGE_SIZE = 10

export const flowVersionController: FastifyPluginAsyncTypebox = async (fastify) => {

    fastify.get('/:id/versions', ListVersionParams, async (request) => {
        const flow = await flowService(request.log).getOneOrThrow({
            id: request.params.id,
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
    config: {
        security: projectAccess([PrincipalType.USER], undefined, {
            type: ProjectResourceType.TABLE,
            tableName: FlowEntity,
        }),
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        querystring: ListFlowVersionRequest,
        response: {
            [StatusCodes.OK]: SeekPage(FlowVersionMetadata),
        },
    },
}
