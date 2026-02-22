import {
    CreateScimUserRequest,
    ReplaceScimUserRequest,
    SCIM_CUSTOM_USER_ATTRIBUTES_SCHEMA,
    SCIM_LIST_RESPONSE_SCHEMA,
    SCIM_USER_SCHEMA,
    ScimError,
    ScimListResponse,
    ScimPatchRequest,
    ScimUserResource,
} from '@activepieces/ee-shared'
import { cryptoUtils } from '@activepieces/server-shared'
import {
    assertNotNullOrUndefined,
    DefaultProjectRole,
    InvitationStatus,
    InvitationType,
    isNil,
    PlatformRole,
    User,
    UserIdentityProvider,
    UserStatus,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'
import { projectMemberService } from '../projects/project-members/project-member.service'

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
            const existingUser = await userService.getByPlatformAndExternalId({
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

        const existingUserForIdentity = await userService.getOneByIdentityAndPlatform({
            identityId: identity.id,
            platformId,
        })
        if (!isNil(existingUserForIdentity)) {
            throw new ScimError(
                StatusCodes.CONFLICT,
                'User with email already exists',
            )
        }

        const user = await userService.create({
            identityId: identity.id,
            platformId,
            externalId,
            platformRole,
            isActive: active,
        })

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

        await userInvitationsService(log).create({
            email,
            platformId,
            platformRole,
            projectId: null,
            projectRoleId: null,
            type: InvitationType.PLATFORM,
            invitationExpirySeconds: 7 * 24 * 60 * 60,
            status: InvitationStatus.PENDING,
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
            throw new ScimError(
                StatusCodes.NOT_FOUND,
                'User not found',
            )
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

        const usersPage = await userService.list({
            platformId,
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
        const user = await userService.get({ id: userId })

        if (isNil(user) || user.platformId !== platformId) {
            throw new ScimError(
                StatusCodes.NOT_FOUND,
                'User not found',
            )
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
            throw new ScimError(
                StatusCodes.NOT_FOUND,
                'User not found',
            )
        }

        for (const operation of request.Operations) {
            const op = operation.op.toLowerCase()
            if (op === 'replace') {
                const value = operation.value as Record<string, unknown>
                if (!isNil(value)) {
                    await userService.update({
                        id: userId,
                        platformId,
                        status: isNil(value.active) ? undefined : value.active ? UserStatus.ACTIVE : UserStatus.INACTIVE,
                        externalId: value.externalId as string,
                    })
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
            throw new ScimError(
                StatusCodes.NOT_FOUND,
                'User not found',
            )
        }

        await userService.update({
            id: userId,
            platformId,
            status: UserStatus.INACTIVE,
        })
    },
})

function toScimUserResource(
    user: Pick<User, 'id' | 'externalId' | 'created' | 'updated' | 'status'>,
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
