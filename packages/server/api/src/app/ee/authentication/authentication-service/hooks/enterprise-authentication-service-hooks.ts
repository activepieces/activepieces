import { AuthenticationServiceHooks } from '../../../../authentication/authentication-service/hooks/authentication-service-hooks'
import { flagService } from '../../../../flags/flag.service'
import { ApFlagId } from '@activepieces/shared'
import { platformService } from '../../../../platform/platform.service'
import { userService } from '../../../../user/user-service'
import { authenticationHelper } from './authentication-helper'
import { projectService } from '../../../../project/project-service'
import { enforceLimits } from '../../../helper/license-validator'

const DEFAULT_PLATFORM_NAME = 'platform'

export const enterpriseAuthenticationServiceHooks: AuthenticationServiceHooks = {
    async preSignIn({ email, platformId, provider }) {
        await authenticationHelper.assertEmailAuthIsEnabled({
            platformId,
            provider,
        })
        await authenticationHelper.assertDomainIsAllowed({ email, platformId })
    },
    async preSignUp({ email, platformId, provider }) {
        await authenticationHelper.assertEmailAuthIsEnabled({
            platformId,
            provider,
        })
        await authenticationHelper.assertUserIsInvitedAndDomainIsAllowed({
            email,
            platformId,
        })
    },
    async postSignUp({ user }) {
        const platformCreated = await flagService.getOne(
            ApFlagId.PLATFORM_CREATED,
        )
        if (platformCreated?.value) {
            const result = await authenticationHelper.getProjectAndTokenOrThrow(user)
            return {
                user,
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

        await userService.updatePlatformId({
            id: user.id,
            platformId: platform.id,
        })

        await enforceLimits()

        await flagService.save({
            id: ApFlagId.PLATFORM_CREATED,
            value: true,
        })

        await authenticationHelper.autoVerifyUserIfEligible(user)
        const updatedUser = await userService.getOneOrFail({ id: user.id })
        const result = await authenticationHelper.getProjectAndTokenOrThrow(updatedUser)
        return {
            user: updatedUser,
            ...result,
        }
    },

    async postSignIn({ user }) {
        const result = await authenticationHelper.getProjectAndTokenOrThrow(user)
        return {
            user,
            ...result,
        }
    },
}
