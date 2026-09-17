import { ActivepiecesError, ErrorCode, isNil, Permission } from '@activepieces/core-utils'
import { ConnectSecretManagerRequestSchema, PlatformRole, Principal, PrincipalType } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { userService } from '../../user/user-service'
import { rbacService } from '../authentication/project-role/rbac-service'
import { secretManagerCache } from './secret-manager-cache'
import { secretManagersService } from './secret-managers.service'

export const secretManagersController: FastifyPluginAsyncZod = async (app) => {
    const service = secretManagersService(app.log)

    app.get('/', ListSecretManagerConnections, async (request) => {
        const projectId = request.query.projectId
        await assertPrincipalCanListSecretManagers({
            principal: request.principal,
            projectId,
            log: request.log,
        })
        return service.list({
            platformId: request.principal.platform.id,
            projectId,
        })
    })

    app.post('/', CreateSecretManagerConnection, async (request, reply) => {
        const result = await service.create({ ...request.body, platformId: request.principal.platform.id })
        return reply.status(StatusCodes.CREATED).send(result)
    })

    app.post('/:id', UpdateSecretManagerConnection, async (request) => {
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
        return reply.status(StatusCodes.NO_CONTENT).send()
    })

    app.delete('/cache', ClearSecretManagerCache, async (request, reply) => {
        await secretManagerCache.invalidateConnectionEntries({ platformId: request.principal.platform.id, connectionId: request.query.connectionId })
        return reply.status(StatusCodes.NO_CONTENT).send()
    })
}

async function assertPrincipalCanListSecretManagers({ principal, projectId, log }: AssertCanListParams): Promise<void> {
    const user = await userService(log).getOneOrFail({ id: principal.id })
    if (user.platformRole === PlatformRole.ADMIN) {
        return
    }
    if (isNil(projectId)) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: {
                message: 'Listing secret manager connections across the platform requires a platform admin.',
            },
        })
    }
    await rbacService(log).assertPrinicpalAccessToProject({
        principal,
        permission: Permission.READ_APP_CONNECTION,
        projectId,
    })
}

const ListSecretManagerConnections = {
    config: {
        security: securityAccess.publicPlatform([PrincipalType.USER]),
    },
    schema: {
        querystring: z.object({
            projectId: z.string().optional(),
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
        params: z.object({
            id: z.string(),
        }),
        body: ConnectSecretManagerRequestSchema,
    },
}

const DeleteSecretManagerConnection = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
    schema: {
        params: z.object({
            id: z.string(),
        }),
    },
}

const ClearSecretManagerCache = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
    schema: {
        querystring: z.object({
            connectionId: z.string().optional(),
        }),
    },
}

type AssertCanListParams = {
    principal: Principal
    projectId: string | undefined
    log: FastifyBaseLogger
}
