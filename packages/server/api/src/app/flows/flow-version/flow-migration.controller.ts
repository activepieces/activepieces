import { FlowMigration, MigrateFlowsModelRequest, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { flowVersionMigrationService } from './flow-version-migration.service'

export const flowMigrationController: FastifyPluginAsyncZod = async (fastify) => {

    fastify.post('/', StartMigration, async (request) => {
        return flowVersionMigrationService(request.log).enqueueMigration({
            platformId: request.principal.platform.id,
            userId: request.principal.id,
            request: request.body,
            reqLog: request.log,
        })
    })

    fastify.get('/:id', GetMigration, async (request) => {
        const platformId = request.principal.platform.id
        return flowVersionMigrationService(request.log).getMigration({
            id: request.params.id,
            platformId,
        })
    })

    fastify.get('/', ListMigrations, async (request) => {
        return flowVersionMigrationService(request.log).listMigrations({
            platformId: request.principal.platform.id,
            limit: request.query.limit ?? 10,
            cursor: request.query.cursor ?? null,
        })
    })
}

const StartMigration = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: MigrateFlowsModelRequest,
        response: {
            [StatusCodes.OK]: FlowMigration,
        },
    },
}

const GetMigration = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: z.object({ id: z.string() }),
        response: {
            [StatusCodes.OK]: FlowMigration,
        },
    },
}

const ListMigrations = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        querystring: z.object({
            limit: z.coerce.number().optional(),
            cursor: z.string().optional(),
        }),
        response: {
            [StatusCodes.OK]: SeekPage(FlowMigration),
        },
    },
}
