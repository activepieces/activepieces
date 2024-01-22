import {
    AuthenticationServiceHooks,
} from '../../../../authentication/authentication-service/hooks/authentication-service-hooks'
import { flagService } from '../../../../flags/flag.service'
import { ApFlagId } from '@activepieces/shared'
import { platformService } from '../../../../platform/platform.service'
import { userService } from '../../../../user/user-service'
import { authenticationHelper } from './authentication-helper'
import { projectService } from '../../../../project/project-service'
import { enforceLimits } from '../../../helper/license-validator'

const DEFAULT_PLATFORM_NAME = 'platform'

export const enterpriseAuthenticationServiceHooks: AuthenticationServiceHooks = {
    async preSignIn({ email, platformId }) {
        await authenticationHelper.assertEmailAuthIsEnabled({ platformId })
        await authenticationHelper.assertDomainIsAllowed({ email, platformId })
    },
    async preSignUp({ email, platformId }) {
        await authenticationHelper.assertEmailAuthIsEnabled({ platformId })
        await authenticationHelper.assertUserIsInvitedAndDomainIsAllowed({ email, platformId })
    },
    async postSignUp({ user }) {
        const platformCreated = await flagService.getOne(ApFlagId.PLATFORM_CREATED)
        if (platformCreated?.value) {
            await authenticationHelper.autoVerifyUserIfEligible(user)
            return authenticationHelper.getProjectAndTokenOrThrow(user)
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

        await userService.updatePlatformId({ id: user.id, platformId: platform.id })


        await flagService.save({
            id: ApFlagId.PLATFORM_CREATED,
            value: true,
        })

        await userService.verify({ id: user.id })
        await enforceLimits()
        return authenticationHelper.getProjectAndTokenOrThrow(user)
    },

    async postSignIn({ user }) {
        return authenticationHelper.getProjectAndTokenOrThrow(user)
    },
}
