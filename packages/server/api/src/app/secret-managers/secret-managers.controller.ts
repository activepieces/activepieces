import { securityAccess } from '@activepieces/server-shared'
import { ConnectSecretManagerRequestSchema, DisconnectSecretManagerRequestSchema, PrincipalType, ResolveSecretRequestSchema } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
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

    app.post('/resolve', ResolveSecret, async (request) => {
        return service.resolve({ key: request.body.key, platformId: request.principal.platform.id })
    })

}

const ListSecretManagers = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}

const ConnectSecretManager = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        body: ConnectSecretManagerRequestSchema,
    },
}

const DisconnectSecretManager = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        querystring: DisconnectSecretManagerRequestSchema,
    },
}

const ResolveSecret = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        body: ResolveSecretRequestSchema,
    },
}