import { isNil, tryCatch } from '@activepieces/core-utils'
import { apDayjs } from '@activepieces/server-utils'
import { TelemetryEventName } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityRepository } from '../../authentication/user-identity/user-identity-service'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-props'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { telemetry } from '../../helper/telemetry.utils'
import { billingProvider } from '../../platform/billing-provider'
import { InvitedUserJoinedParams } from '../../user-invitations/user-invitation-hooks'
import { autumnConsole, ConsoleCustomerCall } from '../platform/platform-plan/billing-providers/autumn-utils'

export const inviteRewardService = (log: FastifyBaseLogger) => ({
    async scheduleGrant({ platformId, identityId }: InvitedUserJoinedParams): Promise<void> {
        await systemJobsSchedule(log).upsertJob({
            job: {
                name: SystemJobName.INVITE_REWARD_GRANT,
                data: { platformId, identityId },
                jobId: `invite-reward-grant-${platformId}-${identityId}`,
            },
            schedule: { type: 'one-time', date: apDayjs() },
            customConfig: {
                attempts: GRANT_ATTEMPTS,
                backoff: { type: 'exponential', delay: GRANT_RETRY_BASE_DELAY_MS },
            },
        })
    },

    async grantOnJoin({ platformId, identityId }: InvitedUserJoinedParams): Promise<void> {
        const identity = await userIdentityRepository().findOneBy({ id: identityId })
        if (isNil(identity)) {
            return
        }
        const creds = await loadCredsEnrollingIfMissing({ log, platformId })
        if (isNil(creds)) {
            log.info({ platform: { id: platformId } }, '[inviteReward#grantOnJoin] no billing account, no reward')
            return
        }
        const result = await autumnConsole.grantInviteReward({
            autumnCustomerId: creds.autumnCustomerId,
            inviteeEmail: identity.email,
            credits: system.getNumberOrThrow(AppSystemProp.INVITE_REWARD_CREDITS),
        })
        if (!result.granted) {
            log.info({ platform: { id: platformId }, reason: result.reason }, '[inviteReward#grantOnJoin] no reward')
            return
        }
        const { error } = await tryCatch(() => billingProvider.get(log).refreshEntitlements(platformId))
        if (!isNil(error)) {
            log.warn({ error, platform: { id: platformId } }, '[inviteReward] balance refresh failed after a grant')
        }
        await telemetry(log).trackPlatform({
            platformId,
            event: {
                name: TelemetryEventName.INVITE_REWARD_GRANTED,
                payload: { platformId, credits: result.credits, rewardsEarned: result.rewardsEarned },
            },
        })
    },
})

async function loadCredsEnrollingIfMissing({ log, platformId }: LoadCredsParams): Promise<ConsoleCustomerCall | null> {
    const creds = await autumnConsole.getCreds(log, platformId)
    if (!isNil(creds)) {
        return creds
    }
    await billingProvider.get(log).ensureEnrolled(platformId)
    return autumnConsole.getCreds(log, platformId)
}

const GRANT_ATTEMPTS = 12
const GRANT_RETRY_BASE_DELAY_MS = 30_000

type LoadCredsParams = {
    log: FastifyBaseLogger
    platformId: string
}
