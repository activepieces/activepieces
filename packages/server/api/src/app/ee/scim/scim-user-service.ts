import { isEnumValue, isNil } from '@activepieces/core-utils'
import { cryptoUtils } from '@activepieces/server-utils'
import { CreateScimUserRequest, parseScimFilter, PlatformRole, ReplaceScimUserRequest, SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA, SCIM_LIST_RESPONSE_SCHEMA, SCIM_USER_SCHEMA, ScimError, ScimListResponse, ScimPatchRequest, ScimUserResource, User, UserIdentity, UserIdentityProvider, UserStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { userIdentityHelper } from '../../helper/user-identity-helper'
import { userService } from '../../user/user-service'
import { emailService } from '../helper/email/email-service'

export const scimUserService = (log: FastifyBaseLogger) => ({
    async create(params: {
        platformId: string
        request: CreateScimUserRequest
    }): Promise<ScimUserResource> {
        const { platformId, request } = params
        const email = request.userName.toLowerCase().trim()
        const firstName = request.name?.givenName ?? ''
        const lastName = request.name?.familyName ?? ''
        const externalId = request.externalId
        const active = request.active !== false
        const generatedPassword = await cryptoUtils.generateRandomPassword()
        const platformRole = request[SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA]?.platformRole ?? PlatformRole.MEMBER

        if (!isNil(externalId)) {
            const existingUser = await userService(log).getByPlatformAndExternalId({
                platformId,
                externalId,
            })
            if (!isNil(existingUser)) {
                throw new ScimError(
                    StatusCodes.CONFLICT,
                    'User with external ID already exists',
                )
            }
        }

        let identity = await userIdentityService(log).getIdentityByEmail(email)
        if (isNil(identity)) {
            identity = await userIdentityService(log).create({
                email,
                firstName,
                lastName,
                password: generatedPassword,
                trackEvents: false,
                newsLetter: false,
                provider: UserIdentityProvider.SAML,
                verified: true,
            })
        }
        else if (userIdentityHelper(log).isEmbeddedIdentity(identity)) {
            throw new ScimError(
                StatusCodes.CONFLICT,
                'User with email already exists',
            )
        }

        const existingUserForIdentity = await userService(log).getOneByIdentityAndPlatform({
            identityId: identity.id,
            platformId,
        })
        if (!isNil(existingUserForIdentity)) {
            throw new ScimError(
                StatusCodes.CONFLICT,
                'User with email already exists',
            )
        }

        const user = await userService(log).getOrCreateWithProject({
            identity,
            platformId,
        })

        await userService(log).update({
            id: user.id,
            platformId,
            status: active ? UserStatus.ACTIVE : UserStatus.INACTIVE,
            platformRole,
            externalId,
        })

        await emailService(log).sendScimUserWelcome({
            email,
            platformId,
        })

        const finalUser = await userService(log).getOrThrow({ id: user.id })
        return toScimUserResource(finalUser, identity.email, identity.firstName, identity.lastName)
    },

    async getById(params: {
        platformId: string
        userId: string
    }): Promise<ScimUserResource> {
        const { platformId, userId } = params
        const { user, identity } = await getScimManagedUserOrThrow({ platformId, userId, log })
        return toScimUserResource(user, identity.email, identity.firstName, identity.lastName)
    },

    async list(params: {
        platformId: string
        filter?: string
        startIndex?: number
        count?: number
    }): Promise<ScimListResponse> {
        const { platformId, filter, startIndex = 1, count = 100 } = params

        const emptyPage: ScimListResponse = {
            schemas: [SCIM_LIST_RESPONSE_SCHEMA],
            totalResults: 0,
            startIndex,
            itemsPerPage: count,
            Resources: [],
        }

        // Parse SCIM filter - we support "userName eq \"value\""
        const filterEmail = parseScimFilter(filter, 'userName')

        if (!isNil(filterEmail)) {
            const identity = await userIdentityService(log).getIdentityByEmail(filterEmail)
            if (isNil(identity) || userIdentityHelper(log).isEmbeddedIdentity(identity)) {
                return emptyPage
            }
            const user = await userService(log).getOneByIdentityAndPlatform({
                identityId: identity.id,
                platformId,
            })
            if (isNil(user)) {
                return emptyPage
            }
            return {
                schemas: [SCIM_LIST_RESPONSE_SCHEMA],
                totalResults: 1,
                startIndex,
                itemsPerPage: count,
                Resources: [toScimUserResource(user, identity.email, identity.firstName, identity.lastName)],
            }
        }

        const usersPage = await userService(log).list({
            platformId,
            excludeProvider: UserIdentityProvider.JWT,
            cursorRequest: null,
            limit: count,
        })

        const scimUsers: ScimUserResource[] = await Promise.all(
            usersPage.data.map(async (user) => toScimUserResource(user, user.email, user.firstName, user.lastName)),
        )

        return {
            schemas: [SCIM_LIST_RESPONSE_SCHEMA],
            totalResults: scimUsers.length,
            startIndex,
            itemsPerPage: count,
            Resources: scimUsers,
        }
    },

    async replace(params: {
        platformId: string
        userId: string
        request: ReplaceScimUserRequest
    }): Promise<ScimUserResource> {
        const { platformId, userId, request } = params
        const { user, identity } = await getScimManagedUserOrThrow({ platformId, userId, log })

        const active = request.active !== false
        const status = active ? UserStatus.ACTIVE : UserStatus.INACTIVE

        await userService(log).update({
            id: userId,
            platformId,
            status,
            externalId: request.externalId,
            platformRole: request[SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA]?.platformRole,
        })

        await userIdentityService(log).update(user.identityId, {
            firstName: request.name?.givenName,
            lastName: request.name?.familyName,
        })

        const updatedUser = await userService(log).getOrThrow({ id: userId })
        return toScimUserResource(
            updatedUser,
            identity.email,
            request.name?.givenName ?? identity.firstName,
            request.name?.familyName ?? identity.lastName,
        )
    },

    async patch(params: {
        platformId: string
        userId: string
        request: ScimPatchRequest
    }): Promise<ScimUserResource> {
        const { platformId, userId, request } = params
        const { user, identity } = await getScimManagedUserOrThrow({ platformId, userId, log })

        let addOperationFields: {
            platformRole?: PlatformRole
            firstName?: string
            lastName?: string
            externalId?: string
            active?: boolean
        } | undefined = undefined

        // Different providers do patch operations differently some use 'replace' some use 'add'
        for (const operation of request.Operations) {
            const op = operation.op.toLowerCase()

            if (op === 'replace') {
                const value = operation.value as Record<string, unknown>
                if (!isNil(value)) {
                    await userService(log).update({
                        id: userId,
                        platformId,
                        status: isNil(value.active) ? undefined : value.active ? UserStatus.ACTIVE : UserStatus.INACTIVE,
                        externalId: value.externalId as string,
                    })
                }

                // Handle path-based replace (e.g., "active" as path)
                if (operation.path === 'active') {
                    const active = operation.value as boolean
                    await userService(log).update({
                        id: userId,
                        platformId,
                        status: active ? UserStatus.ACTIVE : UserStatus.INACTIVE,
                    })
                }
            }
            else if ( op === 'add') {
                const path = operation.path as string
                addOperationFields = addOperationFields ?? {}

                if (path === `${SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA}.platformRole` && !isEnumValue(PlatformRole, operation.value as string)) {
                    throw new Error(`Invalid platform role: ${operation.value}`)
                }
                switch (path) {
                    case `${SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA}:platformRole`:
                        addOperationFields['platformRole'] = operation.value as PlatformRole
                        break
                    case 'name.givenName':
                        addOperationFields['firstName'] = operation.value as string
                        break
                    case 'name.familyName':
                        addOperationFields['lastName'] = operation.value as string
                        break
                    case 'externalId':
                        addOperationFields['externalId'] = operation.value as string
                        break
                    case 'active':
                        addOperationFields['active'] = operation.value as boolean
                        break
                }
            }
        }

        if (!isNil(addOperationFields)) {
            const { platformRole, firstName, lastName, externalId, active } = addOperationFields
            await userService(log).update({ platformId, id: userId, platformRole, externalId, status: isNil(active) ? undefined : active ? UserStatus.ACTIVE : UserStatus.INACTIVE })
            await userIdentityService(log).update(user.identityId, { firstName, lastName })
        }

        const updatedUser = await userService(log).getOrThrow({ id: userId })
        return toScimUserResource(
            updatedUser,
            identity.email,
            addOperationFields?.firstName ?? identity.firstName,
            addOperationFields?.lastName ?? identity.lastName,
        )
    },

    async deactivate(params: {
        platformId: string
        userId: string
    }): Promise<void> {
        const { platformId, userId } = params
        await getScimManagedUserOrThrow({ platformId, userId, log })

        await userService(log).update({
            id: userId,
            platformId,
            status: UserStatus.INACTIVE,
        })
    },
})

async function getScimManagedUserOrThrow({ platformId, userId, log }: {
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<{ user: User, identity: UserIdentity }> {
    const user = await userService(log).get({ id: userId })
    if (isNil(user) || user.platformId !== platformId) {
        throw new ScimError(
            StatusCodes.NOT_FOUND,
            'User not found',
        )
    }
    const identity = await userIdentityService(log).getOneOrFail({ id: user.identityId })
    if (userIdentityHelper(log).isEmbeddedIdentity(identity)) {
        throw new ScimError(
            StatusCodes.NOT_FOUND,
            'User not found',
        )
    }
    return { user, identity }
}

function toScimUserResource(
    user: Pick<User, 'id' | 'externalId' | 'created' | 'updated' | 'status' | 'platformRole'>,
    email: string,
    firstName: string,
    lastName: string,
): ScimUserResource {
    return {
        schemas: [SCIM_USER_SCHEMA],
        id: user.id,
        externalId: user.externalId ?? undefined,
        userName: email,
        name: {
            givenName: firstName,
            familyName: lastName,
        },
        emails: [{
            value: email,
            primary: true,
        }],
        active: user.status === UserStatus.ACTIVE,
        [SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA]: {
            platformRole: user.platformRole,
        },
        meta: {
            resourceType: 'User',
            created: user.created,
            lastModified: user.updated,
            location: `/scim/v2/Users/${user.id}`,
        },
    }
}
