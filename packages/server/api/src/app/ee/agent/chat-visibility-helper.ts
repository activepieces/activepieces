import { ActivepiecesError, ErrorCode } from '@activepieces/core-utils'
import { chatVisibility, PlatformWithoutSensitiveData, PrincipalType } from '@activepieces/shared'
import { onRequestAsyncHookHandler } from 'fastify'
import { system } from '../../helper/system/system'
import { userIdentityHelper } from '../../helper/user-identity-helper'
import { platformService } from '../../platform/platform.service'

function resolveChatEnabledForUser({ platform, isEmbedded }: {
    platform: PlatformWithoutSensitiveData
    isEmbedded: boolean
}): boolean {
    return chatVisibility.resolveChatEnabled({
        edition: system.getEdition(),
        isEmbedded,
        planChatEnabled: platform.plan.chatEnabled,
    })
}

export const chatVisibilityHelper = {
    resolveChatEnabledForUser,
}

export const chatVisibilityGuard: onRequestAsyncHookHandler = async (request) => {
    const principal = request.principal
    if (principal.type !== PrincipalType.USER || !('platform' in principal)) {
        throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'Platform user is required' } })
    }
    const platform = await platformService(request.log).getOneWithPlanOrThrow(principal.platform.id)
    const isEmbedded = await userIdentityHelper(request.log).isUserEmbedded(principal.id)
    const enabled = resolveChatEnabledForUser({ platform, isEmbedded })
    if (!enabled) {
        throw new ActivepiecesError({ code: ErrorCode.FEATURE_DISABLED, params: { message: 'Feature is disabled' } })
    }
}
