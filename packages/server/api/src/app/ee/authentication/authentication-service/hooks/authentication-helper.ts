import {
    ActivepiecesError,
    assertNotNullOrUndefined,
    ErrorCode,
    isNil,
    PrincipalType,
    Project,
    User,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Provider } from '../../../../authentication/authentication-service/hooks/authentication-service-hooks'
import { accessTokenManager } from '../../../../authentication/lib/access-token-manager'
import { flagService } from '../../../../flags/flag.service'
import { platformService } from '../../../../platform/platform.service'
import { projectService } from '../../../../project/project-service'
import { userService } from '../../../../user/user-service'
import { userInvitationsService } from '../../../../user-invitations/user-invitation.service'
import { platformProjectService } from '../../../projects/platform-project-service'

export const authenticationHelper = (log: FastifyBaseLogger) => ({
    async getProjectAndTokenOrThrow(user: User): Promise<{ project: Project, token: string }> {
        const project = await (async (user: User): Promise<Project> => {
            const invitedProject = await (async (user: User): Promise<Project | null> => {
                const { platformId } = user
                assertNotNullOrUndefined(platformId, 'platformId')
                const platformProjects = await platformProjectService(log).getAll({
                    principalType: PrincipalType.USER,
                    principalId: user.id,
                    platformId,
                    cursorRequest: null,
                    limit: 1,
                })

                if (platformProjects.data.length === 0) {
                    return null
                }

                return projectService.getOneOrThrow(platformProjects.data[0].id)
            })(user)
            if (!isNil(invitedProject)) {
                return invitedProject
            }
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'project',
                    message: `no projects found for the user=${user.id}`,
                },
            })
        })(user)

        const token = await (async ({
            user,
            project,
        }: {
            user: User
            project: Project
        }): Promise<string> => {
            const platform = await platformService.getOneOrThrow(project.platformId)
            const updatedToken = await accessTokenManager.generateToken({
                id: user.id,
                type: PrincipalType.USER,
                projectId: project.id,
                platform: {
                    id: platform.id,
                },
                tokenVersion: user.tokenVersion,
            })

            return updatedToken
        })({
            user,
            project,
        })
        return {
            project,
            token,
        }
    },

    async autoVerifyUserIfEligible(user: User): Promise<void> {
        assertNotNullOrUndefined(user.platformId, 'platformId')
        const isInvited = await userInvitationsService(log).hasAnyAcceptedInvitations({
            platformId: user.platformId,
            email: user.email,
        })
        if (isInvited) {
            await userService.verify({
                id: user.id,
            })
            return
        }
    },

    async assertUserIsInvitedAndDomainIsAllowed({
        email,
        platformId,
    }: {
        email: string
        platformId: string | null
    }): Promise<void> {
        await (async ({
            email,
            platformId,
        }: {
            email: string
            platformId: string | null
        }): Promise<void> => {
            if (isNil(platformId)) {
                return
            }
            const platform = await platformService.getOneOrThrow(platformId)
            if (!platform.ssoEnabled) {
                return
            }
            const emailDomain = email.split('@')[1]
            const isAllowedDomaiin =
                !platform.enforceAllowedAuthDomains ||
                platform.allowedAuthDomains.includes(emailDomain)

            if (!isAllowedDomaiin) {
                throw new ActivepiecesError({
                    code: ErrorCode.DOMAIN_NOT_ALLOWED,
                    params: {
                        domain: emailDomain,
                    },
                })
            }
        })({ email, platformId })
        const customerPlatformEnabled =
            !isNil(platformId) && !flagService.isCloudPlatform(platformId)
        if (customerPlatformEnabled) {
            await (async ({
                email,
                platformId,
            }: {
                email: string
                platformId: string
            }): Promise<void> => {
                const isInvited = await userInvitationsService(log).hasAnyAcceptedInvitations({
                    platformId,
                    email,
                })
                if (!isInvited) {
                    throw new ActivepiecesError({
                        code: ErrorCode.INVITATION_ONLY_SIGN_UP,
                        params: {},
                    })
                }
            })({ email, platformId })
        }
    },

    async assertDomainIsAllowed({
        email,
        platformId,
    }: {
        email: string
        platformId: string | null
    }): Promise<void> {
        if (isNil(platformId)) {
            return
        }
        const platform = await platformService.getOneOrThrow(platformId)
        if (!platform.ssoEnabled) {
            return
        }
        const emailDomain = email.split('@')[1]
        const isAllowedDomaiin =
            !platform.enforceAllowedAuthDomains ||
            platform.allowedAuthDomains.includes(emailDomain)

        if (!isAllowedDomaiin) {
            throw new ActivepiecesError({
                code: ErrorCode.DOMAIN_NOT_ALLOWED,
                params: {
                    domain: emailDomain,
                },
            })
        }
    },

    async assertEmailAuthIsEnabled({
        platformId,
        provider,
    }: {
        platformId: string | null
        provider: Provider
    }): Promise<void> {
        if (isNil(platformId)) {
            return
        }
        const platform = await platformService.getOneOrThrow(platformId)
        if (!platform.ssoEnabled) {
            return
        }
        if (provider !== Provider.EMAIL) {
            return
        }
        if (!platform.emailAuthEnabled) {
            throw new ActivepiecesError({
                code: ErrorCode.EMAIL_AUTH_DISABLED,
                params: {},
            })
        }
    },
})
