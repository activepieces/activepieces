import { assertNotNullOrUndefined } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { AuthenticationServiceHooks } from '../../../../authentication/authentication-service/hooks/authentication-service-hooks'
import { platformService } from '../../../../platform/platform.service'
import { projectService } from '../../../../project/project-service'
import { userService } from '../../../../user/user-service'
import { userInvitationsService } from '../../../../user-invitations/user-invitation.service'
import { authenticationHelper } from './authentication-helper'

const DEFAULT_PLATFORM_NAME = 'Activepieces'

export const enterpriseAuthenticationServiceHooks = (log: FastifyBaseLogger): AuthenticationServiceHooks => ({
    async preSignIn({ email, platformId, provider }) {
        await authenticationHelper(log).assertEmailAuthIsEnabled({
            platformId,
            provider,
        })
        await authenticationHelper(log).assertDomainIsAllowed({ email, platformId })
    },
    async preSignUp({ email, platformId, provider }) {
        await authenticationHelper(log).assertEmailAuthIsEnabled({
            platformId,
            provider,
        })
        await authenticationHelper(log).assertUserIsInvitedAndDomainIsAllowed({
            email,
            platformId,
        })
    },
    async postSignUp({ user }) {
        const platformCreated = await platformService.hasAnyPlatforms()
        if (platformCreated) {
            log.info({
                email: user.email,
                platformId: user.platformId,
            }, '[postSignUp] provisionUserInvitation')
            await authenticationHelper(log).autoVerifyUserIfEligible(user)
            await userInvitationsService(log).provisionUserInvitation({
                email: user.email,
                platformId: user.platformId!,
            })
            const updatedUser = await userService.getOneOrFail({ id: user.id })
            const result = await authenticationHelper(log).getProjectAndTokenOrThrow(user)
            return {
                user: updatedUser,
                ...result,
            }
        }

        const platform = await platformService.create({
            ownerId: user.id,
            name: DEFAULT_PLATFORM_NAME,
        })


        await projectService.create({
            displayName: `${user.firstName}'s Project`,
            ownerId: user.id,
            platformId: platform.id,
        })

        await userInvitationsService(log).provisionUserInvitation({
            email: user.email,
            platformId: user.platformId!,
        })

        await userService.verify({ id: user.id })
        const updatedUser = await userService.getOneOrFail({ id: user.id })
        const result = await authenticationHelper(log).getProjectAndTokenOrThrow(updatedUser)
        return {
            user: updatedUser,
            ...result,
        }
    },

    async postSignIn({ user }) {
        assertNotNullOrUndefined(user.platformId, 'Platform id is not defined')
        await userInvitationsService(log).provisionUserInvitation({
            email: user.email,
            platformId: user.platformId,
        })
        const result = await authenticationHelper(log).getProjectAndTokenOrThrow(user)
        return {
            user,
            ...result,
        }
    },
})
