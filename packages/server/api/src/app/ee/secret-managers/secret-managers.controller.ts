import { ConnectSecretManagerRequestSchema, DisconnectSecretManagerRequestSchema } from '@activepieces/ee-shared'
import { securityAccess } from '@activepieces/server-shared'
import { PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import { secretManagerCache } from './secret-manager-cache'
import { secretManagersService } from './secret-managers.service'

export const secretManagersController: FastifyPluginAsyncTypebox = async (app) => {
    const service = secretManagersService(app.log)

    app.get('/', ListSecretManagers, async (request) => {
        return service.list({ platformId: request.principal.platform.id })
    })

    app.post('/connect', ConnectSecretManager, async (request) => {
        return service.connect({ ...request.body, platformId: request.principal.platform.id })
    })

    app.delete('/disconnect', DisconnectSecretManager, async (request) => {
        return service.disconnect({ providerId: request.query.providerId, platformId: request.principal.platform.id })
    })

    app.delete('/cache', ClearSecretManagerCache, async (request, reply) => {
        secretManagerCache.clearByPlatform(request.principal.platform.id)
        return reply.status(204).send()
    })
}

const ListSecretManagers = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}

const ConnectSecretManager = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: ConnectSecretManagerRequestSchema,
    },
}

const DisconnectSecretManager = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        querystring: DisconnectSecretManagerRequestSchema,
    },
}

const ClearSecretManagerCache = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
}
