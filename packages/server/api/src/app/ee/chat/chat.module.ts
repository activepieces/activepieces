import { ApEdition, ApEnvironment } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { chatController } from './chat-controller'
import { chatVisibilityGuard } from './chat-visibility-helper'
import { chatPersonalizationController } from './personalization/chat-personalization-controller'

export const chatModule: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', chatVisibilityGuard)
    await app.register(chatController, { prefix: '/v1/chat' })
    // Onboarding personalization launches on Cloud only (chatModule itself is
    // also registered for Enterprise). Dev stacks running other editions get it
    // via the chat auto-setup prop so the journey stays testable everywhere.
    if (system.getEdition() === ApEdition.CLOUD || devAutoSetupEnabled()) {
        await app.register(chatPersonalizationController, { prefix: '/v1/chat/personalization' })
    }
}

function devAutoSetupEnabled(): boolean {
    const environment = system.getOrThrow(AppSystemProp.ENVIRONMENT)
    return environment !== ApEnvironment.PRODUCTION && (system.getBoolean(AppSystemProp.CHAT_DEV_AUTO_SETUP) ?? false)
}
