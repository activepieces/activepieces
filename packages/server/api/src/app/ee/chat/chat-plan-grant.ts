import { isEmpty, isNil, tryCatch } from '@activepieces/core-utils'
import { safeHttp } from '@activepieces/server-utils'
import { ApEdition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { isNotOneOfTheseEditions } from '../../database/database-common'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { billingProvider } from '../../platform/billing-provider'
import { platformService } from '../../platform/platform.service'
import { userService } from '../../user/user-service'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { chatRolloutService } from './chat-rollout-service'

const REQUEST_TIMEOUT_MS = 30000

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
        const email = await resolveOwnerEmail(log, platformId)
        const licenseKey = await requestGrant({ email, log })
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

async function requestGrant({ email, log }: { email: string, log: FastifyBaseLogger }): Promise<string> {
    const secret = system.get(AppSystemProp.CONSOLE_API_SECRET_KEY)
    if (isNil(secret) || isEmpty(secret)) {
        throw new Error('CONSOLE_API_SECRET_KEY is not configured')
    }
    const baseUrl = system.getOrThrow(AppSystemProp.AUTUMN_CONSOLE_URL).replace(/\/+$/, '')
    const response = await safeHttp.axios.post<GrantChatPlanEnvelope>(
        `${baseUrl}/api/external/grant-chat-plan`,
        { email },
        {
            timeout: REQUEST_TIMEOUT_MS,
            headers: { Authorization: `Bearer ${secret}` },
        },
    )
    const licenseKey = response.data.data?.licenseKey
    if (isNil(licenseKey) || isEmpty(licenseKey)) {
        log.error({ status: response.status }, 'Console returned no license key for the chat plan grant')
        throw new Error('Console returned no license key for the chat plan grant')
    }
    return licenseKey
}

async function resolveOwnerEmail(log: FastifyBaseLogger, platformId: string): Promise<string> {
    const platform = await platformService(log).getOneOrThrow(platformId)
    const owner = await userService(log).getMetaInformation({ id: platform.ownerId })
    return owner.email
}

type GrantChatPlanParams = {
    userId: string
    platformId: string
    log: FastifyBaseLogger
}

type GrantChatPlanEnvelope = {
    success: boolean
    data: {
        licenseKey: string | null
    }
}
