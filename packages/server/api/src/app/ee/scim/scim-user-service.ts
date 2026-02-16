import { cryptoUtils } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    DefaultProjectRole,
    ErrorCode,
    isNil,
    PlatformRole,
    User,
    UserIdentityProvider,
    UserStatus,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { userService } from '../../user/user-service'
import {
    CreateScimUserRequest,
    ReplaceScimUserRequest,
    SCIM_USER_SCHEMA,
    ScimListResponse,
    ScimPatchRequest,
    ScimUserResource,
    SCIM_LIST_RESPONSE_SCHEMA,
    SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA,
} from '@activepieces/ee-shared'
import { projectService } from '../../project/project-service'
import { projectMemberService } from '../projects/project-members/project-member.service'
import { platformService } from '../../platform/platform.service'

export const scimUserService = (log: FastifyBaseLogger) => ({
    async create(params: {
        platformId: string,
        request: CreateScimUserRequest
    }): Promise<ScimUserResource> {
        const { platformId, request } = params
        const email = request.userName.toLowerCase().trim()
        const firstName = request.name?.givenName ?? ''
        const lastName = request.name?.familyName ?? ''
        const externalId = request.externalId
        const active = request.active !== false
        const password = request.password ?? await cryptoUtils.generateRandomPassword()
        const platformRole = request[SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA]?.platformRole ?? PlatformRole.MEMBER

        // Check if user with this externalId already exists on this platform
        if (!isNil(externalId)) {
            const existingUser = await userService.getByPlatformAndExternalId({
                platformId,
                externalId,
            })
            if (!isNil(existingUser)) {
                throw new ActivepiecesError({
                    code: ErrorCode.EXISTING_USER,
                    params: {
                        email,
                        platformId,
                    },
                })
            }
        }

        // Get or create the identity
        let identity = await userIdentityService(log).getIdentityByEmail(email)
        if (isNil(identity)) {
            identity = await userIdentityService(log).create({
                email,
                password,
                firstName,
                lastName,
                trackEvents: false,
                newsLetter: false,
                provider: UserIdentityProvider.EMAIL,
                verified: true,
            })
        }

        // Check if user already exists on this platform with this identity
        const existingUserForIdentity = await userService.getOneByIdentityAndPlatform({
            identityId: identity.id,
            platformId,
        })
        if (!isNil(existingUserForIdentity)) {
            throw new ActivepiecesError({
                code: ErrorCode.EXISTING_USER,
                params: {
                    email,
                    platformId,
                },
            })
        }


        const user = await userService.create({
            identityId: identity.id,
            platformId,
            externalId,
            platformRole,
        })

        if (!active) {
            await userService.update({
                id: user.id,
                platformId,
                status: UserStatus.INACTIVE,
            })
        }

        const defaultProject = await projectService.getOneByOwnerAndPlatform({ ownerId: 
            (await platformService.getOneOrThrow(platformId)).ownerId,
            platformId,
        })
        assertNotNullOrUndefined(defaultProject, 'Default project not found')

        await projectMemberService(log).upsert({
            userId: user.id,
            projectId: defaultProject.id,
            projectRoleName: DefaultProjectRole.VIEWER,
        })

        const finalUser = active ? user : await userService.getOrThrow({ id: user.id })
        return toScimUserResource(finalUser, identity.email, identity.firstName, identity.lastName)
    },

    async getById(params: {
        platformId: string
        userId: string
    }): Promise<ScimUserResource> {
        const { platformId, userId } = params
        const user = await userService.get({ id: userId })

        if (isNil(user) || user.platformId !== platformId) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'user',
                    entityId: userId,
                },
            })
        }

        const identity = await userIdentityService(log).getBasicInformation(user.identityId)
        return toScimUserResource(user, identity.email, identity.firstName, identity.lastName)
    },

    async list(params: {
        platformId: string
        filter?: string
        startIndex?: number
        count?: number
    }): Promise<ScimListResponse> {
        const { platformId, filter, startIndex = 1, count = 100 } = params

        // Parse SCIM filter - we support "userName eq \"value\""
        let filterEmail: string | undefined
        if (!isNil(filter)) {
            const match = filter.match(/userName\s+eq\s+"([^"]+)"/i)
            if (match) {
                filterEmail = match[1].toLowerCase().trim()
            }
        }

        // If filtering by email, do a targeted lookup
        if (!isNil(filterEmail)) {
            const identity = await userIdentityService(log).getIdentityByEmail(filterEmail)
            if (isNil(identity)) {
                return {
                    schemas: [SCIM_LIST_RESPONSE_SCHEMA],
                    totalResults: 0,
                    startIndex,
                    itemsPerPage: count,
                    Resources: [],
                }
            }
            const user = await userService.getOneByIdentityAndPlatform({
                identityId: identity.id,
                platformId,
            })
            if (isNil(user)) {
                return {
                    schemas: [SCIM_LIST_RESPONSE_SCHEMA],
                    totalResults: 0,
                    startIndex,
                    itemsPerPage: count,
                    Resources: [],
                }
            }
            return {
                schemas: [SCIM_LIST_RESPONSE_SCHEMA],
                totalResults: 1,
                startIndex,
                itemsPerPage: count,
                Resources: [toScimUserResource(user, identity.email, identity.firstName, identity.lastName)],
            }
        }

        // List all platform users
        const usersPage = await userService.list({
            platformId,
            cursorRequest: null,
            limit: count,
        })

        const scimUsers: ScimUserResource[] = await Promise.all(
            usersPage.data.map(async (userMeta) => {
                return {
                    schemas: [SCIM_USER_SCHEMA],
                    id: userMeta.id,
                    externalId: userMeta.externalId ?? undefined,
                    userName: userMeta.email,
                    name: {
                        givenName: userMeta.firstName,
                        familyName: userMeta.lastName,
                    },
                    emails: [{
                        value: userMeta.email,
                        primary: true,
                    }],
                    active: userMeta.status === UserStatus.ACTIVE,
                    meta: {
                        resourceType: 'User',
                        created: userMeta.created,
                        lastModified: userMeta.updated,
                        location: `/scim/v2/Users/${userMeta.id}`,
                    },
                }
            }),
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
        const user = await userService.get({ id: userId })

        if (isNil(user) || user.platformId !== platformId) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'user',
                    entityId: userId,
                },
            })
        }

        const active = request.active !== false
        const status = active ? UserStatus.ACTIVE : UserStatus.INACTIVE

        await userService.update({
            id: userId,
            platformId,
            status,
            externalId: request.externalId,
            platformRole: request[SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA]?.platformRole,
        })

        await userIdentityService(log).update(user.identityId, {
            firstName: request.name?.givenName,
            lastName: request.name?.familyName,
            password: request.password,
        })
        const updatedIdentity = await userIdentityService(log).getBasicInformation(user.identityId)

        const updatedUser = await userService.getOrThrow({ id: userId })
        return toScimUserResource(updatedUser, updatedIdentity.email, updatedIdentity.firstName, updatedIdentity.lastName)
    },

    async patch(params: {
        platformId: string
        userId: string
        request: ScimPatchRequest
    }): Promise<ScimUserResource> {
        const { platformId, userId, request } = params
        const user = await userService.get({ id: userId })

        if (isNil(user) || user.platformId !== platformId) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'user',
                    entityId: userId,
                },
            })
        }

        for (const operation of request.Operations) {
            const op = operation.op.toLowerCase()
            if (op === 'replace') {
                const value = operation.value as Record<string, unknown>
                if (!isNil(value)) {
                    // Handle active status
                    if ('active' in value) {
                        const active = value.active as boolean
                        await userService.update({
                            id: userId,
                            platformId,
                            status: active ? UserStatus.ACTIVE : UserStatus.INACTIVE,
                        })
                    }
                    if ('externalId' in value) {
                        await userService.update({
                            id: userId,
                            platformId,
                            externalId: value.externalId as string,
                        })
                    }
                }

                // Handle path-based replace (e.g., "active" as path)
                if (operation.path === 'active') {
                    const active = operation.value as boolean
                    await userService.update({
                        id: userId,
                        platformId,
                        status: active ? UserStatus.ACTIVE : UserStatus.INACTIVE,
                    })
                }
            }
        }

        const updatedUser = await userService.getOrThrow({ id: userId })
        const identity = await userIdentityService(log).getBasicInformation(updatedUser.identityId)
        return toScimUserResource(updatedUser, identity.email, identity.firstName, identity.lastName)
    },

    async deactivate(params: {
        platformId: string
        userId: string
    }): Promise<void> {
        const { platformId, userId } = params
        const user = await userService.get({ id: userId })

        if (isNil(user) || user.platformId !== platformId) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'user',
                    entityId: userId,
                },
            })
        }

        await userService.update({
            id: userId,
            platformId,
            status: UserStatus.INACTIVE,
        })
    },
})

function toScimUserResource(
    user: User,
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
        meta: {
            resourceType: 'User',
            created: user.created,
            lastModified: user.updated,
            location: `/scim/v2/Users/${user.id}`,
        },
    }
}
