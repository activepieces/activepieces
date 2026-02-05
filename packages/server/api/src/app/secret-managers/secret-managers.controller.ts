import { securityAccess } from '@activepieces/server-shared'
import { ConnectSecretManagerRequestSchema, PrincipalType } from '@activepieces/shared'
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