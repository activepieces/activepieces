import { ActivepiecesError, ErrorCode, FlowMigration, MigrateFlowsModelRequest, PrincipalType, SeekPage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { aiProviderService } from '../../ai/ai-provider-service'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { flowVersionMigrationService } from './flow-version-migration.service'

export const flowMigrationController: FastifyPluginAsyncZod = async (fastify) => {

    fastify.post('/', StartMigration, async (request) => {
        const platformId = request.principal.platform.id
        const userId = request.principal.id
        await assertModelTypeMatches({
            log: request.log,
            platformId,
            request: request.body,
        })
        return flowVersionMigrationService(request.log).enqueueMigrateFlowsModel({
            platformId,
            userId,
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

async function assertModelTypeMatches({
    log,
    platformId,
    request,
}: AssertModelTypeParams): Promise<void> {
    const { sourceModel, targetModel } = request
    const sourceProviderModels = await aiProviderService(log).listModels(platformId, sourceModel.provider)
    const targetProviderModels = await aiProviderService(log).listModels(platformId, targetModel.provider)
    const sourceProviderModel = sourceProviderModels.find((m) => m.id === sourceModel.model)
    const targetProviderModel = targetProviderModels.find((m) => m.id === targetModel.model)
    if (!sourceProviderModel) {
        throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: {
            entityType: 'AIProviderModel',
            entityId: `${sourceModel.provider}/${sourceModel.model}`,
        } })
    }
    if (!targetProviderModel) {
        throw new ActivepiecesError({ code: ErrorCode.ENTITY_NOT_FOUND, params: {
            entityType: 'AIProviderModel',
            entityId: `${targetModel.provider}/${targetModel.model}`,
        } })
    }

    if (sourceProviderModel.type !== targetProviderModel.type || sourceProviderModel.type !== request.aiProviderModelType) {
        throw new ActivepiecesError({ code: ErrorCode.VALIDATION, params: {
            message: 'Source and target models must be from the same type and the same aiProviderModelType',
        } })
    }
}

type AssertModelTypeParams = {
    log: FastifyBaseLogger
    platformId: string
    request: MigrateFlowsModelRequest
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
