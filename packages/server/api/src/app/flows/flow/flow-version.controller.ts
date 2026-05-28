import { FlowVersionMetadata, ListFlowVersionRequest, PrincipalType, SeekPage } from '@activepieces/shared'
import { flowVersionRepo } from '../flow-version/flow-version.service'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ProjectResourceType } from '../../core/security/authorization/common'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { flowVersionService } from '../flow-version/flow-version.service'
import { FlowEntity } from './flow.entity'
import { flowService } from './flow.service'

const DEFAULT_PAGE_SIZE = 10

export const flowVersionController: FastifyPluginAsyncZod = async (fastify) => {

    fastify.get('/:flowId/versions', ListVersionParams, async (request) => {
        const flow = await flowService(request.log).getOneOrThrow({
            id: request.params.flowId,
            projectId: request.projectId,
        })
        return flowVersionService(request.log).list({
            flowId: flow.id,
            limit: request.query.limit ?? DEFAULT_PAGE_SIZE,
            cursorRequest: request.query.cursor ?? null,
        })
    },
    )
    fastify.patch('/:flowId/versions/:versionId/name', PatchVersionNameParams, async (request, reply) => {
        await flowService(request.log).getOneOrThrow({
            id: request.params.flowId,
            projectId: request.projectId,
        })
        await flowVersionRepo().update(
            { id: request.params.versionId, flowId: request.params.flowId },
            { versionName: request.body.versionName ?? null },
        )
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

const PatchVersionNameParams = {
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, {
            type: ProjectResourceType.TABLE,
            tableName: FlowEntity,
            lookup: {
                paramKey: 'flowId',
                entityField: 'id',
            },
        }),
    },
    schema: {
        params: z.object({
            flowId: z.string(),
            versionId: z.string(),
        }),
        body: z.object({
            versionName: z.string().nullable().optional(),
        }),
        response: {
            [StatusCodes.NO_CONTENT]: z.undefined(),
        },
    },
}

const ListVersionParams = {
    config: {
        security: securityAccess.project([PrincipalType.USER], undefined, {
            type: ProjectResourceType.TABLE,
            tableName: FlowEntity,
            lookup: {
                paramKey: 'flowId',
                entityField: 'id',
            },
        }),
    },
    schema: {
        params: z.object({
            flowId: z.string(),
        }),
        querystring: ListFlowVersionRequest,
        response: {
            [StatusCodes.OK]: SeekPage(FlowVersionMetadata),
        },
    },
}
