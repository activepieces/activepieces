import { isNil, tryCatch } from '@activepieces/core-utils'
import { ApEdition } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { isNotOneOfTheseEditions } from '../../database/database-common'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { chatRolloutService } from './chat-rollout-service'

const CONSOLE_FUNNEL_URL = 'https://console.activepieces.com/api/chat-analytics/external/funnel'
const REQUEST_TIMEOUT_MS = 30000

export const chatFunnelSync = (log: FastifyBaseLogger) => ({
    // Cloud-only, fire-and-forget. The funnel is a global (instance-wide) metric, so it is
    // authenticated with the instance CONSOLE_API_SECRET_KEY rather than a per-platform license
    // key (most cloud chatters are free users with no license key).
    async pushSnapshot(): Promise<void> {
        if (isNotOneOfTheseEditions([ApEdition.CLOUD])) {
            return
        }
        const secret = system.get(AppSystemProp.CONSOLE_API_SECRET_KEY)
        if (isNil(secret)) {
            log.debug('[chatFunnelSync] CONSOLE_API_SECRET_KEY not set, skipping funnel sync')
            return
        }

        const aggregate = await chatRolloutService.getFunnelAggregate()
        const result = await tryCatch(() => fetch(CONSOLE_FUNNEL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${secret}`,
            },
            body: JSON.stringify(aggregate),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        }))

        if (result.error) {
            log.error({ error: result.error }, '[chatFunnelSync] Failed to push chat funnel telemetry')
            return
        }
        if (!result.data.ok) {
            log.error({ status: result.data.status }, '[chatFunnelSync] Funnel telemetry non-2xx response')
        }
    },
})
