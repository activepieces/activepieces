import { isEmpty, isNil, tryCatch } from '@activepieces/core-utils'
import { ApEdition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { isNotOneOfTheseEditions } from '../../database/database-common'
import { billingProvider } from '../../platform/billing-provider'
import { autumnConsole, autumnUtils } from '../platform/platform-plan/billing-providers/autumn-utils'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { chatRolloutService } from './chat-rollout-service'

async function grant({ userId, platformId, log }: GrantChatPlanParams): Promise<void> {
    if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
        return
    }

    const claimed = await chatRolloutService.claimFreeCreditGrant({ userId })
    if (!claimed) {
        return
    }

    const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
    if (!isNil(platformPlan.licenseKey) && !isEmpty(platformPlan.licenseKey)) {
        log.info({ platform: { id: platformId } }, 'Skipping chat plan grant; the platform already has a license key')
        return
    }

    const { error } = await tryCatch(async () => {
        const email = await autumnUtils.getPlatformOwnerEmail(log, platformId)
        const licenseKey = await autumnConsole.grantChatPlan({ email })
        await billingProvider.get(log).activateLicense({ platformId, licenseKey })
    })

    if (!isNil(error)) {
        await chatRolloutService.releaseFreeCreditGrant({ userId })
        log.warn({ error, platform: { id: platformId }, user: { id: userId } }, 'Chat plan grant failed; released the claim so a later message retries')
        return
    }

    log.info({ platform: { id: platformId }, user: { id: userId } }, 'Granted the chat plan for a first-time chatter')
}

export const chatPlanGrant = {
    grant,
}

type GrantChatPlanParams = {
    userId: string
    platformId: string
    log: FastifyBaseLogger
}
