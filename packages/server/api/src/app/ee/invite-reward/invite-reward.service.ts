import { isNil, tryCatch } from '@activepieces/core-utils'
import { InviteRewardSummary, TelemetryEventName } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { telemetry } from '../../helper/telemetry.utils'
import { billingProvider } from '../../platform/billing-provider'
import { InvitedUserJoinedParams } from '../../user-invitations/user-invitation-hooks'
import { autumnConsole } from '../platform/platform-plan/billing-providers/autumn-utils'

export const inviteRewardService = (log: FastifyBaseLogger) => ({
    async grantOnJoin({ platformId, email }: InvitedUserJoinedParams): Promise<void> {
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return
        }
        const result = await autumnConsole.grantInviteReward({ autumnCustomerId: creds.autumnCustomerId, inviteeEmail: email })
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

    async getSummary({ platformId }: { platformId: string }): Promise<InviteRewardSummary> {
        const creds = await autumnConsole.getCreds(log, platformId)
        if (isNil(creds)) {
            return NOT_ELIGIBLE
        }
        return autumnConsole.listInviteRewards(creds)
    },
})

const NOT_ELIGIBLE: InviteRewardSummary = {
    eligible: false,
    creditsPerInvite: 0,
    maxRewards: 0,
    rewards: [],
}
