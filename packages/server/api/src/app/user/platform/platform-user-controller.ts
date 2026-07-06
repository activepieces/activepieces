import { ActivepiecesError, ApId, assertNotNullOrUndefined, ErrorCode, PlatformId, SeekPage } from '@activepieces/core-utils'
import { ApEdition, ListUsersRequestBody, PlatformRole, PrincipalType, SERVICE_KEY_SECURITY_OPENAPI, UpdateUserRequestBody, User, UserWithMetaInformation } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { system } from '../../helper/system/system'
import { platformService } from '../../platform/platform.service'
import { userService } from '../user-service'

export const platformUserController: FastifyPluginAsyncZod = async (app) => {

    app.get('/', ListUsersRequest, async (req) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        return userService(req.log).list({
            platformId,
            externalId: req.query.externalId,
            cursorRequest: req.query.cursor ?? null,
            limit: req.query.limit ?? 10,
        })
    })

    app.post('/:id', UpdateUserRequest, async (req) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        const principalId = req.principal.id
        assertNotNullOrUndefined(principalId, 'principalId')

        const targetUser = await userService(req.log).getOrThrow({ id: req.params.id })
        await validateUserOperation({
            log: req.log,
            principalId,
            targetUser,
            platformId,
        })

        return userService(req.log).update({
            id: req.params.id,
            platformId,
            platformRole: req.body.platformRole,
            status: req.body.status,
            externalId: req.body.externalId,
        })
    })

    app.delete('/:id', DeleteUserRequest, async (req, res) => {
        const platformId = req.principal.platform.id
        assertNotNullOrUndefined(platformId, 'platformId')

        const principalId = req.principal.id
        assertNotNullOrUndefined(principalId, 'principalId')

        const targetUser = await userService(req.log).getOrThrow({ id: req.params.id })
        await validateUserOperation({
            log: req.log,
            principalId,
            targetUser,
            platformId,
        })

        const edition = system.getEdition()
        if (edition === ApEdition.CLOUD) {
            await userService(req.log).removeFromPlatform({
                id: req.params.id,
                platformId,
            })
        }
        else {
            await userService(req.log).delete({
                id: req.params.id,
                platformId,
            })
        }

        return res.status(StatusCodes.NO_CONTENT).send()
    })
}

const ensureSamePlatform = (user: User, platformId: PlatformId): void => {
    const isSamePlatform = user.platformId === platformId
    if (!isSamePlatform) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityType: 'user',
                entityId: user.id,
            },
        })
    }
}

const ensureNotSelf = (principalId: string, targetUserId: string): void => {
    const isSelf = principalId === targetUserId
    if (isSelf) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: { message: 'Permission denied: self-modification is not permitted.' },
        })
    }
}

async function validateUserOperation({ log, principalId, targetUser, platformId }: {
    log: FastifyBaseLogger
    principalId: string
    targetUser: User
    platformId: PlatformId
}): Promise<void> {
    ensureSamePlatform(targetUser, platformId)
    ensureNotSelf(principalId, targetUser.id)

    const platform = await platformService(log).getOneOrThrow(platformId)
    const isActingUserOwner = platform.ownerId === principalId

    if (isActingUserOwner) {
        return
    }

    const actingUser = await userService(log).getOrThrow({ id: principalId })
    if (actingUser.platformRole !== PlatformRole.ADMIN) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: { message: 'Permission denied: user management requires administrator or owner privileges.' },
        })
    }

    const isTargetOwner = platform.ownerId === targetUser.id
    if (isTargetOwner) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: { message: 'Permission denied: the platform owner cannot be modified.' },
        })
    }

    const isTargetAdmin = targetUser.platformRole === PlatformRole.ADMIN
    if (isTargetAdmin) {
        throw new ActivepiecesError({
            code: ErrorCode.AUTHORIZATION,
            params: { message: 'Permission denied: modifying another administrator is not allowed.' },
        })
    }
}

const ListUsersRequest = {
    schema: {
        querystring: ListUsersRequestBody,
        response: {
            [StatusCodes.OK]: SeekPage(UserWithMetaInformation),
        },
        tags: ['users'],
        description: 'List users',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
    response: {
        [StatusCodes.OK]: SeekPage(UserWithMetaInformation),
    },
    config: {
        security: securityAccess.nonEmbedUsersOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
}

const UpdateUserRequest = {
    schema: {
        params: z.object({
            id: ApId,
        }),
        body: UpdateUserRequestBody,
        response: {
            [StatusCodes.OK]: UserWithMetaInformation,
        },
        tags: ['users'],
        description: 'Update user',
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
}

const DeleteUserRequest = {
    schema: {
        params: z.object({
            id: ApId,
        }),
        tags: ['users'],
        description: 'Delete user',
        response: {
            [StatusCodes.NO_CONTENT]: z.never(),
        },
        security: [SERVICE_KEY_SECURITY_OPENAPI],
    },
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER, PrincipalType.SERVICE]),
    },
}
