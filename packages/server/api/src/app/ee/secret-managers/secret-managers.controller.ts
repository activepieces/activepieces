import { securityAccess } from '@activepieces/server-common'
import { ConnectSecretManagerRequestSchema, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox, Type } from '@fastify/type-provider-typebox'
import { secretManagerCache } from './secret-manager-cache'
import { secretManagerProvidersMetadata } from './secret-manager-providers/secret-manager-providers'
import { secretManagersService } from './secret-managers.service'

export const secretManagersController: FastifyPluginAsyncTypebox = async (app) => {
    const service = secretManagersService(app.log)

    app.get('/providers', ListSecretManagerProviders, async (_request) => {
        return secretManagerProvidersMetadata()
    })

    app.get('/', ListSecretManagerConnections, async (request) => {
        return service.list({
            platformId: request.principal.platform.id,
            projectId: request.query.projectId,
        })
    })

    app.post('/', CreateSecretManagerConnection, async (request, reply) => {
        const connection = await service.create({ ...request.body, platformId: request.principal.platform.id })
        return reply.status(201).send(connection)
    })

    app.patch('/:id', UpdateSecretManagerConnection, async (request) => {
        return service.update({
            id: request.params.id,
            platformId: request.principal.platform.id,
            request: request.body,
        })
    })

    app.delete('/:id', DeleteSecretManagerConnection, async (request, reply) => {
        await service.delete({
            id: request.params.id,
            platformId: request.principal.platform.id,
        })
        return reply.status(204).send()
    })

    app.delete('/cache', ClearSecretManagerCache, async (request, reply) => {
        await secretManagerCache.invalidateConnectionEntries(request.principal.platform.id, request.query.connectionId)
        return reply.status(204).send()
    })
}

const ListSecretManagerProviders = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
}

const ListSecretManagerConnections = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        querystring: Type.Object({
            projectId: Type.Optional(Type.String()),
        }),
    },
}

const CreateSecretManagerConnection = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        body: ConnectSecretManagerRequestSchema,
    },
}

const UpdateSecretManagerConnection = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
        body: ConnectSecretManagerRequestSchema,
    },
}

const DeleteSecretManagerConnection = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: Type.Object({
            id: Type.String(),
        }),
    },
}

const ClearSecretManagerCache = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        querystring: Type.Object({
            connectionId: Type.Optional(Type.String()),
        }),
    },
}
