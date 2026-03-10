import { ProjectResourceType, securityAccess } from '@activepieces/server-common'
import { FlowVersionMetadata, ListFlowVersionRequest, MigrateFlowsModelRequest, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { flowVersionMigrationService } from '../flow-version/flow-version-migration.service'
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
    })

    fastify.post('/versions/migrate-ai-model', MigrateAIModel, async (request, reply) => {
        const platformId = request.principal.platform.id
        await flowVersionMigrationService.enqueueMigrateFlowsModel(platformId, request.body, request.log)
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

}

const MigrateAIModel = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        body: MigrateFlowsModelRequest,
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
